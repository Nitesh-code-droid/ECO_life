// Local carbon footprint database - parsed from Carbon Catalogue
// This avoids API calls and provides instant, reliable results

export const carbonDatabase = {
  // Food & Beverage
  "frosted flakes": { co2e: 2.67, category: "Food & Beverage", unit: "kg", alternatives: ["oatmeal", "granola", "whole grain cereal"] },
  "cereal": { co2e: 2.5, category: "Food & Beverage", unit: "kg", alternatives: ["oatmeal", "granola", "whole grain cereal"] },
  "beef": { co2e: 27.0, category: "Food & Beverage", unit: "kg", alternatives: ["chicken", "tofu", "lentils", "plant-based protein"] },
  "chicken": { co2e: 6.9, category: "Food & Beverage", unit: "kg", alternatives: ["tofu", "lentils", "beans"] },
  "pork": { co2e: 12.1, category: "Food & Beverage", unit: "kg", alternatives: ["chicken", "tofu", "mushrooms"] },
  "lamb": { co2e: 39.2, category: "Food & Beverage", unit: "kg", alternatives: ["chicken", "plant-based protein"] },
  "cheese": { co2e: 13.5, category: "Food & Beverage", unit: "kg", alternatives: ["plant-based cheese", "nutritional yeast"] },
  "milk": { co2e: 1.9, category: "Food & Beverage", unit: "liter", alternatives: ["oat milk", "almond milk", "soy milk"] },
  "eggs": { co2e: 4.8, category: "Food & Beverage", unit: "kg", alternatives: ["tofu scramble", "chickpea flour"] },
  "rice": { co2e: 2.7, category: "Food & Beverage", unit: "kg", alternatives: ["quinoa", "barley", "bulgur"] },
  "bread": { co2e: 1.6, category: "Food & Beverage", unit: "kg", alternatives: ["sourdough", "whole grain bread"] },
  "pasta": { co2e: 1.4, category: "Food & Beverage", unit: "kg", alternatives: ["whole wheat pasta", "lentil pasta"] },
  "potato": { co2e: 0.3, category: "Food & Beverage", unit: "kg", alternatives: ["sweet potato", "local vegetables"] },
  "tomato": { co2e: 1.4, category: "Food & Beverage", unit: "kg", alternatives: ["local tomatoes", "seasonal vegetables"] },
  "apple": { co2e: 0.3, category: "Food & Beverage", unit: "kg", alternatives: ["local apples", "seasonal fruit"] },
  "banana": { co2e: 0.7, category: "Food & Beverage", unit: "kg", alternatives: ["local fruit", "seasonal fruit"] },
  "orange": { co2e: 0.4, category: "Food & Beverage", unit: "kg", alternatives: ["local citrus", "seasonal fruit"] },
  "coffee": { co2e: 16.5, category: "Food & Beverage", unit: "kg", alternatives: ["fair trade coffee", "local tea"] },
  "tea": { co2e: 6.3, category: "Food & Beverage", unit: "kg", alternatives: ["herbal tea", "local tea"] },
  "chocolate": { co2e: 18.7, category: "Food & Beverage", unit: "kg", alternatives: ["fair trade chocolate", "dark chocolate"] },
  "sugar": { co2e: 1.8, category: "Food & Beverage", unit: "kg", alternatives: ["honey", "maple syrup", "stevia"] },
  
  // Textiles & Apparel
  "jeans": { co2e: 15.0, category: "Textiles & Apparel", unit: "item", alternatives: ["secondhand jeans", "organic cotton jeans", "recycled denim"] },
  "t-shirt": { co2e: 7.0, category: "Textiles & Apparel", unit: "item", alternatives: ["organic cotton", "secondhand clothing"] },
  "cotton shirt": { co2e: 8.5, category: "Textiles & Apparel", unit: "item", alternatives: ["organic cotton", "hemp shirt", "bamboo fabric"] },
  "polyester jacket": { co2e: 12.0, category: "Textiles & Apparel", unit: "item", alternatives: ["recycled polyester", "wool jacket"] },
  "leather shoes": { co2e: 25.0, category: "Textiles & Apparel", unit: "pair", alternatives: ["vegan leather", "canvas shoes", "recycled materials"] },
  "sneakers": { co2e: 14.0, category: "Textiles & Apparel", unit: "pair", alternatives: ["recycled sneakers", "sustainable brands"] },
  
  // Electronics & IT
  "laptop": { co2e: 350.0, category: "Computer, IT & telecom", unit: "item", alternatives: ["refurbished laptop", "energy-efficient model"] },
  "smartphone": { co2e: 85.0, category: "Computer, IT & telecom", unit: "item", alternatives: ["refurbished phone", "keep current phone longer"] },
  "tablet": { co2e: 120.0, category: "Computer, IT & telecom", unit: "item", alternatives: ["refurbished tablet", "energy-efficient model"] },
  "monitor": { co2e: 250.0, category: "Computer, IT & telecom", unit: "item", alternatives: ["energy-efficient monitor", "refurbished"] },
  "printer": { co2e: 100.0, category: "Computer, IT & telecom", unit: "item", alternatives: ["digital documents", "eco-friendly printer"] },
  "laser printer": { co2e: 1500.0, category: "Computer, IT & telecom", unit: "item", alternatives: ["digital documents", "inkjet printer"] },
  
  // Materials & Construction
  "cement": { co2e: 1.1, category: "Construction materials", unit: "kg", alternatives: ["recycled concrete", "low-carbon cement"] },
  "concrete": { co2e: 0.9, category: "Construction materials", unit: "kg", alternatives: ["recycled concrete", "alternative materials"] },
  "steel": { co2e: 2.3, category: "Materials", unit: "kg", alternatives: ["recycled steel", "aluminum"] },
  "aluminum": { co2e: 8.2, category: "Materials", unit: "kg", alternatives: ["recycled aluminum"] },
  "plastic": { co2e: 6.0, category: "Materials", unit: "kg", alternatives: ["recycled plastic", "biodegradable alternatives"] },
  "glass": { co2e: 0.9, category: "Materials", unit: "kg", alternatives: ["recycled glass"] },
  "paper": { co2e: 1.3, category: "Materials", unit: "kg", alternatives: ["recycled paper", "digital documents"] },
  "cardboard": { co2e: 1.1, category: "Materials", unit: "kg", alternatives: ["recycled cardboard"] },
  
  // Transport & Energy
  "gasoline": { co2e: 2.3, category: "Energy", unit: "liter", alternatives: ["electric vehicle", "public transport", "bicycle"] },
  "diesel": { co2e: 2.7, category: "Energy", unit: "liter", alternatives: ["electric vehicle", "biodiesel", "public transport"] },
  "natural gas": { co2e: 2.0, category: "Energy", unit: "m3", alternatives: ["renewable energy", "heat pump"] },
  "electricity": { co2e: 0.5, category: "Energy", unit: "kWh", alternatives: ["renewable energy", "solar panels"] },
  "coal": { co2e: 2.4, category: "Energy", unit: "kg", alternatives: ["renewable energy", "natural gas"] },
  
  // Household items
  "plastic bottle": { co2e: 0.5, category: "Product", unit: "item", alternatives: ["reusable bottle", "glass bottle", "filtered tap water"] },
  "paper cup": { co2e: 0.1, category: "Product", unit: "item", alternatives: ["reusable cup", "ceramic mug"] },
  "plastic bag": { co2e: 0.04, category: "Product", unit: "item", alternatives: ["reusable bag", "canvas tote"] },
  "aluminum can": { co2e: 0.2, category: "Product", unit: "item", alternatives: ["glass bottle", "reusable container"] },
  "cardboard box": { co2e: 1.2, category: "Product", unit: "kg", alternatives: ["reusable container", "recycled cardboard"] },
};

