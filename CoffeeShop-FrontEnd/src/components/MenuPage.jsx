import React, { useState, useEffect, useRef, useMemo, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { NetworkContext } from "../NetworkContext";
import { ProductContext } from "../ProductContext";
import { API_URL, WEBSOCKET_URL, IMAGES_BASE_URL } from "../config";
import axios from "axios";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import espressoImg from "../assets/espresso.jpg";
import cappuccinoImg from "../assets/cappuccino.webp";
import americanoImg from "../assets/americano.png";
import captainsQuartetImg from "../assets/captains_quartet.jpg";
import krakensIcedImg from "../assets/kraken_iced.jpg";
import deadMansDripImg from "../assets/dead_mans_drip.jpg";
import shiverMeColdBrewImg from "../assets/shiver_me_cold_brew.jpg";
import frappuccinoImg from "../assets/frappuccino.jpg";
import icelatteImg from "../assets/ice_latte.jpg";
import underTheWaterImg from "../assets/under_the_water_tea.jpg";
import mermaidsChaiImg from "../assets/mermaids_chai.webp";
import stormyEarlGreyImg from "../assets/stormy_earl_grey.jpg";
import mochaImg from "../assets/mocha.jpg";
import flatWhiteImg from "../assets/flat_white.jpg";
import macchiatoImg from "../assets/macchiato.jpg";
import turkishCoffeeImg from "../assets/turkish_coffee.jpg";
import irishCoffeeImg from "../assets/irish_coffee.jpg";
import viennaCoffeeImg from "../assets/vienna_coffee.jpg";
import buccaneersBrewImg from "../assets/buccaneers_brew.jpg";
import jollyRogerJavaImg from "../assets/jolly_roger_java.jpg";
import seaWitchsLatteImg from "../assets/sea_witchs_latte.jpg";
import coconutImg from "../assets/coconut_coffee.jpg";
import blackbeardsBlendImg from "../assets/blackbeards_blend.jpg";
import goldRushEspressoImg from "../assets/gold_rush_espresso.jpg";
import vanillaColdBrewImg from "../assets/vanilla_cold_brew.jpg";
import chocolateHazelnutImg from "../assets/chocolate_hazelnut_cold_brew.jpg";
import saltedCaramelImg from "../assets/salted_caramel.jpg";
import coconutColdBrewImg from "../assets/coconut_cold_brew.jpg";
import nitroBrewImg from "../assets/nitro_brew.jpg";
import mapleBourbonImg from "../assets/maple_bourbon.jpg";
import piratesGreenImg from "../assets/pirates_green_tea.jpg";
import spicedRumTeaImg from "../assets/spiced_rum_tea.jpg";
import goldenTurmericTeaImg from "../assets/golden_turmeric.jpg";
import berryTreasureImg from "../assets/berry_treasure.jpg";
import chamomileImg from "../assets/captains_chamomile.jpg";
import mintyShipmateImg from "../assets/minty.jpg";
import addProductMainImg from "../assets/add_product_main.jpg";


const imageFallbackMap = {
    "/assets/espresso.jpg": espressoImg,
    "/assets/cappuccino.webp": cappuccinoImg,
    "/assets/americano.png": americanoImg,
    "/assets/captains_quartet.jpg": captainsQuartetImg,
    "/assets/kraken_iced.jpg": krakensIcedImg,
    "/assets/dead_mans_drip.jpg": deadMansDripImg,
    "/assets/shiver_me_cold_brew.jpg": shiverMeColdBrewImg,
    "/assets/frappuccino.jpg": frappuccinoImg,
    "/assets/ice_latte.jpg": icelatteImg,
    "/assets/under_the_water_tea.jpg": underTheWaterImg,
    "/assets/mermaids_chai.webp": mermaidsChaiImg,
    "/assets/stormy_earl_grey.jpg": stormyEarlGreyImg,
    "/assets/mocha.jpg": mochaImg,
    "/assets/flat_white.jpg": flatWhiteImg,
    "/assets/macchiato.jpg": macchiatoImg,
    "/assets/turkish_coffee.jpg": turkishCoffeeImg,
    "/assets/irish_coffee.jpg": irishCoffeeImg,
    "/assets/vienna_coffee.jpg": viennaCoffeeImg,
    "/assets/buccaneers_brew.jpg": buccaneersBrewImg,
    "/assets/jolly_roger_java.jpg": jollyRogerJavaImg,
    "/assets/sea_witchs_latte.jpg": seaWitchsLatteImg,
    "/assets/coconut_coffee.jpg": coconutImg,
    "/assets/blackbeards_blend.jpg": blackbeardsBlendImg,
    "/assets/gold_rush_espresso.jpg": goldRushEspressoImg,
    "/assets/vanilla_cold_brew.jpg": vanillaColdBrewImg,
    "/assets/chocolate_hazelnut_cold_brew.jpg": chocolateHazelnutImg,
    "/assets/salted_caramel.jpg": saltedCaramelImg,
    "/assets/coconut_cold_brew.jpg": coconutColdBrewImg,
    "/assets/nitro_brew.jpg": nitroBrewImg,
    "/assets/maple_bourbon.jpg": mapleBourbonImg,
    "/assets/pirates_green_tea.jpg": piratesGreenImg,
    "/assets/spiced_rum_tea.jpg": spicedRumTeaImg,
    "/assets/golden_turmeric.jpg": goldenTurmericTeaImg,
    "/assets/berry_treasure.jpg": berryTreasureImg,
    "/assets/captains_chamomile.jpg": chamomileImg,
    "/assets/minty.jpg": mintyShipmateImg,
    "/assets/add_product_main.jpg": addProductMainImg,
}

// Replace your current cacheImagesForOfflineUse function with this optimized version
const cacheImagesForOfflineUse = () => {
    // Check if we already cached images in this session
    if (localStorage.getItem('imagesCached') === 'true') {
        console.log('Images already cached this session, skipping...');
        return;
    }

    // Get available space
    let availableSpace = 0;
    try {
        // Calculate approximately how much space we have left (conservative estimate)
        const testKey = '_test_space_';
        const testSize = 100 * 1024; // 100KB test
        const testData = new Array(testSize).join('a');
        
        try {
            localStorage.setItem(testKey, testData);
            localStorage.removeItem(testKey);
            availableSpace = 4 * 1024 * 1024; // Assume 4MB is safe
        } catch (e) {
            console.warn('Very limited storage space available');
            availableSpace = 500 * 1024; // 500KB is safe
        }
    } catch (e) {
        console.error('Could not determine available storage space', e);
        return;
    }

    console.log(`Estimated available storage: ${Math.round(availableSpace/1024)}KB`);
    
    // Prioritize most important images
    const priorityImages = [
        "/assets/espresso.jpg", 
        "/assets/cappuccino.webp",
        "/assets/americano.png",
        "/assets/mocha.jpg",
        "/assets/add_product_main.jpg"
    ];

    // First, try to cache priority images
    let remainingSpace = availableSpace;
    
    const cacheImage = (path) => {
        return new Promise((resolve) => {
            const imgSrc = imageFallbackMap[path];
            if (!imgSrc) {
                resolve();
                return;
            }
            
            const img = new Image();
            
            img.onload = function() {
                try {
                    // Create a smaller version for caching
                    const canvas = document.createElement('canvas');
                    const maxDimension = 200; // Smaller image size
                    
                    // Calculate scaled dimensions while maintaining aspect ratio
                    const scale = Math.min(maxDimension / img.width, maxDimension / img.height);
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // Lower quality JPEG
                    const dataURL = canvas.toDataURL('image/jpeg', 0.7);
                    const estimatedSize = Math.round((dataURL.length * 3) / 4);
                    
                    // Check if we have enough space
                    if (estimatedSize < remainingSpace) {
                        localStorage.setItem(`img_cache_${path}`, dataURL);
                        remainingSpace -= estimatedSize;
                        console.log(`Cached image for offline use: ${path} (${Math.round(estimatedSize/1024)}KB)`);
                    } else {
                        console.log(`Skipping ${path}, not enough space left`);
                    }
                } catch (err) {
                    console.warn(`Could not cache image ${path}:`, err);
                }
                resolve();
            };
            
            img.onerror = () => {
                console.warn(`Failed to load image for caching: ${path}`);
                resolve();
            };
            
            img.src = imgSrc;
        });
    };

    // Start by caching priority images
    const cacheImages = async () => {
        // First cache priority images
        for (const path of priorityImages) {
            await cacheImage(path);
        }
        
        // Then cache other images if space remains
        const remainingImages = Object.keys(imageFallbackMap)
            .filter(path => !priorityImages.includes(path));
        
        // Cache remaining images until we run out of space
        for (const path of remainingImages) {
            if (remainingSpace < 100 * 1024) { // Stop if less than 100KB left
                break;
            }
            await cacheImage(path);
        }
        
        // Mark that we've cached images
        localStorage.setItem('imagesCached', 'true');
    };
    
    // Start the caching process
    cacheImages();
};

// Create a generic fallback for unknown images
const getProductImageFallback = (path) => {
    if (!path) return espressoImg;
    
    // First check if we have a cached data URL version
    const cachedDataUrl = localStorage.getItem(`img_cache_${path}`);
    if (cachedDataUrl) {
        return cachedDataUrl;
    }
    
    // Then try exact match in our import map
    if (imageFallbackMap[path]) {
        return imageFallbackMap[path];
    }
    
    // Try to find a partial match
    const fileName = path.split('/').pop();
    const partialMatch = Object.keys(imageFallbackMap).find(key => key.includes(fileName));
    if (partialMatch) {
        // Check if we have a data URL for the partial match
        const cachedPartialMatch = localStorage.getItem(`img_cache_${partialMatch}`);
        if (cachedPartialMatch) {
            return cachedPartialMatch;
        }
        return imageFallbackMap[partialMatch];
    }
    
    // Default fallback
    return espressoImg;
};

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

// Component for Category Bar Chart
const CategoryBarChart = ({ products }) => {
    // Get counts of products by category
    const categories = [...new Set(products.map(p => p.category))];
    const categoryCounts = categories.map(category => 
        products.filter(p => p.category === category).length
    );
    
    const data = {
        labels: categories,
        datasets: [
            {
                label: 'Number of Products',
                data: categoryCounts,
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                ],
                borderColor: [
                    'rgb(75, 192, 192)',
                    'rgb(153, 102, 255)',
                    'rgb(255, 159, 64)',
                    'rgb(54, 162, 235)',
                ],
                borderWidth: 1,
            },
        ],
    };
    
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Products by Category',
                font: {
                    size: 16
                }
            },
        },
    };
    
    return (
        <div style={{ height: '200px' }}>
            <Bar data={data} options={options} />
        </div>
    );
};

