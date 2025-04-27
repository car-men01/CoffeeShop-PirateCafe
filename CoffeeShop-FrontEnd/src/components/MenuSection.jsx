import React from "react";
import menuImage from "../assets/menu.jpg"; // Replace with your image
import { useNavigate } from "react-router-dom";

const MenuSection = () => {
  const navigate = useNavigate();

  return (
    <section className="menu-section">
      <div className="menu-content">
        <div className="menu-header">
          <h2 className="look-menu">Look through the <br />menu</h2>
          <p>If you want to know what our shop can <br />
            offer you, look in the menu to find out <br />
            what the horizon holds out for you.</p>
            <button className="menu-btn" onClick={ () => navigate("/menu")}>Menu →</button>
        </div>
        <img src={menuImage} alt="Menu" className="menu-image"/>
        
      </div>
    </section>
  );
};

export default MenuSection;
