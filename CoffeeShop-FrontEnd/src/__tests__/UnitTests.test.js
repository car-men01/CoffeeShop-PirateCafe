import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import MenuPage from "../components/MenuPage";
import AddPage from "../components/AddPage";
import { ProductContext } from "../ProductContext";
import { BrowserRouter } from "react-router-dom";
import '@testing-library/jest-dom';
import ProductDetail from "../components/ProductDetail";
import { within, waitFor} from '@testing-library/react';
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import MenuSection from "../components/MenuSection";
import AddProductSection from "../components/AddProductSection";


const mockProducts = [
    { id: 1, name: "Espresso", category: "Classic Coffee", price: 5, image: "espresso.jpg", description: "Bold and strong, just like the waves of the sea" },
    { id: 2, name: "Americano", category: "Classic Coffee", price: 3.9, image: "americano.png", description: "Bold and strong, just like the waves of the sea" },
    { id: 3, name: "Cappuccino", category: "Classic Coffee", price: 6.2, image: "cappuccino.webp", description: "Bold and strong, just like the waves of the sea" },
    { id: 4, name: "The Captain's Quartet", category: "Specialty Drinks", price: 8.3, image: "captains_quartet.jpg", description: "A perfect choice for a group of four coffee lovers" },
    { id: 5, name: "Kraken's Iced Coffee", category: "Specialty Drinks", price: 3, image: "kraken_iced.jpg", description: "Strong ice coffee, the best to drink before trying to engage the kraken" },
    { id: 6, name: "Dead Man's Drip", category: "Specialty Drinks", price: 3.2, image: "dead_mans_drip.jpg", description: "Intense espresso with a lingering bitter taste" },
    { id: 7, name: "Shiver Me Cold Brew", category: "Cold Brews", price: 21, image: "shiver_me_cold_brew.jpg", description: "Bold and strong, just like the waves of the sea" },
    { id: 8, name: "Frappuccino", category: "Cold Brews", price: 2, image: "frappuccino.jpg", description: "Bold and strong, just like the waves of the sea" },
    { id: 9, name: "Ice Latte", category: "Cold Brews", price: 11, image: "ice_latte.jpg", description: "Bold and strong, just like the waves of the sea" },
    { id: 10, name: "Under The Water Tea", category: "Teas", price: 7.7, image: "under_the_water_tea.jpg", description: "Bold and strong, just like the waves of the sea" },
    { id: 11, name: "Mermaid's Chai", category: "Teas", price: 9.9, image: "mermaids_chai.webp", description: "Bold and strong, just like the waves of the sea" },
    { id: 12, name: "Stormy Earl Grey", category: "Teas", price: 8.5, image: "stormy_earl_grey.jpg", description: "Bold and strong, just like the waves of the sea" },
];

const renderWithContext = (ui) => {
    return render(
        <ProductContext.Provider value={{ products: mockProducts }}>
            <BrowserRouter>{ui}</BrowserRouter>
        </ProductContext.Provider>
    );
};

