import React from "react";
import heroImage from "../assets/coverr.jpg"; // cover img path
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="hero" style={{ backgroundImage: `url(${heroImage})` }} >
      <div className="hero-content">
        <h1 className="main-title">Pirate Café</h1>
        <p className="sub">
            <b>Experience the rich and bold flavors of our exquisite coffee blends with a <br />
            wild taste of the salty sea, crafted to awaken your inner senses and start <br />
            your day right!</b>
        </p>
        <button className="order-btn" onClick={ () => navigate("/menu")}>Order now!</button>
      </div>
    </section>
  );
};

export default HeroSection;
