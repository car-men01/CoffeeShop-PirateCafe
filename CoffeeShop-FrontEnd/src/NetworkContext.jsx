import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_URL, SERVER_CHECK_INTERVAL } from "./config";

export const NetworkContext = createContext({
    isOnline: true,
    isServerUp: true,
    pendingOperations: [],
    isSyncing: false,
    syncPendingOperations: async () => {},
    apiGet: async () => {},
    apiPost: async () => {},
    apiPut: async () => {},
    apiDelete: async () => {}
  });

export const NetworkProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServerUp, setIsServerUp] = useState(true);
  const [pendingOperations, setPendingOperations] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncLocked, setIsSyncLocked] = useState(false);

  useEffect(() => {
    // Clear any stale sync locks on component mount
    const syncLockTimestamp = localStorage.getItem('syncInProgress');
    if (syncLockTimestamp) {
      const now = Date.now();
      const syncStartTime = parseInt(syncLockTimestamp);
      
      // If the sync started more than 30 seconds ago, it's stale
      if (now - syncStartTime > 30000) {
        console.log('Found stale sync lock on component mount - clearing it');
        localStorage.removeItem('syncInProgress');
      }
    }
    
    // Check for and clear any other stale flags
    if (isOnline && isServerUp) {
      localStorage.removeItem('serverWasDown');
    }
  }, []);

  // Clear any stale sync flags on component load
  useEffect(() => {
    // Check if there's a stale sync in progress flag
    const isSyncInProgress = localStorage.getItem('syncInProgress');
    if (isSyncInProgress) {
      const syncStartTime = parseInt(isSyncInProgress);
      const now = Date.now();
      
      // If the sync started more than 1 minute ago, it's definitely stale
      if (now - syncStartTime > 60000) {
        console.log('Clearing stale sync lock on component load');
        localStorage.removeItem('syncInProgress');
      }
    }
  }, []);

  // Load any pending operations from localStorage on mount
  useEffect(() => {
    const storedOperations = localStorage.getItem('pendingOperations');
    if (storedOperations) {
      setPendingOperations(JSON.parse(storedOperations));
    }
  }, []);
  
  // Save pending operations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pendingOperations', JSON.stringify(pendingOperations));
  }, [pendingOperations]);

  // cache categories
    useEffect(() => {
        const cacheCategories = async () => {
            if (isOnline && isServerUp) {
                try {
                    const response = await axios.get(`${API_URL}/products/categories`);
                    if (response.data) {
                        localStorage.setItem('cachedCategories', JSON.stringify(response.data));
                        console.log('Categories cached for offline use');
                    }
                } catch (err) {
                    console.warn('Failed to cache categories:', err);
                }
            }
        };
        
        cacheCategories();
    }, [isOnline, isServerUp]);

  // Check if the server is up
  const checkServerStatus = useCallback(async () => {
    if (!navigator.onLine) {
      setIsServerUp(false);
      return;
    }
    
    try {
      await axios.get(`${API_URL}/products/categories`, { timeout: 5000 });
      setIsServerUp(true);
      return true;
    } catch (error) {
      console.error("Server health check failed:", error);
      setIsServerUp(false);
      return false;
    }
  }, []);

  // Setup online/offline listeners
  useEffect(() => {
    const handleOnline = () => {
      console.log("Browser reports online status");
      setIsOnline(true);
      checkServerStatus();
    };
    
    const handleOffline = () => {
      console.log("Browser reports offline status");
      setIsOnline(false);
      setIsServerUp(false);
    };
  
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  
    // Initial check
    checkServerStatus();
    
    // Setup periodic server checks when online
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        checkServerStatus();
      }
    }, SERVER_CHECK_INTERVAL);
  
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [checkServerStatus]); // Remove pendingOperations from here
  
  // Add a separate effect to watch for online status and server status changes
  useEffect(() => {
    // Check if we just went from offline -> online or server down -> up
    if (isOnline && isServerUp && pendingOperations.length > 0) {
      // Add this check to prevent double syncing
      const isSyncInProgress = localStorage.getItem('syncInProgress');
      if (isSyncInProgress) {
        console.log("NetworkContext: Sync already in progress from another component, skipping");
        return;
      }
      
      console.log("Connection restored, syncing pending operations");
      syncPendingOperations();
    }
  }, [isOnline, isServerUp, pendingOperations.length]);

  // Modify the effect that detects server status changes
  useEffect(() => {
    // Check if we just went from server down → server up
    if (isServerUp) {
      // Check if server was previously down
      const wasServerDown = localStorage.getItem('serverWasDown') === 'true';
      if (wasServerDown) {
        console.log('NetworkContext: Server was down and is now up, clearing sync lock and triggering sync');
        
        // First, clear any stale sync locks
        localStorage.removeItem('syncInProgress');
        
        // Then clear the server down flag
        localStorage.removeItem('serverWasDown');
        
        // Small delay to ensure everything is ready
        setTimeout(() => {
          try {
            // Check pending operations directly from localStorage
            const pendingOps = JSON.parse(localStorage.getItem('pendingOperations') || '[]');
            if (pendingOps.length > 0) {
              console.log(`Server is back up with ${pendingOps.length} pending operations - syncing now`);
              syncPendingOperations();
            } else {
              console.log('Server is back up but no pending operations to sync');
              
              // Still refresh product data since server might have changes
              localStorage.setItem('needsMenuRefresh', 'true');
              localStorage.setItem('needsProductRefresh', 'true');
            }
          } catch (err) {
            console.error("Error in post-server recovery:", err);
            // Make sure to clear the sync lock even if there's an error
            localStorage.removeItem('syncInProgress');
          }
        }, 1000);

        // Add this to NetworkContext.jsx, in the useEffect that detects server changes
        if (isServerUp && wasServerDown) {
          // When server comes back up, clear local items that should be refreshed
          console.log("Server came back up - clearing cached products to force refresh");
          
          // Instead of completely removing cachedProducts, just mark offline items for refresh
          try {
            const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
            // Keep only products that are not offline-created
            const filteredProducts = cachedProducts.filter(p => !p._isOffline);
            localStorage.setItem('cachedProducts', JSON.stringify(filteredProducts));
          } catch (err) {
            console.error("Error clearing offline products:", err);
          }
          
          // Set flag to force refresh from server
          localStorage.setItem('needsProductRefresh', 'true');
        }
      }
    } else {
      // Server is down, mark it for when it comes back up
      localStorage.setItem('serverWasDown', 'true');
    }
  }, [isServerUp]);

  // Function to add a pending operation
  const addPendingOperation = (operation) => {
    console.log("Adding pending operation:", operation);
    
    // Add to state
    setPendingOperations(prev => {
      // Check if this operation still makes sense
      const validOperations = prev.filter(op => isValidOperation(op, [...prev, operation]));
      
      if (operation.type === 'DELETE') {
        const productId = operation.path.split('/').pop();
        
        // Check if this product was created offline and not synced yet
        const wasCreatedOffline = validOperations.some(
          op => op.type === 'POST' && 
               ((op.tempId && op.tempId === productId) || 
                (op.data && op.data.id === productId))
        );
        
        if (wasCreatedOffline) {
          // If the product was created offline, remove the POST operation
          // and don't add the DELETE operation
          const filteredOperations = validOperations.filter(
            op => !(op.type === 'POST' && 
                  ((op.tempId && op.tempId === productId) || 
                   (op.data && op.data.id === productId)))
          );
          
          console.log(`Product ${productId} was created offline, removing both operations`);
          localStorage.setItem('pendingOperations', JSON.stringify(filteredOperations));
          return filteredOperations;
        }
      }
      
      // Normal case - add the new operation
      const newOperations = [...validOperations, operation];
      
      // Also save to localStorage immediately
      try {
        localStorage.setItem('pendingOperations', JSON.stringify(newOperations));
      } catch (err) {
        console.error("Error saving pending operations to localStorage:", err);
      }
      
      return newOperations;
    });
  };

  const syncPendingOperations = async () => {
    console.log("syncPendingOperations called - checking conditions...");
    
    // Early return if conditions aren't right for syncing
    if (!isOnline) {
      console.log("Cannot sync: device is offline");
      return 0;
    }
    
    if (!isServerUp) {
      console.log("Cannot sync: server is down");
      return 0;
    }
    
    // Get latest pending operations from localStorage
    const pendingOpsFromStorage = JSON.parse(localStorage.getItem('pendingOperations') || '[]');
    if (pendingOpsFromStorage.length === 0) {
      console.log("No pending operations to sync");
      return 0;
    }
    
    // Check for an existing sync in progress
    const isSyncInProgress = localStorage.getItem('syncInProgress');
    const now = Date.now();
    
    if (isSyncInProgress) {
      const syncStartTime = parseInt(isSyncInProgress);
      const timeSinceSync = now - syncStartTime;
      
      // If a sync started less than 5 seconds ago, don't start another one
      if (timeSinceSync < 5000) {
        console.log("Sync: Another sync is already in progress, skipping");
        return 0;
      } else {
        // If the lock is more than 30 seconds old, it's likely stale
        console.log("Stale sync lock found - clearing it");
        localStorage.removeItem('syncInProgress');
      }
    }
    
    // Mark that we're starting a sync
    const syncId = now;
    localStorage.setItem('syncInProgress', syncId.toString());
    setIsSyncing(true);
    
    console.log(`SYNC ${syncId}: Starting to sync ${pendingOpsFromStorage.length} pending operations`);
    
    try {
      // Initialize arrays to track operations
      const operations = [...pendingOpsFromStorage]; 
      const failedOperations = [];
      const successfulOperations = [];
      const idMappings = {};
      
      // Process POST operations first
      const postOperations = operations.filter(op => op.type === 'POST' && op.path === '/products');
      console.log(`SYNC ${syncId}: Processing ${postOperations.length} product creation operations`);
      
      // First, process all POST operations
      for (const operation of postOperations) {
        try {
          console.log("SYNC: Processing POST operation for", operation.tempId);
          
          // Clean data for server
          const dataToSend = { ...operation.data };
          if (dataToSend._isOffline) delete dataToSend._isOffline;
          
          // Create on server
          const response = await axios.post(`${API_URL}${operation.path}`, dataToSend);
          const realId = response.data.id;
          
          console.log(`SYNC: Created product with real ID ${realId} from temp ID ${operation.tempId}`);
          
          // Save mapping between temp and real ID
          idMappings[operation.tempId] = realId;
          localStorage.setItem(`id_mapping_${operation.tempId}`, realId);
          
          // Add to successful operations with result
          successfulOperations.push({
            ...operation,
            realId,
            result: response.data
          });
        } catch (err) {
          console.error(`SYNC ${syncId}: Failed to process POST operation:`, err);
          failedOperations.push(operation);
        }
      }
      
      // Process other operations (PUT, DELETE)
      const otherOperations = operations.filter(op => !postOperations.includes(op));
      console.log(`SYNC ${syncId}: Processing ${otherOperations.length} other operations`);
      
      for (const operation of otherOperations) {
        try {
          let path = operation.path;
          let data = operation.data ? { ...operation.data } : undefined;
          
          // Replace any temp IDs with real IDs in the path or data
          for (const [tempId, realId] of Object.entries(idMappings)) {
            path = path.replace(tempId, realId);
            
            if (data && data.id === tempId) {
              data.id = realId;
            }
          }
          
          // Process based on operation type
          if (operation.type === 'PUT') {
            if (data && data._isOffline) delete data._isOffline;
            
            const response = await axios.put(`${API_URL}${path}`, data);
            successfulOperations.push({ ...operation, result: response.data });
          }
          else if (operation.type === 'DELETE') {
            await axios.delete(`${API_URL}${path}`);
            successfulOperations.push(operation);
          }
        } catch (err) {
          console.error(`SYNC ${syncId}: Failed to process operation:`, err);
          failedOperations.push(operation);
        }
      }
      
      // Update remaining operations - only keep failed ones
      localStorage.setItem('pendingOperations', JSON.stringify(failedOperations));
      setPendingOperations(failedOperations);
      
      // CRITICAL STEP: Update all caches with new IDs
      if (successfulOperations.length > 0) {
        await updateLocalCaches(idMappings, successfulOperations);
      }
      
      // Set flag to force refresh of products
      localStorage.setItem('needsProductRefresh', 'true');
      localStorage.setItem('needsMenuRefresh', 'true');
      
      // Clear sync lock
      console.log(`SYNC ${syncId}: Complete - clearing sync lock`);
      localStorage.removeItem('syncInProgress');
      setIsSyncing(false);
      
      return successfulOperations.length;
    } catch (err) {
      console.error(`SYNC ${syncId}: Error during sync:`, err);
      // Always clear the lock on error
      localStorage.removeItem('syncInProgress');
      setIsSyncing(false);
      return 0;
    }
  };

  // Helper function to update all local caches with the new IDs
  const updateLocalCaches = async (idMappings, successfulOperations) => {
    try {
      // STEP 1: Get the latest products from server to ensure we have the most accurate data
      const freshProducts = [];
      try {
        const response = await axios.get(`${API_URL}/products`);
        if (response.data && response.data.products) {
          freshProducts.push(...response.data.products);
          console.log(`SYNC: Fetched ${freshProducts.length} products from server`);
        }
      } catch (err) {
        console.error("SYNC: Failed to get fresh products from server:", err);
        // Continue with local cache updates even if server fetch fails
      }
      
      // STEP 2: Update cachedProducts by creating a clean, deduplicated set
      const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
      const uniqueProductsMap = new Map();
      
      // First add all server products (highest priority)
      freshProducts.forEach(product => {
        uniqueProductsMap.set(String(product.id), {
          ...product,
          _synced: true
        });
      });
      
      // Record all successful POST operations with their ID mappings
      // This maps temp IDs to server-assigned IDs
      const syncedProducts = {};
      for (const op of successfulOperations) {
        if (op.type === 'POST' && op.tempId && op.realId) {
          console.log(`SYNC: Mapping ${op.tempId} to ${op.realId}`);
          syncedProducts[op.tempId] = op.realId;
          
          // Make sure this product is in the unique products map
          if (op.result && !uniqueProductsMap.has(String(op.realId))) {
            uniqueProductsMap.set(String(op.realId), {
              ...op.result,
              _synced: true
            });
          }
        }
      }
      
      // Then add any products that weren't synced and don't exist on server
      cachedProducts.forEach(product => {
        if (!product || !product.id) return;
        
        const productId = String(product.id);
        
        // If this is a temp ID that was synced, skip it (we already have the real version)
        if (productId.startsWith('temp_') && syncedProducts[productId]) {
          console.log(`SYNC: Skipping temp product ${productId} as it was synced to ${syncedProducts[productId]}`);
          return;
        }
        
        // If not synced and not already in map, add it
        if (!uniqueProductsMap.has(productId)) {
          uniqueProductsMap.set(productId, product);
        }
      });
      
      // STEP 3: Update all cache locations
      // Convert back to array and save to localStorage
      const deduplicatedProducts = Array.from(uniqueProductsMap.values());
      
      // Update cachedProducts
      localStorage.setItem('cachedProducts', JSON.stringify(deduplicatedProducts));
      
      // Update menuPageProducts if it exists
      localStorage.setItem('menuPageProducts', JSON.stringify(deduplicatedProducts));
      
      // LOG all the successful operations and their ID mappings
      console.log(`SYNC: Cache updated with ${deduplicatedProducts.length} unique products`);
      console.log(`SYNC: ID Mappings:`, idMappings);
      
      // Add a debug entry to verify what products are in cache
      const tempIdsInCache = deduplicatedProducts.filter(p => String(p.id).startsWith('temp_'));
      console.log(`SYNC: Temp IDs still in cache: ${tempIdsInCache.length}`, 
                  tempIdsInCache.map(p => p.id));
    } catch (err) {
      console.error("SYNC: Error updating local caches:", err);
    }
  };

  // Modify your safeApiCall function - especially the offline POST handling
  const safeApiCall = async (method, path, data = null) => {
    if (!isOnline || !isServerUp) {
      console.log(`OFFLINE: ${method} operation for ${path}`);
      
      // Special handling for POST operations when offline
      if (method === 'POST') {
        // Create a temporary ID for offline resources
        const tempId = `temp_${Date.now()}`;
        
        // Special handling for product creation
        if (path === '/products') {
          console.log("OFFLINE: Creating product with temp ID:", tempId);
          
          // Add to pending operations for later sync
          const operation = {
            type: method,
            path,
            data,
            tempId, // Store the temporary ID with the operation
            timestamp: Date.now()
          };
          
          // Add to pending operations queue
          setPendingOperations(prev => {
            const newOperations = [...prev, operation];
            localStorage.setItem('pendingOperations', JSON.stringify(newOperations));
            return newOperations;
          });
          
          // Also update the product cache
          try {
            const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
            cachedProducts.push({
              ...data,
              id: tempId,
              _isOffline: true
            });
            localStorage.setItem('cachedProducts', JSON.stringify(cachedProducts));
            console.log(`Added offline product to cache: ${tempId}`);
          } catch (err) {
            console.error("Error updating product cache:", err);
          }
          
          // Return a response with the temporary ID
          return { 
            offline: true, 
            data: { 
              ...data, 
              id: tempId, 
              _isOffline: true 
            } 
          };
        }
        
        // Generic handling for other POST operations
        addPendingOperation({
          type: method,
          path,
          data,
          timestamp: Date.now()
        });
        
        return { offline: true };
      }
      
      // Handle other HTTP methods here
      if (method === 'PUT' || method === 'DELETE') {
        addPendingOperation({
          type: method,
          path,
          data,
          timestamp: Date.now()
        });
        return { offline: true };
      }
      
      // For GET operations, try to return cached data
      if (method === 'GET') {
        try {
          // For product listing endpoint
          if (path === '/products') {
            const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
            return { offline: true, data: { products: cachedProducts } };
          }
          
          // For single product endpoint
          if (path.startsWith('/products/')) {
            const productId = path.split('/').pop();
            console.log("GET request for product ID:", productId);
            
            const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
            console.log("Cached products:", cachedProducts);
            
            // Handle temp ID lookup first
            if (productId.startsWith('temp_')) {
              // Check direct match in cachedProducts
              let product = cachedProducts.find(p => p.id === productId);
              
              if (product) {
                console.log(`Found temp product ${productId} in cache:`, product);
                return { offline: true, data: product };
              }
              
              // Try pendingOperations
              const pendingOps = JSON.parse(localStorage.getItem('pendingOperations') || '[]');
              const createOp = pendingOps.find(
                op => op.type === 'POST' && op.path === '/products' && op.tempId === productId
              );
              
              if (createOp) {
                const tempProduct = {
                  ...createOp.data,
                  id: productId,
                  _isOffline: true
                };
                console.log(`Found temp product ${productId} in pendingOperations:`, tempProduct);
                return { offline: true, data: tempProduct };
              }
              
              // Check if this temp ID has been mapped to a real ID
              const realId = localStorage.getItem(`id_mapping_${productId}`);
              if (realId) {
                const mappedProduct = cachedProducts.find(p => p.id.toString() === realId.toString());
                if (mappedProduct) {
                  console.log(`Found mapped product ${realId} for temp ID ${productId}`);
                  return { offline: true, data: mappedProduct };
                }
              }
            } else {
              // Regular numeric ID lookup
              const product = cachedProducts.find(p => p.id.toString() === productId.toString());
              
              if (product) {
                return { offline: true, data: product };
              }
            }
          }
        } catch (err) {
          console.error("Error returning cached data:", err);
        }
      }
      
      // Default response for offline
      return { offline: true };
    } else {
      // We're online - special handling for temp ID products
      // Check if this is a GET request for a temporary product 
      if (method === 'GET' && path.includes('/products/temp_')) {
        // This is a request for a temp product that hasn't been synced yet
        try {
          // Extract the temp ID from the path
          const tempId = path.split('/').pop();
          
          // First check cached products directly - this is the most reliable source
          const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
          const cachedProduct = cachedProducts.find(p => p.id === tempId);
          
          // If found in cache, return it right away
          if (cachedProduct) {
            console.log(`ONLINE: Found temp product ${tempId} in cache`);
            return { data: cachedProduct, offline: true };
          }
          
          // Then check pending operations
          const pendingCreate = pendingOperations.find(
            op => op.type === 'POST' && op.path === '/products' && op.tempId === tempId
          );
          
          if (pendingCreate) {
            // We have a pending creation - sync it now
            console.log(`ONLINE: Found pending creation for ${tempId}, auto-syncing`);
            
            try {
              // Auto-sync this operation now
              await syncPendingOperations();
              
              // Check if this operation was synced and we have a mapping
              const realId = localStorage.getItem(`id_mapping_${tempId}`);
              if (realId) {
                // We have a real ID now! Try to fetch the product from server
                const response = await axios.get(`${API_URL}/products/${realId}`);
                console.log(`ONLINE: Successfully synced and fetched product with ID ${realId}`);
                return response;
              } else {
                // Fall back to the pending operation data
                console.log(`ONLINE: No real ID found after sync, using pending operation data`);
                return { 
                  data: {
                    ...pendingCreate.data,
                    id: tempId,
                    _isOffline: true
                  },
                  offline: true 
                };
              }
            } catch (err) {
              console.error(`ONLINE: Failed to auto-sync temp product ${tempId}:`, err);
              // Fall back to pending operation data
              return { 
                data: {
                  ...pendingCreate.data,
                  id: tempId,
                  _isOffline: true
                },
                offline: true 
              };
            }
          }
        } catch (err) {
          console.error("ONLINE: Error handling temporary product:", err);
        }
      }
      
      // Normal online API handling
      try {
        let response;
        
        switch (method) {
          case 'GET':
            response = await axios.get(`${API_URL}${path}`);
            break;
          case 'POST':
            response = await axios.post(`${API_URL}${path}`, data);
            break;
          case 'PUT':
            response = await axios.put(`${API_URL}${path}`, data);
            break;
          case 'DELETE':
            response = await axios.delete(`${API_URL}${path}`);
            break;
          default:
            throw new Error(`Invalid method: ${method}`);
        }
        
        return response;
      } catch (error) {
        console.error(`API ${method} error:`, error);
        throw error;
      }
    }
  };
  
  // Helper function to update cached product IDs
  const updateCachedProductId = (tempId, realId) => {
    try {
      const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
      const updatedProducts = cachedProducts.map(product => {
        if (product.id === tempId) {
          return { ...product, id: realId, _isOffline: false };
        }
        return product;
      });
      localStorage.setItem('cachedProducts', JSON.stringify(updatedProducts));
      console.log(`Updated cached product ID from ${tempId} to ${realId}`);
    } catch (err) {
      console.error('Error updating cached product IDs:', err);
    }
  };

  // Add this helper function in NetworkContext.jsx
  const updateCachesAfterSync = (completedOperations, idMappings) => {
    try {
      // First get all caches we need to update
      const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
      const menuPageProducts = JSON.parse(localStorage.getItem('menuPageProducts') || '[]');
      
      // For each completed POST operation, update product IDs
      let updatedCachedProducts = [...cachedProducts];
      let updatedMenuPageProducts = [...menuPageProducts];
      
      // Handle product creation operations
      const createOperations = completedOperations.filter(op => 
        op.type === 'POST' && op.path === '/products' && op.tempId && op.realId
      );
      
      // Replace temp IDs with real IDs in all caches
      for (const op of createOperations) {
        const { tempId, realId, result } = op;
        
        // Update cachedProducts
        updatedCachedProducts = updatedCachedProducts.filter(p => p.id !== tempId);
        updatedCachedProducts.push({
          ...result,
          _synced: true
        });
        
        // Update menuPageProducts
        updatedMenuPageProducts = updatedMenuPageProducts.filter(p => p.id !== tempId);
        updatedMenuPageProducts.push({
          ...result, 
          _synced: true
        });
        
        console.log(`Updated caches for product ${tempId} -> ${realId}`);
      }
      
      // Update modify/delete operations
      for (const op of completedOperations.filter(op => op.type !== 'POST')) {
        // Handle based on operation type
        if (op.type === 'DELETE') {
          const id = op.path.split('/').pop();
          updatedCachedProducts = updatedCachedProducts.filter(p => p.id.toString() !== id.toString());
          updatedMenuPageProducts = updatedMenuPageProducts.filter(p => p.id.toString() !== id.toString());
        }
      }
      
      // Write back to localStorage
      localStorage.setItem('cachedProducts', JSON.stringify(updatedCachedProducts));
      localStorage.setItem('menuPageProducts', JSON.stringify(updatedMenuPageProducts));
      
      // Signal that the menu should refresh
      localStorage.setItem('needsMenuRefresh', 'true');
      
    } catch (err) {
      console.error("Error updating caches after sync:", err);
    }
  };

  // Add this helper function to NetworkContext.jsx
  const isValidOperation = (operation, pendingOps) => {
    // If it's a DELETE operation
    if (operation.type === 'DELETE') {
      const productId = operation.path.split('/').pop();
      
      // Check if there's a POST operation for this same ID
      const hasPostOp = pendingOps.some(
        op => op.type === 'POST' && 
        ((op.tempId && op.tempId === productId) || 
         (op.data && op.data.id === productId))
      );
      
      if (hasPostOp) {
        // If we created this product offline and are now deleting it offline,
        // we can just remove both operations
        console.log(`Found matching POST and DELETE operations for ${productId}, removing both`);
        return false;
      }
    }
    
    return true;
  };

  const apiGet = (path) => safeApiCall('GET', path);
  const apiPost = (path, data) => safeApiCall('POST', path, data);
  const apiPut = (path, data) => safeApiCall('PUT', path, data);
  const apiDelete = (path) => safeApiCall('DELETE', path);

  return (
    <NetworkContext.Provider value={{
      isOnline,
      isServerUp,
      pendingOperations,
      isSyncing,
      syncPendingOperations,
      apiGet,
      apiPost,
      apiPut,
      apiDelete
    }}>
      {children}
    </NetworkContext.Provider>
  );
};

export default NetworkProvider;