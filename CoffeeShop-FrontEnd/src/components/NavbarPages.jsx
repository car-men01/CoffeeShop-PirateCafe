import React from "react";
import { useNavigate } from "react-router-dom";


const NavbarPages = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar-pages">
      <h1 className="logo-pages">Pirate Café</h1>
      <ul>
        <li></li>
        <li><button className="#menu" onClick={ () => navigate("/menu")}>Menu</button></li>
        {/* <li><button className="#cart">Shopping Cart</button></li> */}
        <li><button className="#home" onClick={ () => navigate("/")}>Home</button></li>
      </ul>
    </nav>
  );
};

export default NavbarPages;
