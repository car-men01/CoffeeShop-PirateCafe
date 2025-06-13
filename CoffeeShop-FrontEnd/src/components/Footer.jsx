import React from 'react';
import { Link } from 'react-router-dom';
import { FaCoffee } from 'react-icons/fa';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Brand and Description Section */}
          <div className="footer-section brand-section">
            <div className="footer-brand-line">
              <div className="footer-brand">
                <FaCoffee className="footer-logo" />
                <h3>Pirate Cafe</h3>
              </div>
              <p className="footer-description">
                Ahoy matey! Welcome to Pirate Cafe, where every cup tells a tale and every sip is an adventure on the high seas of flavor.
              </p>
            </div>
          </div>

          {/* Links Sections */}
          <div className="footer-section links-section">
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/menu">Menu</Link></li>
            </ul>
          </div>

          <div className="footer-section links-section">
            <ul className="footer-links">
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
