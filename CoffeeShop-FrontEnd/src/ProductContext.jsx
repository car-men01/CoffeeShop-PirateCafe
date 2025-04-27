import React, { createContext, useState, useEffect, useContext } from "react";
import { NetworkContext } from "./NetworkContext";

export const ProductContext = createContext();

const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isOnline, isServerUp, apiGet, apiPost, apiPut, apiDelete } = useContext(NetworkContext);

  // Initialize cache for offline products
  useEffect(() => {
    const initCache = () => {
      if (!localStorage.getItem('cachedProducts')) {
        localStorage.setItem('cachedProducts', JSON.stringify([]));
      }
    }
    initCache();
  }, []);

  // Fetch products with offline support
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Check if we need a fresh fetch from the server
      const needsRefresh = localStorage.getItem('needsMenuRefresh') === 'true'
        || localStorage.getItem('needsProductRefresh') === 'true'
        || localStorage.getItem('serverWasDown') === 'true'; // Add this condition
      
      // Try to get from API first if we're online or need a refresh
      if ((isOnline && isServerUp) || needsRefresh) {
        try {
          const response = await apiGet("/products");
          if (!response.offline) {
            // Use server data as the source of truth
            const productsData = response.data.products || [];
            
            // Update state with products from server
            setProducts(productsData);
            
            // Replace (don't merge) cached products with server data
            localStorage.setItem('cachedProducts', JSON.stringify(productsData));
            localStorage.setItem('lastProductsFetch', Date.now());
            
            // Clear the refresh flags
            localStorage.removeItem('needsMenuRefresh');
            localStorage.removeItem('needsProductRefresh');
            
            console.log(`Refreshed ${productsData.length} products from server`);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("API fetch failed:", err);
        }
      }
      
      // Only fall back to cache if needed
      console.log("Using cached products (offline or server down)");
      const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
      setProducts(cachedProducts);
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [isOnline, isServerUp, apiGet]);

  useEffect(() => {
    // Check if we need to refresh products due to sync
    const needsRefresh = localStorage.getItem('needsProductRefresh') === 'true';
    
    if (needsRefresh && isOnline && isServerUp) {
      console.log("Refreshing products due to sync flag");
      fetchProducts();
      localStorage.removeItem('needsProductRefresh');
    }
  }, [isOnline, isServerUp]);

  // CRUD Operations with offline support
  const addProduct = async (newProduct) => {
    try {
      const response = await apiPost("/products", newProduct);
      
      // If offline response, we get a data object with offline flag
      // If online response, we get a standard axios response
      const productToAdd = response.offline 
        ? response.data  // Already formatted by NetworkContext
        : response.data; // Direct from server
      
      // Update products state with deduplication
      setProducts(prev => {
        // Check if the product already exists by ID
        const exists = prev.some(p => String(p.id) === String(productToAdd.id));
        if (exists) {
          // If exists, replace it rather than adding a second copy
          return prev.map(p => 
            String(p.id) === String(productToAdd.id) ? productToAdd : p
          );
        }
        
        // If it's a new product, add it
        return [...prev, productToAdd];
      });
      
      // Make sure product is also in the cached products with deduplication
      const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
      const existsInCache = cachedProducts.some(p => String(p.id) === String(productToAdd.id));
      
      if (existsInCache) {
        // Replace existing product in cache
        const updatedCache = cachedProducts.map(p => 
          String(p.id) === String(productToAdd.id) ? productToAdd : p
        );
        localStorage.setItem('cachedProducts', JSON.stringify(updatedCache));
      } else {
        // Add new product to cache
        cachedProducts.push(productToAdd);
        localStorage.setItem('cachedProducts', JSON.stringify(cachedProducts));
      }
      
      return productToAdd;
    } catch (err) {
      console.error("Error adding product:", err);
      throw err;
    }
  };

  const updateProduct = async (updatedProduct) => {
    try {
      await apiPut(`/products/${updatedProduct.id}`, updatedProduct);
      
      // Update state
      setProducts(prevProducts => 
        prevProducts.map(p => p.id === updatedProduct.id ? { ...updatedProduct, _isOffline: !isOnline || !isServerUp } : p)
      );
      
      // Update local cache
      const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
      const updatedCache = cachedProducts.map(p => 
        p.id === updatedProduct.id ? { ...updatedProduct, _isOffline: !isOnline || !isServerUp } : p
      );
      localStorage.setItem('cachedProducts', JSON.stringify(updatedCache));
      
      return updatedProduct;
    } catch (err) {
      console.error("Error updating product:", err);
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await apiDelete(`/products/${id}`);
      
      // Update state
      setProducts(prevProducts => prevProducts.filter(product => product.id !== id));
      
      // Update local cache
      const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
      const updatedCache = cachedProducts.filter(p => p.id !== id);
      localStorage.setItem('cachedProducts', JSON.stringify(updatedCache));
      
      return true;
    } catch (err) {
      console.error("Error deleting product:", err);
      throw err;
    }
  };

  return (
    <ProductContext.Provider value={{ 
      products, 
      addProduct, 
      updateProduct, 
      deleteProduct,
      loading,
      error,
      isOffline: !isOnline || !isServerUp
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export default ProductProvider;