// Component for Price Distribution Pie Chart
const PriceDistributionChart = ({ categorizedProducts }) => {
    const data = {
        labels: ['Low Price', 'Medium Price', 'High Price'],
        datasets: [
            {
                data: [
                    categorizedProducts.low.length, 
                    categorizedProducts.mid.length, 
                    categorizedProducts.high.length
                ],
                backgroundColor: [
                    'rgba(135, 206, 250, 0.7)', // Light blue
                    'rgba(255, 255, 0, 0.7)',    // Yellow
                    'rgba(255, 182, 193, 0.7)',  // Pink
                ],
                borderColor: [
                    'rgb(135, 206, 250)',
                    'rgb(255, 255, 0)',
                    'rgb(255, 182, 193)',
                ],
                borderWidth: 1,
            },
        ],
    };
    
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
            },
            title: {
                display: true,
                text: 'Price Distribution',
                font: {
                    size: 16
                }
            },
        },
    };
    
    return (
        <div style={{ height: '200px' }}>
            <Pie data={data} options={options} />
        </div>
    );
};

// Component for Price Range Line Chart
const PriceRangeChart = ({ products }) => {
    // Skip if no products
    if (products.length === 0) {
        return <div>No data available</div>;
    }
    
    // Get min and max prices, rounded to nearest integers
    const prices = products.map(p => p.price);

    // Filter out extreme outliers (e.g., prices > 3 standard deviations from mean)
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const stdDev = Math.sqrt(prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length);
    const threshold = mean + (3 * stdDev);
    
    // Filter products to exclude extreme outliers
    const filteredProducts = products.filter(p => p.price <= threshold);
    const filteredPrices = filteredProducts.map(p => p.price);

    const minPrice = Math.floor(Math.min(...filteredPrices));
    const maxPrice = Math.ceil(Math.max(...filteredPrices));
    
    
    // Create price ranges (e.g., 2-3, 3-4, etc.)
    const ranges = [];
    const rangeCounts = [];
    
    // Limit the number of ranges to avoid excessive chart stretching
    const MAX_RANGES = 20;
    const rangeSize = Math.ceil((maxPrice - minPrice) / MAX_RANGES);

    for (let i = minPrice; i < maxPrice; i += rangeSize) {
        ranges.push(`${i}-${i + rangeSize}`);
        rangeCounts.push(products.filter(p => p.price >= i && p.price < i + rangeSize).length);
    }
        
    const data = {
        labels: ranges,
        datasets: [
            {
                label: 'Number of Products',
                data: rangeCounts,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.1,
                fill: true,
            },
        ],
    };
    
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Products by Price Range',
                font: {
                    size: 16
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0
                }
            }
        }
    };
    
    return (
        <div style={{ height: '200px' }}>
            <Line data={data} options={options} />
        </div>
    );
};

