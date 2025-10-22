// user text ("matcha latte")
//  ->
// searchTopProduct()  - ask OpenFoodFacts (OFF) for best matching product
//  ->
// extractNutrientsPerServing()  - grab fields, scale per 100g -> per serving, add fallbacks 
//  ->
// return { product_name, serving_estimate_g, nutrients {...} }


import axios from "axios";

const SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";

// Search OpenFoodFacts for the text query (e.g., "matcha latte") and return the best matching product.
async function searchTopProduct(query) {
    const { data } = await axios.get(SEARCH_URL, {
        params: {
            search_terms: query,
            search_simple: 1,
            action: "process",
            json: 1,
            page_size: 1 //gives the best single match (fast)
        }
    });

    if (!data || !Array.isArray(data.products) || data.products.length === 0) {
        throw new Error("No product found for that query");
    }
    return data.products[0]; // best guess
}


// OFF often stores nutrients per 100g, not per serving, but I want per-serving values
// if OFF provides a serving quantity (e.g., 250g), that will be used
// otherwise, beverages = ~240g (aka 8fl oz) and everything else = ~100g

// Choose a serving size in grams:
// - use 'OFF's "serving_quantity" and "serving_size" if present
// - else: beverages default to 240g (= 8 fl oz), other foods default to 100g
function estimateServingGrams(prod) {
    const n = prod || {};
    // OFF can expose "serving_quantity" (numeric) and "serving_size" (string)
    if (typeof n.serving_quantity === "number" && n.serving_quantity > 0) {
        return n.serving_quantity;
    }
    // sometimes serving_quantity is missing but serving_size is like "240 ml" (I can parse the number)
    if (typeof n.serving_size === "string") {
        const m = n.serving_size.match(/([\d.]+)/);
        if (m) return parseFloat(m[1]);
    }
    const name = `${n.product_name || ""} ${n.categories || ""}`.toLowerCase();
    const isBeverage = /drink|beverage|tea|coffee|latte|milk|juice/.test(name);
    return isBeverage ? 240 : 100;
}

// OFF fields are inconsistent (sometimes a nutrient appears as "magnesium_100g", sometimes as "magnesium")
// This helper looks for key or key_100g and returns a number or undefined
function getN(nutriments, key) {
    if (!nutriments) return undefined;
    const k = key in nutriments ? key : `${key}_100g`;
    const v = nutriments[k];
    return typeof v === "number" ? v : undefined;
  }


// OFF doesn't really list theanine,
// but matcha/green tea has some! and it impacts happiness! so...
// so we add an estimated 25 mg per serving when "green tea" or "matcha" appear
function inferTheanineFromName(name) {
    const s = (name || "").toLowerCase();
    return (s.includes("matcha") || s.includes("green tea")) ? 25 : 0; //mg guess per serving
}

// OFF almost never has amino acids like tryptophan/tyrosine. 
// but these are important for the model (they impact mood!),
// so a rough proxy is used:
// - tryptophan = 12 mg / g protein (very rough)
// - tyrosine = 40 mg / g protein (very rough)
// if OFF does give real values, the "??"" keeps them from being overwritten 
function aminoFallbacksFromProtein(protein_g, current = {}) {
    const trp = current.tryptophan_mg ?? (protein_g > 0 ? protein_g * 12 : 0);
    const tyr = current.tyrosine_mg ?? (protein_g > 0 ? protein_g * 40 : 0);
    return { ...current, tryptophan_mg: trp, tyrosine_mg: tyr };
}

// OFF mostly stores nutrients per 100g, this scales them to per serving using factor = serving_g / 100
// This builds a clean nutrients object scaled to a single serving.
// theanine_mg heuristic and amino fallbacks added so the downstream math always has reasonable inputs
function extractNutrientsPerServing(product) {
    const nutr = product.nutriments || {};
    const serving_g = estimateServingGrams(product);

    // per-100g => per-serving factor
    const factor = serving_g / 100;

    // OFF commonly present:
    const energy_kcal_100g = getN(nutr, "energy-kcal_100g"); // sometimes only "energy-kcal_100g"
    const proteins_100g    = getN(nutr, "proteins_100g");
    const fat_100g         = getN(nutr, "fat_100g");  
    const carbs_100g       = getN(nutr, "carbohydrates_100g");
    const magnesium_100g   = getN(nutr, "magnesium_100g");     // often missing
    const vitc_100g        = getN(nutr, "vitamin-c_100g");     // often missing
    const vitb6_100g       = getN(nutr, "vitamin-b6_100g");    // rare
    const choline_100g     = getN(nutr, "choline_100g");       // very rare
    const caffeine_100g    = getN(nutr, "caffeine_100g");      // occasionally present

    // Omega-3: sometimes exposed as ALA/EPA/DHA
    const ala_100g         = getN(nutr, "ala_100g");           // alpha-linolenic acid
    const epa_100g         = getN(nutr, "epa_100g");
    const dha_100g         = getN(nutr, "dha_100g");
    const omega3_100g      = [ala_100g, epa_100g, dha_100g]
        .filter((x) => typeof x === "number")
        .reduce((a, b) => a + b, 0);

    // Scale per 100g to per serving:
    const protein_g  = (proteins_100g ?? 0) * factor;
    const fat_g      = (fat_100g ?? 0) * factor;
    const carbs_g    = (carbs_100g ?? 0) * factor;
    const calories   = (energy_kcal_100g ?? 0) * factor;

    const magnesium_mg  = (magnesium_100g ?? 0) * factor;
    const vitaminC_mg   = (vitc_100g ?? 0) * factor;
    const vitaminB6_mg  = (vitb6_100g ?? 0) * factor;
    const choline_mg    = (choline_100g ?? 0) * factor;
    const omega3_mg     = (omega3_100g ?? 0) * factor * 1000; // g → mg
    const caffeine_mg   = (caffeine_100g ?? 0) * factor;

    // Heuristic: add theanine if matcha/green tea detected
    const theanine_mg   = inferTheanineFromName(product.product_name);

    // Add amino fallbacks from protein grams
    const withAmino = aminoFallbacksFromProtein(protein_g, {
    magnesium_mg, vitaminC_mg, vitaminB6_mg, choline_mg, omega3_mg, theanine_mg,
    protein_g, calories, fat_g, carbs_g, caffeine_mg
    });

    return withAmino;
}

// analyzeMeal orchestrates the above steps and returns a clean payload for my route
// this includes metadata (product name, brand, serving estimate) and the computed nutrients
// the /tools/analyze_meal route calls this function and returns the result as JSON
// In summation: it's a public tool that analyzes a free-text meal via OFF, returning nutrient estimates per serving.
export async function analyzeMeal(query) {
    const product = await searchTopProduct(query);
    // console.log("RAW product", JSON.stringify(product, null, 2));
    const nutrients = extractNutrientsPerServing(product);
    // console.log("NUTRIENTS", nutrients)
  
    return {
      product_name: product.product_name || query,
      brand: product.brands || undefined,
      serving_estimate_g: estimateServingGrams(product),
      nutrients
    };
  }

// Edge cases:
// If nothing is found -> throws an error -> my route returns { ok:false, error: "No product found..."}
// If missing fields -> getN returns undefined, and my code falls back to 0 or estimates.
// If serving size absent -> it uses 240g for beverages, 100g otherwise