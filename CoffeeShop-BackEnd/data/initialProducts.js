// This file contains the initial products for the coffee shop application.
const initialProducts = [
    // Classic Coffee
    { id: 1, name: "Espresso", category: "Classic Coffee", price: 5, image: "/assets/espresso.jpg", description: "Bold and strong, just like the waves of the sea" },
    { id: 2, name: "Americano", category: "Classic Coffee", price: 3.9, image: "/assets/americano.png", description: "A softened espresso with a bit of hot water" },
    { id: 3, name: "Cappuccino", category: "Classic Coffee", price: 6.2, image: "/assets/cappuccino.webp", description: "Foamy coffee, but enough to keep you awake for a whole day" },
    { id: 4, name: "Mocha", category: "Classic Coffee", price: 6.5, image: "/assets/mocha.jpg", description: "A chocolatey delight with an espresso kick" },
    { id: 5, name: "Flat White", category: "Classic Coffee", price: 6.7, image: "/assets/flat_white.jpg", description: "Silky smooth espresso with creamy milk" },
    { id: 6, name: "Macchiato", category: "Classic Coffee", price: 5.2, image: "/assets/macchiato.jpg", description: "Espresso topped with a hint of frothy milk" },
    { id: 7, name: "Turkish Coffee", category: "Classic Coffee", price: 4.5, image: "/assets/turkish_coffee.jpg", description: "Rich, unfiltered, and steeped in tradition" },
    { id: 8, name: "Irish Coffee", category: "Classic Coffee", price: 9.0, image: "/assets/irish_coffee.jpg", description: "Coffee with a touch of whiskey and whipped cream" },
    { id: 9, name: "Vienna Coffee", category: "Classic Coffee", price: 7.5, image: "/assets/vienna_coffee.jpg", description: "Strong espresso topped with whipped cream" },

    // Specialty Drinks
    { id: 10, name: "The Captain's Quartet", category: "Specialty Drinks", price: 8.3, image: "/assets/captains_quartet.jpg", description: "A perfect choice for a group of four coffee lovers" },
    { id: 11, name: "Kraken's Iced Coffee", category: "Specialty Drinks", price: 3, image: "/assets/kraken_iced.jpg", description: "Strong ice coffee, the best to drink before trying to engage the kraken" },
    { id: 12, name: "Dead Man's Drip", category: "Specialty Drinks", price: 3.2, image: "/assets/dead_mans_drip.jpg", description: "Intense espresso with a lingering bitter taste" },
    { id: 13, name: "Buccaneer's Brew", category: "Specialty Drinks", price: 7.5, image: "/assets/buccaneers_brew.jpg", description: "A daring mix of espresso, caramel, and sea salt" },
    { id: 14, name: "Jolly Roger Java", category: "Specialty Drinks", price: 6.9, image: "/assets/jolly_roger_java.jpg", description: "A pirate's favorite—espresso with a hint of rum flavor" },
    { id: 15, name: "Sea Witch's Latte", category: "Specialty Drinks", price: 8.2, image: "/assets/sea_witchs_latte.jpg", description: "Dark roast with a hint of vanilla and magic" },
    { id: 16, name: "Coconut Coffee", category: "Specialty Drinks", price: 7.8, image: "/assets/coconut_coffee.jpg", description: "A tropical coffee with a splash of coconut milk" },
    { id: 17, name: "Blackbeard's Blend", category: "Specialty Drinks", price: 9.0, image: "/assets/blackbeards_blend.jpg", description: "Bold and mysterious, just like the legend" },
    { id: 18, name: "Gold Rush Espresso", category: "Specialty Drinks", price: 8.5, image: "/assets/gold_rush_espresso.jpg", description: "A golden-hued coffee with a shot of honey" },

    // Cold Brews
    { id: 19, name: "Shiver Me Cold Brew", category: "Cold Brews", price: 21, image: "/assets/shiver_me_cold_brew.jpg", description: "Chilly bitter taste with a touch of milk" },
    { id: 20, name: "Frappuccino", category: "Cold Brews", price: 2, image: "/assets/frappuccino.jpg", description: "Chocolatey iced coffee" },
    { id: 21, name: "Ice Latte", category: "Cold Brews", price: 11, image: "/assets/ice_latte.jpg", description: "Perfect for any girlie who likes adventures <3" },
    { id: 22, name: "Vanilla Sweet Cold Brew", category: "Cold Brews", price: 6.5, image: "/assets/vanilla_cold_brew.jpg", description: "Smooth cold brew infused with vanilla syrup" },
    { id: 23, name: "Chocolate Hazelnut Cold Brew", category: "Cold Brews", price: 7.0, image: "/assets/chocolate_hazelnut_cold_brew.jpg", description: "Nutty, chocolatey, and ice cold" },
    { id: 24, name: "Salted Caramel Cold Brew", category: "Cold Brews", price: 6.8, image: "/assets/salted_caramel.jpg", description: "A perfect mix of coffee and caramel with a salty twist" },
    { id: 25, name: "Pirate's Coconut Cold Brew", category: "Cold Brews", price: 7.2, image: "/assets/coconut_cold_brew.jpg", description: "Coconut-flavored cold brew for a tropical twist" },
    { id: 26, name: "Dark Roast Nitro", category: "Cold Brews", price: 8.0, image: "/assets/nitro_brew.jpg", description: "A strong, smooth nitro-infused cold brew" },
    { id: 27, name: "Maple Bourbon Cold Brew", category: "Cold Brews", price: 9.5, image: "/assets/maple_bourbon.jpg", description: "Rich maple and bourbon flavor blended into cold brew" },

    // Teas
    { id: 28, name: "Under The Water Tea", category: "Teas", price: 7.7, image: "/assets/under_the_water_tea.jpg", description: "Soothing and calming, with a sense of danger" },
    { id: 29, name: "Mermaid's Chai", category: "Teas", price: 9.9, image: "/assets/mermaids_chai.webp", description: "It seems like its taste is calling to you" },
    { id: 30, name: "Stormy Earl Grey", category: "Teas", price: 8.5, image: "/assets/stormy_earl_grey.jpg", description: "A refreshing and warming adventure" },
    { id: 31, name: "Pirate's Green Tea", category: "Teas", price: 6.5, image: "/assets/pirates_green_tea.jpg", description: "Refreshing and packed with antioxidants" },
    { id: 32, name: "Spiced Rum Tea", category: "Teas", price: 7.0, image: "/assets/spiced_rum_tea.jpg", description: "Black tea with a hint of warm spices" },
    { id: 33, name: "Golden Turmeric Tea", category: "Teas", price: 7.2, image: "/assets/golden_turmeric.jpg", description: "A warm, soothing tea with turmeric and honey" },
    { id: 34, name: "Berry Treasure Tea", category: "Teas", price: 8.5, image: "/assets/berry_treasure.jpg", description: "A fruity tea blend packed with flavor" },
    { id: 35, name: "Captain’s Chamomile", category: "Teas", price: 6.8, image: "/assets/captains_chamomile.jpg", description: "A relaxing chamomile tea with a citrus hint" },
    { id: 36, name: "Minty Shipmate Tea", category: "Teas", price: 6.9, image: "/assets/minty.jpg", description: "A refreshing peppermint tea" },
    

];

module.exports = initialProducts;