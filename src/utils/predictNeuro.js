import { W, NORM } from "../utils/weights.js";
import { ratioCapped } from "../utils/normalize.js";

// score one neurotransmitter by summing its weighted, normalized nutrients
function score(weights, nutrients) {
    let raw = 0;
    let max = 0;
    for (const [key, weight] of Object.entries(weights)) {
        const value = nutrients?.[key] ?? 0; // e.g., nutrients.tryptophan_mg
        const anchor = NORM[key] ?? 0; // e.g., NORM.tryptophan_mg
        raw += weight * ratioCapped(value, anchor);
        max += weight;
    }
    return max ? raw / max : 0; //normalize to 0..1
}

// public tool: turn nutrients into a neurotransmitter profile
export function predictNeurochemistry(nutrients) {
    return {
        serotonin: score(W.serotonin, nutrients),
        dopamine: score(W.dopamine, nutrients),
        gaba: score(W.gaba, nutrients),
        acetylcholine: score(W.acetylcholine, nutrients)
    };
}