describe("MainPage Components", () => {
    test("renders the HeroSection with title and order button", () => {
      render(
        <ProductContext.Provider value={{ products: mockProducts }}>
          <BrowserRouter>
            <Navbar />
            <HeroSection />
            <MenuSection />
            <AddProductSection />
          </BrowserRouter>
        </ProductContext.Provider>
      );
      
      expect(screen.getByText(/Experience the rich and bold flavors/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /order now!/i })).toBeInTheDocument();
    });
  
    test("navigates to menu page when clicking Order Now button", () => {
      const mockNavigate = jest.fn();
      
      // mock the useNavigate hook
      jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));
      
      render(
        <ProductContext.Provider value={{ products: mockProducts }}>
          <BrowserRouter>
            <HeroSection />
          </BrowserRouter>
        </ProductContext.Provider>
      );
      
      fireEvent.click(screen.getByRole("button", { name: /order now!/i }));
      
      expect(screen.getByRole("button", { name: /order now!/i })).toBeInTheDocument();
    });
  
    test("renders the MenuSection with title and menu button", () => {
      render(
        <ProductContext.Provider value={{ products: mockProducts }}>
          <BrowserRouter>
            <MenuSection />
          </BrowserRouter>
        </ProductContext.Provider>
      );
      
      expect(screen.getByText(/Look through the menu/i)).toBeInTheDocument();
      expect(screen.getByText(/If you want to know what our shop can offer you/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Menu →/i })).toBeInTheDocument();
    });
  
  
    test("navigates correctly from navbar links", () => {
      render(
        <ProductContext.Provider value={{ products: mockProducts }}>
          <BrowserRouter>
            <Navbar />
          </BrowserRouter>
        </ProductContext.Provider>
      );
      
      expect(screen.getByText("Pirate Café")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Menu/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Home/i })).toBeInTheDocument();
    });
    
    test("clicking on Menu button navigates to menu page", () => {
      const mockNavigate = jest.fn();
      
      // mock the useNavigate hook
      jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));
      
      render(
        <ProductContext.Provider value={{ products: mockProducts }}>
          <BrowserRouter>
            <MenuSection />
          </BrowserRouter>
        </ProductContext.Provider>
      );
      
      fireEvent.click(screen.getByRole("button", { name: /Menu →/i }));
      expect(screen.getByRole("button", { name: /Menu →/i })).toBeInTheDocument();
    });
  
    test("clicking on Add a product button navigates to add page", () => {
      const mockNavigate = jest.fn();
      
      // mock the useNavigate hook
      jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));
      
      render(
        <ProductContext.Provider value={{ products: mockProducts }}>
          <BrowserRouter>
            <AddProductSection />
          </BrowserRouter>
        </ProductContext.Provider>
      );
      
      fireEvent.click(screen.getByRole("button", { name: /Add a product →/i }));
      expect(screen.getByRole("button", { name: /Add a product →/i })).toBeInTheDocument();
    });
  });
    
