export const NORM = {
    //meal-scale anchors so values land in ~0..1 after dividing
    tryptophan_mg: 400,
    tyrosine_mg: 1500,
    magnesium_mg: 300,
    omega3_mg: 1000,
    protein_g: 40,
    vitaminB6_mg: 1.3,
    vitaminC_mg: 90,
    choline_mg: 425,
    theanine_mg: 50
}

export const W = {
    // weights per neurotransmitter (tweak later)
    serotonin:     { tryptophan_mg: 0.8, vitaminB6_mg: 0.3, omega3_mg: 0.2, magnesium_mg: 0.2, vitaminC_mg: 0.1 },
    dopamine:      { tyrosine_mg:   0.8, protein_g:   0.3, vitaminB6_mg: 0.2, magnesium_mg: 0.1 },
    gaba:          { magnesium_mg:  0.6, theanine_mg: 0.6 },
    acetylcholine: { choline_mg:    1.0 }
};