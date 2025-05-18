import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const NavbarPages = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, currentUser, logout } = useContext(AuthContext);


  return (
    <nav className="navbar-pages">
      <h1 className="logo-pages">Pirate Café</h1>
      {isAuthenticated && (
          <span className="user-greeting">
            Hi, {currentUser?.username}
          </span>
        )}
      <ul>
        <li><button className="#menu" onClick={() => navigate("/menu")}>Menu</button></li>
        <li><button className="#home" onClick={() => navigate("/")}>Home</button></li>
        
        {isAuthenticated ? (
          <>
            {isAdmin && (
              <li>
                <button className="admin-btn" onClick={() => navigate("/admin")}>
                  Admin
                </button>
              </li>
            )}
            <li>
              <button className="logout-btn" onClick={() => {
                logout();
                navigate("/");
              }}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <button className="login-btn" onClick={() => navigate("/login")}>
                Sign In
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default NavbarPages;