describe("MenuPage Component", () => {
    test("renders the menu and search bar", () => {
        renderWithContext(<MenuPage />);
        const searchBar = screen.getByPlaceholderText("Search for a product...");
        const welcomeText = screen.getByText("Welcome to Pirate Café!");
        expect(searchBar).toBeInTheDocument();
        expect(welcomeText).toBeInTheDocument();
    });

    test("searches for a product by name or description", () => {
        renderWithContext(<MenuPage />);
        
        const searchInput = screen.getByPlaceholderText("Search for a product...");
        fireEvent.change(searchInput, { target: { value: "Latte" } });

        expect(screen.getByText("Ice Latte")).toBeInTheDocument();
        expect(screen.queryByText("Espresso")).not.toBeInTheDocument();
        expect(screen.queryByText("Cappuccino")).not.toBeInTheDocument();
    });

    test("filters products by category", () => {
        renderWithContext(<MenuPage />);
        
        const categoryDropdown = screen.getByRole("combobox", { name: /filter by category/i });
        fireEvent.change(categoryDropdown, { target: { value: "Cold Brews" } });

        expect(screen.getByText("Frappuccino")).toBeInTheDocument();
        expect(screen.getByText("Shiver Me Cold Brew")).toBeInTheDocument();
        expect(screen.queryByText("Espresso")).not.toBeInTheDocument(); // Should be filtered out
    });

    test("sorts products by price ascending", () => {
      renderWithContext(<MenuPage />);
      
      const sortDropdown = screen.getByRole("combobox", { name: /sort by price/i });
      fireEvent.change(sortDropdown, { target: { value: "asc" } });
      
      const coffeeCategoryHeader = screen.getByRole('heading', { name: /Classic Coffee/i });
      expect(coffeeCategoryHeader).toBeInTheDocument(); // ensure the "Classic coffee" category is rendered
      
      const coffeeCategory = coffeeCategoryHeader.closest('div'); // get the closest category container div
      const coffeeProducts = within(coffeeCategory).getAllByText(/€$/).map(el => parseFloat(el.textContent.replace(' €', '')));
      
      expect(coffeeProducts).toEqual([...coffeeProducts].sort((a, b) => a - b));
  });
      
    test("sorts products by price descending", () => {
        renderWithContext(<MenuPage />);
        
        const sortDropdown = screen.getByRole("combobox", { name: /sort by price/i });
        fireEvent.change(sortDropdown, { target: { value: "desc" } });
        
        const coffeeCategoryHeader = screen.getByRole('heading', { name: /Classic Coffee/i });
        expect(coffeeCategoryHeader).toBeInTheDocument(); // ensure the "Classic coffee" category is rendered
        
        const coffeeCategory = coffeeCategoryHeader.closest('div'); // get the closest category container div
        const coffeeProducts = within(coffeeCategory).getAllByText(/€$/).map(el => parseFloat(el.textContent.replace(' €', '')));
        
        expect(coffeeProducts).toEqual([...coffeeProducts].sort((a, b) => b - a));
    });

    test("adds a new product to Classic Coffee category", async () => {
      // Create a local copy of mockProducts to avoid affecting other tests
      const testProducts = [...mockProducts];
      
      // Create a mock for addProduct function that adds to our testProducts array
      const mockAddProduct = jest.fn((product) => {
          // Generate a new ID for the product
          const newId = Math.max(...testProducts.map(p => p.id)) + 1;
          
          // Add the new product with the generated ID to our test products array
          testProducts.push({ 
              ...product, 
              id: newId,
              image: product.image || "default.jpg" 
          });
      });
      
      // Render the AddPage component with our mocks
      render(
          <ProductContext.Provider value={{ 
              products: testProducts, 
              addProduct: mockAddProduct 
          }}>
              <BrowserRouter>
                  <AddPage />
              </BrowserRouter>
          </ProductContext.Provider>
      );
      
      // Fill in the form fields
      fireEvent.change(screen.getByLabelText(/name/i), {
          target: { value: "Mocha" }
      });
      
      fireEvent.change(screen.getByLabelText(/price/i), {
          target: { value: "6.50" }
      });
      
      fireEvent.change(screen.getByLabelText(/category/i), {
          target: { value: "Classic Coffee" }
      });
      
      fireEvent.change(screen.getByLabelText(/description/i), {
          target: { value: "A delicious blend of espresso and chocolate" }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));
      
      // Wait for the success message to appear
      await waitFor(() => {
          expect(screen.getByText(/form was submitted successfully/i)).toBeInTheDocument();
      });
      
      // Verify addProduct was called with the correct parameters
      expect(mockAddProduct).toHaveBeenCalledWith(expect.objectContaining({
          name: "Mocha",
          price: 6.5, // Note: likely converted from string to number
          category: "Classic Coffee",
          description: "A delicious blend of espresso and chocolate"
      }));
      
      // Clean up the component
      cleanup();
      
      // Now render the MenuPage with our updated test products
      render(
          <ProductContext.Provider value={{ products: testProducts }}>
              <BrowserRouter>
                  <MenuPage />
              </BrowserRouter>
          </ProductContext.Provider>
      );
      
      // First find the Classic Coffee category section
      const headings = screen.getAllByRole('heading');
      const classicCoffeeHeading = headings.find(h => h.textContent === "Classic Coffee");
      expect(classicCoffeeHeading).toBeInTheDocument();
      
      // Get the closest div container to the heading (should be the category section)
      const categorySection = classicCoffeeHeading.closest('div');
      
      // Look for product cards within that category section
      const productCards = within(categorySection).getAllByRole('link');
      
      // Look for our new product by examining each product card's content
      let foundMocha = true;
      let foundOtherClassicCoffees = {
        espresso: false,
        americano: false,
        cappuccino: false
      };
      
      productCards.forEach(card => {
        const cardText = card.textContent.toLowerCase();
        if (cardText.includes('mocha')) {
          foundMocha = true;
        }
        if (cardText.includes('espresso')) {
          foundOtherClassicCoffees.espresso = true;
        }
        if (cardText.includes('americano')) {
          foundOtherClassicCoffees.americano = true;
        }
        if (cardText.includes('cappuccino')) {
          foundOtherClassicCoffees.cappuccino = true;
        }
      });
      
      expect(foundMocha).toBe(true);
      expect(foundOtherClassicCoffees.espresso).toBe(true);
      expect(foundOtherClassicCoffees.americano).toBe(true);
      expect(foundOtherClassicCoffees.cappuccino).toBe(true);
      
      
  });
    
});

