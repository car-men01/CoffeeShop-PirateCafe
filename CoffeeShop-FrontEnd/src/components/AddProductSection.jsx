import React from "react";
import add_product_image from "../assets/add_product_main.jpg"; // Replace with your image
import { useNavigate } from "react-router-dom";

const AddProductSection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="add-product">
      <div className="add-product-content">
        <img src={add_product_image} alt="Add product" className="add_product_image"/>

        <div className="add-product-header">
          <h2 class="add-head">Let’s add a new <br />product to the menu</h2>
          <p>Is there a product you would reaaaaly love <br />
          to get, but we don't have it? <br />
          Don’t worry, you can add it in our menu!</p>
          <button className="add-product-btn" onClick={ () => navigate("/add")}>Add a product →</button>
        </div>
      </div>
    </section>
  );
};

export default AddProductSection;
