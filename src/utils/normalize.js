// Keep numbers safely between 0 and 1
export const clamp01 = (x) => Math.max(0, Math.min(1,x));

// ratioCapped() takes a nutrient amount (e.g., 120 mg tryptophan) and
// divides it by a "normal" amount (from my NORM object).
// This gives me a relative value like 0.3 = 30% of the typical daily anchor
export const ratioCapped = (value, anchor) => {
    if (!anchor || anchor <= 0) return 0;
    return clamp01(value / anchor);
};