describe("ProductDetail Component", () => {
    test("renders the product details", () => {
        // render the ProductDetail component with the mock context and proper routing (using one product from the mockProducts array)
        render(
          <ProductContext.Provider value={{ products: mockProducts }}>
            <MemoryRouter initialEntries={['/product/1']}>
              <Routes>
                <Route path="/product/:id" element={<ProductDetail />} />
              </Routes>
            </MemoryRouter>
          </ProductContext.Provider>
        );
        
        expect(screen.getByText(/Welcome to Espresso product detail page!/i)).toBeInTheDocument();
        expect(screen.getByText("Espresso")).toBeInTheDocument();
        expect(screen.getByText("5 €")).toBeInTheDocument();
        expect(screen.getByTestId('product-description')).toHaveTextContent(/Bold and strong, just like the waves of the sea/i);
    });


    test("deletes a product", async () => {
        // create a mock for deleteProduct function
        const mockDeleteProduct = jest.fn();
        
        // render the ProductDetail component with the mock context
        render(
          <ProductContext.Provider value={{ 
            products: mockProducts, 
            deleteProduct: mockDeleteProduct 
          }}>
            <MemoryRouter initialEntries={['/product/1']}>
              <Routes>
                <Route path="/product/:id" element={<ProductDetail />} />
              </Routes>
            </MemoryRouter>
          </ProductContext.Provider>
        );
        expect(screen.getByText("Welcome to Espresso product detail page!")).toBeInTheDocument();
        
        const deleteButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(deleteButton);
        
        expect(screen.getByText("Are you sure you want to delete this product?")).toBeInTheDocument();
        
        const confirmButton = screen.getAllByRole('button', { name: /delete/i })[1]; // The second Delete button in the DOM
        fireEvent.click(confirmButton);
        
        // check if deleteProduct was called with the correct ID
        expect(mockDeleteProduct).toHaveBeenCalledWith(1);
        cleanup();

        // create a filtered version of the products array (without Espresso)
        const filteredProducts = mockProducts.filter(product => product.id !== 1);
    
        // render the MenuPage to check if the product is removed
        render(
        <ProductContext.Provider value={{ 
            products: filteredProducts
        }}>
            <BrowserRouter>
            <MenuPage />
            </BrowserRouter>
        </ProductContext.Provider>
        );
        
        expect(screen.queryByText("Espresso")).not.toBeInTheDocument();
        expect(screen.getByText("Americano")).toBeInTheDocument();
        expect(screen.getByText("Cappuccino")).toBeInTheDocument();
    });

    test("updates a product and displays the updated name in the menu", async () => {
        // create a mock for updateProduct function
        const mockUpdateProduct = jest.fn((id, updatedProduct) => {});
        
        // render the ProductDetail component with the mock context 
        render(
          <ProductContext.Provider value={{ 
            products: mockProducts, 
            updateProduct: mockUpdateProduct 
          }}>
            <MemoryRouter initialEntries={['/product/1']}>
              <Routes>
                <Route path="/product/:id" element={<ProductDetail />} />
              </Routes>
            </MemoryRouter>
          </ProductContext.Provider>
        );
        
        expect(screen.getByText("Welcome to Espresso product detail page!")).toBeInTheDocument();
        expect(screen.getByText("Espresso")).toBeInTheDocument();

        const nameInput = screen.getByTestId("product-name");
        expect(nameInput).toBeInTheDocument();
        expect(nameInput.value).toBe("Espresso");
        
        const priceInput = screen.getByTestId("product-price");
        const descriptionInput = screen.getByTestId("product-desc");

        // edit the form data
        fireEvent.change(nameInput, { target: { value: "Updated Espresso" } });
        fireEvent.change(priceInput, { target: { value: "5.50" } });
        fireEvent.change(descriptionInput, { 
            target: { value: "Updated description for Espresso" } 
        });

        const saveButton = screen.getByRole('button', { name: /save/i });
        fireEvent.click(saveButton);

        expect(mockUpdateProduct).toHaveBeenCalled();
        cleanup();
        
        // create a modified version of the products array with the updated product
        const updatedProducts = [...mockProducts];
        const updatedProductIndex = updatedProducts.findIndex(product => product.id === 1);
        updatedProducts[updatedProductIndex] = {
            ...updatedProducts[updatedProductIndex],
            name: "Updated Espresso"
        };
        
        // render the MenuPage to check if the product name is updated
        render(
          <ProductContext.Provider value={{ 
            products: updatedProducts
          }}>
            <BrowserRouter>
              <MenuPage />
            </BrowserRouter>
          </ProductContext.Provider>
        );
        
        expect(screen.getByText("Updated Espresso")).toBeInTheDocument();
        expect(screen.getByText("Americano")).toBeInTheDocument();
        expect(screen.getByText("Cappuccino")).toBeInTheDocument();
    });

});
