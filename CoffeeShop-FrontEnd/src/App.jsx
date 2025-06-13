import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from './AuthContext';
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import MenuSection from "./components/MenuSection";
import AddProductSection from "./components/AddProductSection";
import AddPage from "./components/AddPage";
import NavbarPages from "./components/NavbarPages";
import Footer from "./components/Footer";
import './App.css';
import MenuPage from "./components/MenuPage";
import ProductDetail from "./components/ProductDetail";
import ScrollToTop from './ScrollToTop';
import NetworkProvider from './NetworkContext';
import ProductProvider from './ProductContext';
import VideoSection from './components/VideoSection';
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute'; // We'll create this next
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Orders from './components/Orders';
import AdminOrders from './components/AdminOrders';
import Wallet from './components/Wallet';
import AdminWallets from './components/AdminWallets';
import ChatbotPage from './components/ChatbotPage';

function App() {
  return (
    <AuthProvider>
      <NetworkProvider>
        <ProductProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={
                <div>
                  <NavbarPages />
                  <HeroSection />
                  <VideoSection />
                  <MenuSection />
                  <AddProductSection />
                  <Footer />
                </div>
              } />
              <Route path="/menu" element={
                <div>
                  <NavbarPages />
                  <MenuPage />
                  <Footer />
                </div>
              } />
              <Route path="/add" element={
                <div>
                  <NavbarPages />
                  <AddPage />
                  <Footer />
                </div>
              } />
              <Route path="/product/:id" element={
                <div>
                  <NavbarPages />
                  <ProductDetail />
                  <Footer />
                </div>
              } />
              
              {/* Authentication routes */}
              <Route path="/login" element={
                <div>
                  <NavbarPages />
                  <Login />
                  <Footer />
                </div>
              } />
              <Route path="/register" element={
                <div>
                  <NavbarPages />
                  <Register />
                  <Footer />
                </div>
              } />
              
              {/* Cart and Order routes (protected) */}
              <Route path="/cart" element={
                <ProtectedRoute userOnly>
                  <div>
                    <NavbarPages />
                    <Cart />
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute userOnly>
                  <div>
                    <NavbarPages />
                    <Checkout />
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute userOnly>
                  <div>
                    <NavbarPages />
                    <Orders />
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/wallet" element={
                <ProtectedRoute userOnly>
                  <div>
                    <NavbarPages />
                    <Wallet />
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/ai-assistant" element={
                <ProtectedRoute>
                  <div>
                    <NavbarPages />
                    <ChatbotPage />
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />
              
              {/* Admin routes (protected) */}
              <Route path="/admin" element={
                <ProtectedRoute adminOnly>
                  <div>
                    <NavbarPages />
                    <AdminDashboard />
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <ProtectedRoute adminOnly>
                  <div>
                    <NavbarPages />
                    <AdminOrders />
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin/wallets" element={
                <ProtectedRoute adminOnly>
                  <div>
                    <NavbarPages />
                    <AdminWallets />
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </ProductProvider>
      </NetworkProvider>
    </AuthProvider>
  );
}

export default App;