// Function to categorize products based on price
const categorizeProductsByPrice = (products) => {
    if (products.length === 0) return { low: [], mid: [], high: [] };

    const prices = products.map(p => p.price).sort((a, b) => a - b);
    const midStartIndex = Math.floor(products.length * 0.3);
    const midEndIndex = Math.floor(products.length * 0.7);

    const midStartPrice = prices[midStartIndex];
    const midEndPrice = prices[midEndIndex];

    return {
        low: products.filter(p => p.price <= midStartPrice),
        mid: products.filter(p => p.price > midStartPrice && p.price <= midEndPrice),
        high: products.filter(p => p.price > midEndPrice)
    };
};


const MenuPage = () => {
    const navigate = useNavigate();
    const socket = useRef(null);
    
    // State for products and filters
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [sortOption, setSortOption] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(6);
    const [currentPage, setCurrentPage] = useState(1);
    const [allCategories, setAllCategories] = useState([]);
    const [categoryOrder] = useState(["Classic Coffee", "Specialty Drinks", "Cold Brews", "Teas"]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedCount, setGeneratedCount] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const { isOnline, isServerUp, pendingOperations, isSyncing, syncPendingOperations, apiGet } = useContext(NetworkContext);    const { isOffline } = useContext(ProductContext);

    // for endless scrolling
    const [loadedPages, setLoadedPages] = useState(1);
    const [allLoaded, setAllLoaded] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const scrollObserverRef = useRef(null);
    const scrollTriggerRef = useRef(null);
    const [displayMode, setDisplayMode] = useState('pagination'); // 'pagination' or 'endless'

    // Add debugging function
    const [debugLogs, setDebugLogs] = useState([]);
    const appendDebugLog = (message) => {
        console.log(`[DEBUG] ${message}`);
        setDebugLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    useEffect(() => {
        // Cache images when online
        if (isOnline) {
            cacheImagesForOfflineUse();
        }
    }, [isOnline]); // Re-run when online status changes

    // Initialize WebSocket connection
    useEffect(() => {
        // Close any existing connection before creating a new one
        if (socket.current && socket.current.readyState === WebSocket.OPEN) {
            console.log('Closing existing WebSocket connection');
            socket.current.close();
        }
        
        try {
            // Create WebSocket connection
            console.log('Attempting to connect to WebSocket server');
            socket.current = new WebSocket(WEBSOCKET_URL);
            setConnectionStatus('connecting');
            
            // Connection opened
            socket.current.addEventListener('open', (event) => {
                console.log('Connected to WebSocket server');
                setConnectionStatus('connected');
                // Request current generated count
                if (socket.current.readyState === WebSocket.OPEN) {
                    socket.current.send(JSON.stringify({ action: 'GET_GENERATED_COUNT' }));
                    console.log('Sent GET_GENERATED_COUNT message');
                }
            });
            
            // Listen for messages
            socket.current.addEventListener('message', (event) => {
                try {
                    console.log('Received WebSocket message:', event.data);
                    const response = JSON.parse(event.data);
                    
                    switch(response.type) {
                        case 'PRODUCT_GENERATED':
                            console.log('Generated product:', response.data.name);
                            // Add to current products state
                            if (response.data) {
                                const newProduct = {
                                    ...response.data,
                                    image: response.data.image.startsWith('http') 
                                        ? response.data.image 
                                        : response.data.image
                                };
                                
                                // Update products state with the new product
                                setProducts(prevProducts => {
                                    // Check if product already exists
                                    const exists = prevProducts.some(p => p.id === newProduct.id);
                                    if (exists) {
                                        return prevProducts;
                                    }
                                    const updatedProducts = [...prevProducts, newProduct];
                                    console.log(`Added product ${newProduct.name} to state, now have ${updatedProducts.length} products`);
                                    return updatedProducts;
                                });
                                
                                setGeneratedCount(prev => prev + 1);
                            }
                            break;
                            
                        case 'GENERATION_STARTED':
                            console.log('Generation started:', response.data.message);
                            if (response.data.generatedCount !== undefined) {
                                setGeneratedCount(response.data.generatedCount);
                            }
                            break;
                            
                        case 'GENERATION_STOPPED':
                            console.log('Generation stopped:', response.data.message);
                            if (response.data.generatedCount !== undefined) {
                                setGeneratedCount(response.data.generatedCount);
                            }
                            break;
                            
                        case 'CONNECTED':
                            console.log('Connected to WebSocket server');
                            if (response.data.generatedCount !== undefined) {
                                setGeneratedCount(response.data.generatedCount);
                            }
                            break;
                            
                        case 'GENERATED_COUNT':
                            console.log('Received generated count:', response.data.count);
                            setGeneratedCount(response.data.count);
                            break;
                            
                        case 'ERROR':
                            console.error('Server error:', response.data.message);
                            setError(`Server error: ${response.data.message}`);
                            break;
                            
                        default:
                            console.log('Unknown message type:', response);
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            });
            
            // Connection closed
            socket.current.addEventListener('close', (event) => {
                console.log('WebSocket closed with code:', event.code, 'reason:', event.reason);
                setConnectionStatus('disconnected');
                setIsGenerating(false);
            });
            
            // Connection error
            socket.current.addEventListener('error', (error) => {
                console.error('WebSocket error:', error);
                setConnectionStatus('error');
                setError('Failed to connect to product generation service');
            });
        } catch (err) {
            console.error('Error setting up WebSocket:', err);
            setConnectionStatus('error');
            setError(`WebSocket initialization error: ${err.message}`);
        }
        
        // Clean up on unmount
        return () => {
            if (socket.current) {
                if (socket.current.readyState === WebSocket.OPEN) {
                    socket.current.close();
                    console.log('WebSocket connection closed on unmount');
                }
            }
        };
    }, []);

    // Toggle generation of random products
    const toggleGeneration = () => {
        try {
            if (!socket.current) {
                console.error('WebSocket not initialized');
                setError('WebSocket not initialized. Please refresh the page.');
                return;
            }
            
            if (socket.current.readyState !== WebSocket.OPEN) {
                console.error(`WebSocket not open, current state: ${socket.current.readyState}`);
                setError(`WebSocket not connected (state: ${socket.current.readyState}). Please refresh the page.`);
                return;
            }
            
            if (isGenerating) {
                // Stop generation
                console.log('Stopping generation');
                socket.current.send(JSON.stringify({ action: 'STOP_GENERATION' }));
                setIsGenerating(false);
            } else {
                // Start generation
                console.log('Starting generation');
                socket.current.send(JSON.stringify({ action: 'START_GENERATION' }));
                setIsGenerating(true);
                setError(null); // Clear any previous errors
            }
        } catch (err) {
            console.error('Error in toggleGeneration:', err);
            setError(`Failed to communicate with the product generation service: ${err.message}`);
            setIsGenerating(false);
        }
    };

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory, sortOption, itemsPerPage]);

    // Reset endless scrolling when filters change
    useEffect(() => {
        if (displayMode === 'endless') {
            setLoadedPages(1);
            setAllLoaded(false);
        }
    }, [searchTerm, selectedCategory, sortOption, displayMode]);

    useEffect(() => {
        // Reset state when changing display mode
        if (displayMode === 'endless') {
            setLoadedPages(1);
            setAllLoaded(false);
            
            // Force a refresh of the products
            const offlineCount = products.filter(p => p._isOffline).length;
            console.log(`Refreshing endless scroll view with ${products.length} products (${offlineCount} offline)`);
        }
    }, [displayMode]);

    // Fetch all categories once at component mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                if (isOnline && isServerUp) {
                    const response = await axios.get(`${API_URL}/products/categories`);
                    setAllCategories(response.data);
                    
                    // Cache for offline use
                    localStorage.setItem('cachedCategories', JSON.stringify(response.data));
                } else {
                    // When offline, use cached categories
                    const cachedCats = localStorage.getItem('cachedCategories');
                    if (cachedCats) {
                        setAllCategories(JSON.parse(cachedCats));
                    } else {
                        // Fallback to product categories if no cached categories
                        const uniqueCategories = [...new Set(products.map(p => p.category))];
                        setAllCategories(uniqueCategories);
                    }
                }
            } catch (error) {
                console.warn("Error fetching categories, using cached or local data");
                // Use cached categories
                try {
                    const cachedCats = localStorage.getItem('cachedCategories');
                    if (cachedCats) {
                        setAllCategories(JSON.parse(cachedCats));
                    } else {
                        // Fallback to product categories
                        const uniqueCategories = [...new Set(products.map(p => p.category))];
                        setAllCategories(uniqueCategories);
                    }
                } catch (err) {
                    console.error("Failed to load categories:", err);
                }
            }
        };
        
        fetchCategories();
    }, [isOnline, isServerUp, products]);

    // Fetch products function that can be called when needed
    const fetchProducts = async () => {
        try {
            setLoading(true);
            
            if (isOnline && isServerUp) {
                try {
                    const response = await apiGet("/products");
                    if (!response.offline) {
                        // Create a Map to deduplicate using string IDs
                        const uniqueProducts = new Map();
                        response.data.products.forEach(product => {
                            uniqueProducts.set(String(product.id), product);
                        });
                        
                        // Convert back to array
                        const deduplicatedProducts = Array.from(uniqueProducts.values());
                        
                        // Update state and cache
                        setProducts(deduplicatedProducts);
                        localStorage.setItem('menuPageProducts', JSON.stringify(deduplicatedProducts));
                        localStorage.removeItem('needsMenuRefresh');
                    } else {
                        loadCachedProducts();
                    }
                } catch (error) {
                    loadCachedProducts();
                }
            } else {
                loadCachedProducts();
            }
            
            setLoading(false);
        } catch (error) {
            console.error("Error in fetchProducts:", error);
            setError("Failed to load products");
            loadCachedProducts();
            setLoading(false);
        }
    };

    const loadCachedProducts = () => {
        try {
          // Try ProductContext cache first
          const cachedProductsStr = localStorage.getItem('cachedProducts');
          if (cachedProductsStr) {
            const cachedProducts = JSON.parse(cachedProductsStr);
            console.log(`Loaded ${cachedProducts.length} products from cache`);
            setProducts(cachedProducts);
          } else {
            // Fallback to MenuPage specific cache
            const menuCacheStr = localStorage.getItem('menuPageProducts');
            if (menuCacheStr) {
              const menuCache = JSON.parse(menuCacheStr);
              console.log(`Loaded ${menuCache.length} products from menu cache`);
              setProducts(menuCache);
            } else {
              console.warn("No products found in cache");
              setProducts([]);
            }
          }
        } catch (err) {
          console.error("Error loading cached products:", err);
          setProducts([]);
        }
      };

      useEffect(() => {
        // When connection restored, sync once
        if (isOnline && isServerUp) {
          const pendingOps = JSON.parse(localStorage.getItem('pendingOperations') || '[]');
          const needsSync = pendingOps.length > 0;
          
          if (needsSync) {
            // Check if a sync is in progress, but also check if it's stale
            const isSyncInProgress = localStorage.getItem('syncInProgress');
            const now = Date.now();
            
            if (isSyncInProgress) {
              const syncStartTime = parseInt(isSyncInProgress);
              const timeSinceSync = now - syncStartTime;
              
              // If a sync started less than 5 seconds ago, don't start another one
              if (timeSinceSync < 5000) {
                console.log("MenuPage: Another sync is already in progress, skipping");
                return;
              } else {
                // If it's been more than 30 seconds, the sync lock might be stale - clear it
                console.log("MenuPage: Found stale sync lock, clearing it");
                localStorage.removeItem('syncInProgress');
              }
            }
            
            console.log("MenuPage: Starting sync");
            // Mark that we're starting a sync 
            localStorage.setItem('syncInProgress', now.toString());
            
            // Only sync if there's a real need
            try {
              syncPendingOperations().then(syncedCount => {
                if (syncedCount > 0) {
                  fetchProducts();
                }
                // Clear the sync marker after it completes
                localStorage.removeItem('syncInProgress');
              }).catch(err => {
                console.error("Sync error:", err);
                // Make sure to clear the marker even on error
                localStorage.removeItem('syncInProgress');
              });
            } catch (err) {
              console.error("Sync error:", err);
              // Make sure to clear the marker even on error
              localStorage.removeItem('syncInProgress');
            }
          }
        }
      }, [isOnline, isServerUp]);

    // Add a new component for lazy-loaded images with placeholders
    const LazyImage = ({ src, alt, productId }) => {
        const [isLoaded, setIsLoaded] = useState(false);
        const [error, setError] = useState(false);
        const { isOnline, isServerUp } = useContext(NetworkContext);
        
        // Check if this product had a temp ID that was mapped to a real ID
        // This helps with cached image lookup when IDs change
        const getRealOrMappedId = (id) => {
            if (id && typeof id === 'string' && id.startsWith('temp_')) {
                const realId = localStorage.getItem(`id_mapping_${id}`);
                return realId || id;
            }
            return id;
        };
        
        // Determine the image source based on online/offline status
        const imageSource = useMemo(() => {
            if (!isOnline || !isServerUp) {
                // When offline, use local fallbacks
                if (src.startsWith(IMAGES_BASE_URL)) {
                    // Extract the path from server URL
                    const serverPath = src.replace(IMAGES_BASE_URL, '');
                    
                    // First try cached version
                    const cachedImage = localStorage.getItem(`img_cache_${serverPath}`);
                    if (cachedImage) {
                        return cachedImage;
                    }
                    
                    // Special handling for default product image
                    if (serverPath === '/assets/add_product_main.jpg') {
                        const cachedDefaultImage = localStorage.getItem('defaultProductImage');
                        if (cachedDefaultImage) {
                            return cachedDefaultImage;
                        }
                    }
                    
                    // If no cached version, use the imported image
                    return getProductImageFallback(serverPath);
                } else {
                    // Handle other URL formats
                    const fileName = src.split('/').pop();
                    
                    // Try to find a match by filename first in cached images
                    const cacheKey = Object.keys(localStorage).find(key => 
                        key.startsWith('img_cache_') && key.includes(fileName));
                    
                    if (cacheKey) {
                        return localStorage.getItem(cacheKey);
                    }
                    
                    // If no cached version found, try imported images
                    return getProductImageFallback(`/${fileName}`);
                }
            }
            return src;
        }, [src, isOnline, isServerUp, productId]);
        
        return (
            <div className="image-container" style={{ position: 'relative', height: '300px', backgroundColor: '#f0f0f0' }}>
                {!isLoaded && !error && (
                    <div className="image-placeholder">
                        <div className="pulse-animation"></div>
                    </div>
                )}
                {error && <div className="image-error">Failed to load image</div>}
                <img 
                    src={imageSource} 
                    alt={alt} 
                    className={`product-image ${isLoaded ? 'loaded' : ''}`}
                    style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
                    loading="lazy" 
                    onLoad={() => setIsLoaded(true)}
                    onError={(e) => {
                        console.error(`Failed to load image: ${imageSource}`);
                        setError(true);
                    }}
                />
            </div>
        );
    };

    // Make sure we always fetch products when component mounts
    useEffect(() => {
        fetchProducts();
        // The empty dependency array means this effect runs once on mount
    }, []);

    // All filtered products - used for both pagination methods
    const filteredProducts = useMemo(() => 
        products.filter(product =>
            (selectedCategory ? product.category === selectedCategory : true) &&
            (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase()))
        ),
        [products, selectedCategory, searchTerm]
    );

    // Filter and paginate products based on the current display mode
    const filteredAndPaginatedProducts = useMemo(() => {
        // Make sure we're including all products, including those with _isOffline flag
        const productsToFilter = products;
        
        // Debug to check what's in the products array
        const offlineProducts = productsToFilter.filter(p => p._isOffline);
        if (offlineProducts.length > 0) {
            console.log(`Found ${offlineProducts.length} offline products in the products array:`, offlineProducts);
        }
        
        // Apply filters
        const filtered = productsToFilter.filter(product =>
            (selectedCategory ? product.category === selectedCategory : true) &&
            (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        // Apply pagination based on mode
        if (displayMode === 'endless') {
            // For endless scrolling, show products based on loadedPages
            const totalToShow = Math.min(loadedPages * itemsPerPage, filtered.length);
            return filtered.slice(0, totalToShow);
        } else {
            // For regular pagination, show products from the current page only
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
            return filtered.slice(startIndex, endIndex);
        }
    }, [products, selectedCategory, searchTerm, itemsPerPage, currentPage, loadedPages, displayMode]);

    // Get categories from products
    const categories = useMemo(() => 
        [...new Set(products.map(product => product.category))].sort((a, b) => {
            const indexA = categoryOrder.indexOf(a);
            const indexB = categoryOrder.indexOf(b);
            
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            
            return a.localeCompare(b);
        }),
        [products, categoryOrder]
    );

    // Get price categories with memoization
    const categorizedProducts = useMemo(() => 
        categorizeProductsByPrice(products),
        [products]
    );

    // Function to handle page changes
    const handlePageChange = (page) => {
        setCurrentPage(page);
        // Scroll to top when changing pages
        window.scrollTo({
            top: 0, 
            behavior: 'smooth'
        });
    };

    // Calculate pagination metrics
    const totalFilteredProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalFilteredProducts / itemsPerPage);

    // Function to get heart symbol based on price category
    const getHeartSymbol = (product) => {
        if (categorizedProducts.low.some(p => p.id === product.id)) return "🩵"; // Blue heart for low price
        if (categorizedProducts.mid.some(p => p.id === product.id)) return "💛"; // Yellow heart for mid price
        if (categorizedProducts.high.some(p => p.id === product.id)) return "🩷"; // Pink heart for high price
        return "";
    };

    // Connection status indicator component
    const ConnectionIndicator = () => (
        <div className={`connection-indicator ${connectionStatus}`}>
            {connectionStatus === 'connected' && <span>✅ Connected to generation service</span>}
            {connectionStatus === 'connecting' && <span>⏳ Connecting to generation service...</span>}
            {connectionStatus === 'disconnected' && <span>⚠️ Disconnected from generation service</span>}
            {connectionStatus === 'error' && <span>❌ Error connecting to generation service</span>}
        </div>
    );

    // Add this right after your existing ConnectionIndicator component
    const NetworkStatus = () => {
        const syncUnsavedChanges = async () => {
            try {
                const synced = await syncPendingOperations();
                if (synced > 0) {
                    fetchProducts(); // Refresh products after sync
                }
            } catch (err) {
                console.error("Failed to sync:", err);
            }
        };
        
        return (
            <div className="network-status-container">
                {!isOnline && (
                    <div className="network-status network-offline">
                        <span className="status-icon">📶</span>
                        <span>You are offline. Changes will be saved locally and synced when you go back online.</span>
                    </div>
                )}
                
                {isOnline && !isServerUp && (
                    <div className="network-status server-offline">
                        <span className="status-icon">🖥️</span>
                        <span>Server is currently unavailable. Your changes are saved locally.</span>
                    </div>
                )}
                
                {/* {pendingOperations.length > 0 && isOnline && isServerUp && (
                    <div className="network-status pending-changes">
                        <span className="status-icon">🔄</span>
                        <span>{pendingOperations.length} change(s) waiting to be synced.</span>
                        <button 
                            className="sync-button"
                            onClick={syncUnsavedChanges}
                            disabled={isSyncing}
                        >
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                    </div>
                )}
                
                {isSyncing && (
                    <div className="network-status syncing">
                        <span className="status-icon">🔄</span>
                        <span>Syncing your changes with the server...</span>
                    </div>
                )} */}
            </div>
        );
    };

    const ObservedImage = ({ src, alt }) => {
        const [isVisible, setIsVisible] = useState(false);
        const [isLoaded, setIsLoaded] = useState(false);
        const imgRef = useRef();
        
        useEffect(() => {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.disconnect();
                    }
                },
                { rootMargin: '200px' } // Load images 200px before they come into view
            );
            
            if (imgRef.current) {
                observer.observe(imgRef.current);
            }
            
            return () => observer.disconnect();
        }, []);
        
        return (
            <div 
                ref={imgRef}
                className="image-container" 
                style={{ position: 'relative', height: '300px', backgroundColor: '#f0f0f0' }}
            >
                {!isLoaded && (
                    <div className="image-placeholder">
                        <div className="pulse-animation"></div>
                    </div>
                )}
                
                {isVisible && (
                    <img 
                        src={src} 
                        alt={alt} 
                        className="product-image" 
                        style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
                        onLoad={() => setIsLoaded(true)}
                        onError={() => console.error(`Failed to load image: ${src}`)}
                    />
                )}
            </div>
        );
    };

    // Function to load more products as user scrolls
    const loadMoreProducts = useCallback(async () => {
        if (displayMode !== 'endless' || isLoadingMore || allLoaded) return;
        
        setIsLoadingMore(true);
        
        try {
            const nextPage = loadedPages + 1;
            const batchSize = itemsPerPage; // Use the current itemsPerPage for consistency
            
            console.log(`Loading page ${nextPage} for endless scrolling (batch size: ${batchSize})`);
            
            // If online, fetch directly from server with pagination
            if (isOnline && isServerUp) {
                try {
                    // Build query parameters for filtering
                    const queryParams = new URLSearchParams();
                    if (searchTerm) queryParams.set('search', searchTerm);
                    if (selectedCategory) queryParams.set('category', selectedCategory);
                    if (sortOption) queryParams.set('sort', sortOption);
                    queryParams.set('page', nextPage);
                    queryParams.set('limit', batchSize);
                    
                    // Make the request with a timeout to prevent hanging
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
                    
                    // Make the request
                    const response = await axios.get(`${API_URL}/products?${queryParams.toString()}`, {
                        signal: controller.signal
                    }).finally(() => clearTimeout(timeoutId));
                    
                    const newBatch = response.data.products;
                    
                    console.log(`Received ${newBatch.length} products for page ${nextPage}`);
                    
                    // If we get fewer products than requested or none, we've reached the end
                    if (newBatch.length === 0) {
                        setAllLoaded(true);
                    } else {
                        // Update products state by adding the new batch
                        setProducts(prevProducts => {
                            // Check for duplicates by creating a map of existing products by ID
                            const existingProductMap = new Map(
                                prevProducts.map(product => [String(product.id), product])
                            );
                            
                            // Add new products that don't already exist
                            newBatch.forEach(product => {
                                if (!existingProductMap.has(String(product.id))) {
                                    existingProductMap.set(String(product.id), product);
                                }
                            });
                            
                            // Convert map back to array
                            return Array.from(existingProductMap.values());
                        });
                        
                        // Preload next batch of images for smoother scrolling
                        setTimeout(() => {
                            newBatch.forEach(product => {
                                const img = new Image();
                                const imgSrc = product.image.startsWith('http') 
                                    ? product.image 
                                    : `${IMAGES_BASE_URL}${product.image}`;
                                img.src = imgSrc;
                            });
                        }, 100);
                        
                        // Update loaded pages
                        setLoadedPages(nextPage);
                    }
                } catch (error) {
                    if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
                        console.warn("Request timeout, falling back to client-side pagination");
                    } else {
                        console.error("Error fetching more products:", error);
                    }
                    // Fall back to client-side approach with existing products
                    handleClientSidePagination(nextPage, batchSize);
                }
            } else {
                // When offline, use client-side pagination with cached products
                handleClientSidePagination(nextPage, batchSize);
            }
        } catch (err) {
            console.error("Error in loadMoreProducts:", err);
        } finally {
            setIsLoadingMore(false);
        }
    }, [displayMode, isLoadingMore, allLoaded, loadedPages, itemsPerPage, isOnline, isServerUp, searchTerm, selectedCategory, sortOption, filteredProducts]);

    // Helper function for client-side pagination
    const handleClientSidePagination = (nextPage, batchSize) => {
        // Calculate what products to show next from existing products array
        const startIndex = (nextPage - 1) * batchSize;
        const endIndex = startIndex + batchSize;
        const nextBatchProducts = filteredProducts.slice(startIndex, endIndex);
        
        // Log diagnostic info
        console.log(`Using client-side pagination: ${startIndex} to ${endIndex} of ${filteredProducts.length} total`);
        console.log(`Next batch has ${nextBatchProducts.length} products`);
        
        // Check if we're at the end
        if (nextBatchProducts.length === 0 || endIndex >= filteredProducts.length) {
            setAllLoaded(true);
        }
        
        // Update loaded pages
        setLoadedPages(nextPage);
    };

    // Set up the intersection observer for endless scrolling
    useEffect(() => {
        // Only set up the observer if we're in endless scrolling mode
        if (displayMode !== 'endless') {
            return;
        }
        
        const options = {
            root: null,
            rootMargin: '200px', // Increased margin to start loading earlier
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (entry.isIntersecting && !isLoadingMore && !allLoaded) {
                // Add a small delay to prevent too many simultaneous requests
                setTimeout(() => {
                    loadMoreProducts();
                }, 100);
            }
        }, options);
        
        scrollObserverRef.current = observer;
        
        if (scrollTriggerRef.current) {
            observer.observe(scrollTriggerRef.current);
        }
        
        return () => {
            if (scrollObserverRef.current) {
                scrollObserverRef.current.disconnect();
            }
        };
    }, [isLoadingMore, allLoaded, displayMode, loadMoreProducts]);

    return (
        <div>
            <div className="menu-page">
                <h1 className="welcome-menu">Welcome to Pirate Café!</h1>
                <p className="menu-text">Thank you for choosing to visit our site!</p>
                <hr className="menu-divider" />
            </div>

            <div className="menu-container">
                <h2 className="menu-title">Menu</h2>
                <p className="menu-description">
                    Scroll through the menu or quickly search for a product by its name or description. <br />
                    Click on any product to go to its Product Detail page, where you can make any desired modifications, or add a new product to the menu!
                </p>

                <div className="search-filter-container">
                    <input 
                        className="search-bar"
                        type="text" 
                        placeholder="Search for a product..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select 
                        aria-label="filter by category" 
                        className="filter-dropdown" 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                    <select 
                        aria-label="sort by price" 
                        className="sort-dropdown" 
                        value={sortOption} 
                        onChange={(e) => setSortOption(e.target.value)}
                    >
                        <option value="">No sorting</option>
                        <option value="asc">Sort ascending by price</option>
                        <option value="desc">Sort descending by price</option>
                    </select>
                    <select 
                        aria-label="items per page" 
                        className="items-per-page-dropdown" 
                        value={displayMode === 'endless' ? 'endless' : itemsPerPage}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === 'endless') {
                                setDisplayMode('endless');
                                // Don't change itemsPerPage value as it's used for other pagination
                            } else {
                                setItemsPerPage(Number(value));
                                setDisplayMode('pagination');
                                setCurrentPage(1); // Reset to first page when switching to pagination
                            }
                        }}
                    >
                        <option value={6}>6 items</option>
                        <option value={9}>9 items</option>
                        <option value={12}>12 items</option>
                        <option value={15}>15 items</option>
                        <option value="endless">Endless Scrolling</option>
                    </select>
                    <div className="button-group">
                        <button 
                            className={`generate-btn ${isGenerating ? 'active' : ''}`}
                            onClick={toggleGeneration}
                            disabled={connectionStatus !== 'connected'}
                        >
                            {isGenerating ? "Stop Generating" : "Generate Products"}
                        </button>
                        <button 
                            className="add-product-btn" 
                            onClick={() => navigate("/add")}
                        >
                            Add a product →
                        </button>
                    </div>
                </div>

                {/* Connection status indicator <ConnectionIndicator />*/}

                {/* Network status indicators */}
                <NetworkStatus />
                
                {/* Error display */}
                {error && (
                    <div className="error-message">
                        <p>{error}</p>
                    </div>
                )}

                {/* Generation status indicator and charts */}
                {isGenerating && (
                <div>
                    <div className="generation-indicator">
                        <p>Generating new products... {generatedCount} added so far</p>
                    </div>
                    
                    <div className="charts-container" style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginTop: '20px',
                        marginBottom: '20px'
                    }}>
                        <div className="chart-box" style={{ flex: 1, margin: '0 10px' }}>
                            <CategoryBarChart products={products} />
                        </div>
                        <div className="chart-box" style={{ flex: 1, margin: '0 10px' }}>
                            <PriceDistributionChart categorizedProducts={categorizedProducts} />
                        </div>
                        <div className="chart-box" style={{ flex: 1, margin: '0 10px' }}>
                            <PriceRangeChart products={products} />
                        </div>
                    </div>
                </div>
                )}

                {loading ? (
                    <div className="loading-indicator">Loading products...</div>
                ) : (
                    <div className="menu-grid">
                        {categories.map(category => {
                            // First filter by category from the filtered and paginated products
                            const categoryProducts = filteredAndPaginatedProducts.filter(product => product.category === category);
                            if (categoryProducts.length === 0) return null;
                            
                            // Sort products within this category
                            let sortedCategoryProducts = [...categoryProducts];
                            if (sortOption === "asc") {
                                sortedCategoryProducts.sort((a, b) => a.price - b.price);
                            } else if (sortOption === "desc") {
                                sortedCategoryProducts.sort((a, b) => b.price - a.price);
                            }
                            
                            return (
                                <div key={category}>
                                    <h3>{category}</h3>
                                    <div className="product-list">
                                    {sortedCategoryProducts.map((product, index) => (
                                        <div 
                                            key={product.id} 
                                            className="product-card"
                                            style={{ 
                                                animationDelay: `${index * 50}ms`,
                                            }}
                                        >
                                            {/* Add offline indicator */}
                                            {product._isOffline && (
                                                <span className="product-offline-indicator">Offline</span>
                                            )}
                                            
                                            <Link to={`/product/${encodeURIComponent(product.id)}`} className="product-link">
                                                <LazyImage 
                                                    src={product.image.startsWith('http') ? product.image : `${IMAGES_BASE_URL}${product.image}`} 
                                                    alt={product.name}
                                                    productId={product.id}
                                                />
                                                <div style={{ padding: '15px' }}>
                                                    <h4>{product.name}</h4>
                                                    <p>{product.description}</p>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                                                        <strong data-testid="product-price">{product.price} €</strong>
                                                        <span style={{ marginLeft: "8px", fontSize: "1.2em" }}>
                                                            {getHeartSymbol(product)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                
                {/* Pagination controls or scroll trigger based on display mode */}
                {displayMode === 'pagination' ? (
                    <>
                        {/* Pagination controls */}
                        {totalPages > 1 && (
                            <div className="pagination-container">
                                <button 
                                    className="pagination-button"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    aria-label="Previous page"
                                >
                                    &lt; Previous
                                </button>
                                
                                <div className="pagination-numbers">
                                    {[...Array(totalPages)].map((_, index) => (
                                        <button
                                            key={index}
                                            className={`pagination-number ${currentPage === index + 1 ? 'active' : ''}`}
                                            onClick={() => handlePageChange(index + 1)}
                                            aria-label={`Page ${index + 1}`}
                                            aria-current={currentPage === index + 1 ? 'page' : undefined}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </div>
                                
                                <button 
                                    className="pagination-button"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    aria-label="Next page"
                                >
                                    Next &gt;
                                </button>
                            </div>
                        )}
                        
                        {/* Pagination info */}
                        <div className="pagination-info">
                            Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
                            {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                        </div>
                    </>
                ) : (
                    // Endless scrolling
                    <div ref={scrollTriggerRef} className="scroll-trigger">
                        {!allLoaded ? (
                            <div className="loading-more">
                                {isLoadingMore ? (
                                    <div className="loading-spinner">
                                        <div className="spinner"></div>
                                        <span>Loading more products...</span>
                                    </div>
                                ) : (
                                    <div className="scroll-message">
                                        <div className="scroll-indicator">
                                            <div className="scroll-arrow"></div>
                                            <div className="scroll-arrow"></div>
                                            <div className="scroll-arrow"></div>
                                        </div>
                                        <span>Scroll for more products</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="end-of-results">
                                <p>You've reached the end of the menu</p>
                                <button 
                                    className="back-to-top"
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                >
                                    Back to top
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenuPage;