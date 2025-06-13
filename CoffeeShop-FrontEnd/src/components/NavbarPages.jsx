import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { cartService } from '../services/cartService';
import '../styles/NavbarPages.css';

const NavbarPages = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, currentUser, logout } = useContext(AuthContext);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      loadCartCount();
    }
  }, [isAuthenticated, isAdmin]);
  // Refresh cart count when cart changes
  useEffect(() => {
    const handleCartUpdate = () => {
      if (isAuthenticated && !isAdmin) {
        loadCartCount();
      }
    };

    // Listen for cart update events
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [isAuthenticated, isAdmin]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.user-dropdown')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const loadCartCount = async () => {
    try {
      const cartData = await cartService.getCart();
      const totalItems = cartData.items ? cartData.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
      setCartItemCount(totalItems);
    } catch (error) {
      console.error('Error loading cart count:', error);
      setCartItemCount(0);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    closeDropdown();
  };
  return (
    <nav className="navbar-pages">
      <h1 className="logo-pages">Pirate Café</h1>
      
      <div className="navbar-center">
        {/* Empty center section */}
      </div>

      <div className="navbar-right">
        <ul>
          <li><button className="nav-btn" onClick={() => navigate("/menu")}>Menu</button></li>
          <li><button className="nav-btn" onClick={() => navigate("/")}>Home</button></li>
        </ul>        {isAuthenticated ? (
          <div className="user-dropdown">
            <button className="user-dropdown-btn" onClick={toggleDropdown}>
              {currentUser?.username} ▼
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                {!isAdmin && (
                  <>                    <button 
                      className="dropdown-item" 
                      onClick={() => handleMenuItemClick("/cart")}
                    >
                      Cart
                      {cartItemCount > 0 && (
                        <span className="cart-count">({cartItemCount})</span>
                      )}
                    </button>
                    <button 
                      className="dropdown-item" 
                      onClick={() => handleMenuItemClick("/orders")}
                    >
                      My Orders
                    </button>                    <button 
                      className="dropdown-item" 
                      onClick={() => handleMenuItemClick("/wallet")}
                    >
                      My Wallet
                    </button>
                    <button 
                      className="dropdown-item" 
                      onClick={() => handleMenuItemClick("/ai-assistant")}
                    >
                      🤖 AI Assistant
                    </button>
                  </>
                )}                {isAdmin && (
                  <>
                    <button 
                      className="dropdown-item" 
                      onClick={() => handleMenuItemClick("/admin")}
                    >
                      Admin Dashboard
                    </button>
                    <button 
                      className="dropdown-item" 
                      onClick={() => handleMenuItemClick("/admin/orders")}
                    >
                      Manage Orders
                    </button>
                    <button 
                      className="dropdown-item" 
                      onClick={() => handleMenuItemClick("/admin/wallets")}
                    >
                      User Wallets
                    </button>
                    <button 
                      className="dropdown-item" 
                      onClick={() => handleMenuItemClick("/ai-assistant")}
                    >
                      🤖 AI Assistant
                    </button>
                  </>
                )}
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item logout-item" 
                  onClick={() => {
                    logout();
                    navigate("/");
                    closeDropdown();
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="login-btn" onClick={() => navigate("/login")}>
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};export default NavbarPages;