// Fuzzy search function
export const searchCarbonFootprint = (searchTerm) => {
  const normalized = searchTerm.toLowerCase().trim();
  
  // 1. Direct exact match (highest priority)
  if (carbonDatabase[normalized]) {
    return {
      found: true,
      product: searchTerm,
      ...carbonDatabase[normalized],
      isEcoFriendly: carbonDatabase[normalized].co2e < 5
    };
  }
  
  // 2. Exact word match (e.g., "plastic" matches "plastic" not "plastic bottle")
  const exactWordMatch = Object.keys(carbonDatabase).find(key => key === normalized);
  if (exactWordMatch) {
    return {
      found: true,
      product: exactWordMatch,
      ...carbonDatabase[exactWordMatch],
      isEcoFriendly: carbonDatabase[exactWordMatch].co2e < 5
    };
  }
  
  // 3. Partial match - but prefer shorter keys (more specific)
  const partialMatches = Object.keys(carbonDatabase).filter(key => 
    key.includes(normalized) || normalized.includes(key)
  );
  
  if (partialMatches.length > 0) {
    // Sort by key length (shorter = more specific) and take the first
    const bestMatch = partialMatches.sort((a, b) => a.length - b.length)[0];
    
    return {
      found: true,
      product: bestMatch,
      ...carbonDatabase[bestMatch],
      isEcoFriendly: carbonDatabase[bestMatch].co2e < 5
    };
  }
  
  // 4. No match - check if it's actually a product name
  // If it looks like a person's name or random text, return a friendly message
  const looksLikeProduct = /\b(bottle|bag|car|phone|laptop|food|drink|plastic|paper|metal|wood|cloth|shirt|shoe|jean)\b/i.test(normalized);
  
  if (!looksLikeProduct) {
    return {
      found: false,
      product: searchTerm,
      co2e: 0,
      category: "Not a product",
      unit: "kg",
      isEcoFriendly: true,
      alternatives: ["Try searching for products like: beef, apple, laptop, jeans, plastic bottle"],
      message: `"${searchTerm}" doesn't appear to be a product. Try searching for items like food, electronics, or materials.`
    };
  }
  
  // Generic estimate for unknown products
  return {
    found: false,
    product: searchTerm,
    co2e: 5.0,
    category: "Unknown product",
    unit: "kg",
    isEcoFriendly: false,
    alternatives: ["Try a more specific search", "Check spelling"],
    message: "Product not found in database. Showing generic estimate for unknown products."
  };
};
