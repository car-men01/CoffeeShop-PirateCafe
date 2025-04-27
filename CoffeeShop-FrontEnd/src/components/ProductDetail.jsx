import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { NetworkContext } from "../NetworkContext";
import { ProductContext } from "../ProductContext";
import { API_URL, IMAGES_BASE_URL } from "../config";

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isOnline, isServerUp, apiGet, apiPut, apiDelete, syncPendingOperations } = useContext(NetworkContext);
    const { products } = useContext(ProductContext);
    
    // State for product data
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Form state for updating
    const [updateForm, setUpdateForm] = useState({
        name: '',
        category: '',
        price: '',
        description: ''
    });

    // Update the fetchProduct function in ProductDetail.jsx
    const fetchProduct = async () => {
        try {
            setLoading(true);
            console.log("Fetching product with ID:", id);
            
            // STEP 1: If this is a temp ID, check if it has been mapped to a real ID
            if (id.startsWith('temp_')) {
                const realId = localStorage.getItem(`id_mapping_${id}`);
                if (realId) {
                    console.log(`This temp ID ${id} has been mapped to real ID ${realId}, redirecting`);
                    navigate(`/product/${realId}`, { replace: true });
                    return;
                }
            }
            
            // STEP 2: First check if product is in global product state
            const productFromContext = findProductInContext();
            if (productFromContext) {
                console.log("Found product in context:", productFromContext);
                setProduct(productFromContext);
                setUpdateForm({
                    name: productFromContext.name,
                    category: productFromContext.category,
                    price: productFromContext.price.toString(),
                    description: productFromContext.description
                });
                setLoading(false);
                // Cache locally for future use
                cacheProductLocally(productFromContext);
                return;
            }
            
            // STEP 3: Check if product is in local storage caches
            const productFromCache = findProductInCache();
            if (productFromCache) {
                console.log("Found product in local cache:", productFromCache);
                setProduct(productFromCache);
                setUpdateForm({
                    name: productFromCache.name,
                    category: productFromCache.category,
                    price: productFromCache.price.toString(),
                    description: productFromCache.description
                });
                setLoading(false);
                return;
            }
            
            // STEP 4: If online, try API as last resort
            if (isOnline && isServerUp) {
                try {
                    console.log("Trying to fetch product from API");
                    // For temp IDs, try to sync first
                    if (id.startsWith('temp_')) {
                        console.log(`This is a temp ID (${id}). Triggering sync first`);
                        await syncPendingOperations();
                        
                        // After sync, check if we have a mapping now
                        const realId = localStorage.getItem(`id_mapping_${id}`);
                        if (realId) {
                            console.log(`After sync, found mapping to real ID ${realId}, redirecting`);
                            navigate(`/product/${realId}`, { replace: true });
                            return;
                        }
                    }
                    
                    // Normal API fetch for non-temp IDs or if sync didn't create a mapping
                    const response = await apiGet(`/products/${id}`);
                    if (!response.offline) {
                        const productData = response.data;
                        console.log("Product fetched from API:", productData);
                        setProduct(productData);
                        setUpdateForm({
                            name: productData.name,
                            category: productData.category,
                            price: productData.price.toString(),
                            description: productData.description
                        });
                        // Cache for offline use
                        cacheProductLocally(productData);
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    console.log("Failed to fetch from API, trying cache");
                }
            }
            
            console.error("Product not found in any source");
            setError("Product not found in online or offline storage");
            setLoading(false);
        } catch (err) {
            console.error("Error fetching product:", err);
            setError("Failed to load product.");
            setLoading(false);
        }
    };
      
    // Update the findInLocalStorage function in ProductDetail.jsx
    const findInLocalStorage = () => {
        try {
            console.log("Searching for product in localStorage with ID:", id);
            
            // 1. Check cachedProducts directly
            const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
            console.log("Cached products:", cachedProducts);
            
            let product = cachedProducts.find(p => p.id === id);
            if (product) {
                console.log("Found product in cachedProducts:", product);
                return product;
            }
            
            // 2. Check pending operations for this product
            const pendingOps = JSON.parse(localStorage.getItem('pendingOperations') || '[]');
            console.log("Pending operations:", pendingOps);
            
            const createOp = pendingOps.find(
                op => op.type === 'POST' && op.path === '/products' && op.tempId === id
            );
            
            if (createOp && createOp.data) {
                // Create a full product object from the operation data
                const productFromOp = {
                    ...createOp.data,
                    id: id,
                    _isOffline: true
                };
                console.log("Found product in pendingOperations:", productFromOp);
                return productFromOp;
            }
            
            // 3. Check menuPageProducts
            const menuProducts = JSON.parse(localStorage.getItem('menuPageProducts') || '[]');
            console.log("Menu page products:", menuProducts);
            
            product = menuProducts.find(p => p.id === id);
            if (product) {
                console.log("Found product in menuPageProducts:", product);
                return product;
            }
            
            // If we get here, the product wasn't found
            console.log("Product not found in any localStorage source");
            return null;
        } catch (err) {
            console.error("Error searching localStorage:", err);
            return null;
        }
    };
      
    // Update syncThisProduct in ProductDetail.jsx
    const syncThisProduct = async () => {
        try {
            console.log("Attempting to sync product with ID:", id);
            
            // Check if we have pending operations for this product
            const pendingOps = JSON.parse(localStorage.getItem('pendingOperations') || '[]');
            const createOp = pendingOps.find(
                op => op.type === 'POST' && op.path === '/products' && op.tempId === id
            );
            
            if (createOp) {
                console.log("Found pending creation operation for this product. Attempting sync...");
                
                // Try to create on server directly
                try {
                    const cleanData = { ...createOp.data };
                    if (cleanData._isOffline) delete cleanData._isOffline;
                    
                    console.log("Sending to server:", cleanData);
                    const response = await axios.post(`${API_URL}/products`, cleanData);
                    const realId = response.data.id;
                    
                    console.log(`Created on server with real ID: ${realId}`);
                    
                    // Store mapping
                    localStorage.setItem(`id_mapping_${id}`, realId);
                    
                    // Remove from pending operations
                    const updatedOps = pendingOps.filter(op => 
                        !(op.type === 'POST' && op.path === '/products' && op.tempId === id)
                    );
                    localStorage.setItem('pendingOperations', JSON.stringify(updatedOps));
                    
                    // Update cached products
                    const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
                    const updatedCache = cachedProducts.map(p => 
                        p.id === id ? { ...response.data, _synced: true } : p
                    );
                    localStorage.setItem('cachedProducts', JSON.stringify(updatedCache));
                    
                    // Set flag for menu refresh
                    localStorage.setItem('needsMenuRefresh', 'true');
                    
                    // Redirect to the real product
                    console.log(`Redirecting to real product page: /product/${realId}`);
                    setTimeout(() => {
                        navigate(`/product/${realId}`, { replace: true });
                    }, 100);
                    
                    return;
                } catch (err) {
                    console.error("Direct sync attempt failed:", err);
                }
                
                // If direct sync failed, try the general sync
                console.log("Attempting general sync...");
                await syncPendingOperations();
                
                // After sync, refresh the product list in MenuPage
                setTimeout(() => {
                    navigate('/menu', { state: { refresh: true } });
                }, 1000);
            } else {
                console.log("No pending operations found for this product");
            }
        } catch (err) {
            console.error("Failed to sync product:", err);
        }
    };
    
    // Add this useEffect after your syncThisProduct function
    useEffect(() => {
        // Call fetchProduct when the component mounts or when id/dependencies change
        fetchProduct();
        
        // Add special handling for refresh after sync
        if (isOnline && isServerUp && id.startsWith('temp_')) {
            // Check if this product was just synced
            const realId = localStorage.getItem(`id_mapping_${id}`);
            if (realId) {
                console.log(`Product was synced, navigating to real ID ${realId}`);
                navigate(`/product/${realId}`, { replace: true });
            }
        }
    }, [id, isOnline, isServerUp]); // Add dependencies that should trigger a refetch

    // Helper function to find product in context
    const findProductInContext = () => {
        console.log("Looking for product in context. Available products:", products);
        
        // Direct string comparison
        let foundProduct = products.find(p => p.id.toString() === id.toString());
        
        // If not found and it's a numeric ID, try numeric comparison
        if (!foundProduct && !id.includes('_') && !isNaN(parseInt(id))) {
            const numericId = parseInt(id);
            foundProduct = products.find(p => p.id === numericId);
        }
        
        // Special case for temp IDs - look for them specifically
        if (!foundProduct && id.startsWith('temp_')) {
            foundProduct = products.find(p => p._isOffline && p.id === id);
            if (foundProduct) {
                console.log("Found offline product in context:", foundProduct);
            }
        }
        
        return foundProduct;
    };
    
    // Helper function to find product in local cache
    const findProductInCache = () => {
    try {
        // First check cachedProducts
        const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
        let foundProduct = cachedProducts.find(p => p.id === id);
        
        // If not found, check menuPageProducts
        if (!foundProduct) {
            const menuProducts = JSON.parse(localStorage.getItem('menuPageProducts') || '[]');
            foundProduct = menuProducts.find(p => p.id === id);
        }
        
        // If not found and it's a temp ID, look for it in pendingOperations
        if (!foundProduct && id.startsWith('temp_')) {
            const pendingOps = JSON.parse(localStorage.getItem('pendingOperations') || '[]');
            const createOp = pendingOps.find(
                op => op.type === 'POST' && op.path === '/products' && op.tempId === id
            );
            
            if (createOp && createOp.data) {
                foundProduct = {
                    ...createOp.data,
                    id: id,
                    _isOffline: true
                };
            }
        }
        
        // If it's a temp ID that has been synced, check if we have mapping
        if (!foundProduct && id.startsWith('temp_')) {
            // Check localStorage for ID mapping
            const mappingKey = `id_mapping_${id}`;
            const realId = localStorage.getItem(mappingKey);
            if (realId) {
                foundProduct = cachedProducts.find(p => p.id.toString() === realId.toString());
            }
        }
        
        if (foundProduct) {
            console.log("Found product in local cache:", foundProduct);
        }
        
        return foundProduct;
    } catch (err) {
        console.error("Error searching cache:", err);
        return null;
    }
};
    
    // Helper function to save product to cache
    const cacheProductLocally = (productData) => {
        try {
            let cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
            
            // Check if product already exists in cache
            const existingIndex = cachedProducts.findIndex(p => p.id.toString() === id.toString());
            
            if (existingIndex >= 0) {
                // Update existing product
                cachedProducts[existingIndex] = productData;
            } else {
                // Add new product
                cachedProducts.push(productData);
            }
            
            localStorage.setItem('cachedProducts', JSON.stringify(cachedProducts));
        } catch (err) {
            console.error("Error caching product:", err);
        }
    };

    const handleDelete = () => {
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        try {
            await apiDelete(`/products/${id}`);
            
            // Remove from local cache too
            const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
            const filteredProducts = cachedProducts.filter(p => 
                p.id.toString() !== id.toString()
            );
            
            // Update the cache with the filtered products
            localStorage.setItem('cachedProducts', JSON.stringify(filteredProducts));
            
            // Also update menuPageProducts cache to be consistent
            const menuProducts = JSON.parse(localStorage.getItem('menuPageProducts') || '[]');
            const filteredMenuProducts = menuProducts.filter(p => 
                p.id.toString() !== id.toString()
            );
            localStorage.setItem('menuPageProducts', JSON.stringify(filteredMenuProducts));
            
            // Set refresh flag to ensure other pages update
            localStorage.setItem('needsMenuRefresh', 'true');
            
            navigate("/menu");
        } catch (err) {
            console.error("Error deleting product:", err);
            alert("Failed to delete product. Please try again.");
        } finally {
            setShowConfirmModal(false);
        }
    };

    const handleUpdateChange = (e) => {
        const { name, value } = e.target;
        setUpdateForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Validate form
            if (!updateForm.name || !updateForm.category || !updateForm.price || !updateForm.description) {
                alert("Please fill all fields");
                return;
            }
            
            // Validate price format
            const price = parseFloat(updateForm.price);
            if (isNaN(price) || price <= 0) {
                alert("Please enter a valid price");
                return;
            }
            
            // Create updated product object
            const updatedProduct = {
                ...product,
                name: updateForm.name,
                category: updateForm.category,
                price: price,
                description: updateForm.description
            };
            
            await apiPut(`/products/${id}`, updatedProduct);
            
            // Update local cache too
            let cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
            const existingIndex = cachedProducts.findIndex(p => p.id.toString() === id.toString());
            
            if (existingIndex >= 0) {
                cachedProducts[existingIndex] = updatedProduct;
                localStorage.setItem('cachedProducts', JSON.stringify(cachedProducts));
            }
            
            // Show success message and navigate
            alert("Product updated successfully!");
            
        } catch (err) {
            console.error("Error updating product:", err);
            alert("Failed to update product. Please try again.");
        }
    };

    // Handle cancel on the form
    const handleCancel = () => {
        // Reset form to current product data
        setUpdateForm({
            name: product.name,
            category: product.category,
            price: product.price.toString(),
            description: product.description
        });
    };

    // Show loading state
    if (loading) return <div className="loading">Loading product details...</div>;
    
    // Show error state
    if (error) return <h2 className="product-not-found">{error}</h2>;
    
    // Show not found state
    if (!product) return <h2 className="product-not-found">Product not found</h2>;

    return (
        <div>
            <div className="title-detail">
                <h1 className="welcome-title-product">Welcome to {product.name} product detail page!</h1>
                <hr className="detail-devider" />
            </div>
            <div className="product-detail-container">
                <div className="delete-container">
                    <img 
                        className="product-image" 
                        src={product.image.startsWith('http') ? product.image : `${IMAGES_BASE_URL}${product.image}`}
                        alt={product.name} 
                    />
                    <div className="title-and-info">
                        <h2 className="delete-p-title">Delete the selected product</h2>
                        <div className="product-info">
                            <h1 className="product-title">{product.name}</h1>
                            <p className="product-category">Category: {product.category}</p>
                            <p data-testid="product-description" className="product-description">{product.description}</p>
                            <p className="product-price"><strong>{product.price} €</strong></p>
                            <button id="delete" className="delete-button" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
                <hr className="detail-devider" />
                
                <div className="update-container">
                    <div className="title-and-form">
                        <h2 className="update-p-title">Edit the selected product</h2>
                        <form data-testid="product-form" className="update-form" onSubmit={handleUpdateSubmit}>
                            <label aria-label="product name" htmlFor="product-name">Product name</label>
                            <input 
                                id="product-name" 
                                aria-label="product name" 
                                data-testid="product-name"
                                className="form-input"
                                name="name"
                                value={updateForm.name}
                                onChange={handleUpdateChange}
                                required
                            />
                            
                            <label htmlFor="category">Category</label>
                            <input 
                                id="category"
                                className="form-input"
                                name="category"
                                value={updateForm.category}
                                onChange={handleUpdateChange}
                                required
                            />
                            
                            <label htmlFor="price">Price</label>
                            <input 
                                id="price" 
                                data-testid="product-price"
                                className="form-input"
                                name="price"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={updateForm.price}
                                onChange={handleUpdateChange}
                                required
                            />
                            
                            <label htmlFor="description">Description</label>
                            <textarea 
                                id="description" 
                                data-testid="product-desc"
                                className="form-textarea"
                                name="description"
                                value={updateForm.description}
                                onChange={handleUpdateChange}
                                required
                            />
                            
                            <button 
                                data-testid="save" 
                                id="save" 
                                className="form-button" 
                                type="submit"
                            >
                                Save changes
                            </button>
                            
                            <button 
                                className="form-button cancel-button" 
                                type="button" 
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                    <img 
                        className="product-image" 
                        src={product.image.startsWith('http') ? product.image : `${IMAGES_BASE_URL}${product.image}`}
                        alt={product.name} 
                    />
                </div>
            </div>

            {/* Delete Confirmation Modal with updated styling */}
            {showConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p className="modal-text">Are you sure you want to delete this product?</p>
                        <div className="modal-buttons">
                            <button id="delete" className="modal-delete-button" onClick={confirmDelete}>Delete</button>
                            <button className="modal-cancel-button" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;
