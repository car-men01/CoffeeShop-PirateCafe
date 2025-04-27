import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import MenuSection from "./components/MenuSection";
import AddProductSection from "./components/AddProductSection";
import AddPage from "./components/AddPage";
import NavbarPages from "./components/NavbarPages";
import './App.css';
import MenuPage from "./components/MenuPage";
import ProductDetail from "./components/ProductDetail";
import ScrollToTop from './ScrollToTop';
import NetworkProvider from './NetworkContext';
import ProductProvider from './ProductContext';
import VideoSection from './components/VideoSection';


function App() {
  return (
    <NetworkProvider>
      <ProductProvider>
      <Router>
      <ScrollToTop />
        <Routes>
          <Route path="/" element = {
            <div>
              <Navbar />
              <HeroSection />
              <VideoSection />
              <MenuSection />
              <AddProductSection />
            </div>
          } />
          <Route path="/menu" element = {
            <div>
              <NavbarPages />
              <MenuPage />

            </div>
          } />
          <Route path="/add" element = {
            <div>
              <NavbarPages />
              <AddPage />
            </div>
          } />
          <Route
            path="/product/:id"
            element={
              <div>
                <NavbarPages />
                <ProductDetail />
              </div>
            }
          />
        </Routes>
      </Router>
      </ProductProvider>
    </NetworkProvider>
  );
}

export default App;


