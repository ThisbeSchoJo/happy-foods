// Summarize neurotransmitter profile into friendly text
export function explainEffects(profile) {
    if (!profile) return "No data available.";

    const { serotonin, dopamine, gaba, acetylcholine } = profile;
    const main = Object.entries(profile)
        .sort((a, b) => b[1] - a[1])[0][0]; //pick the strongest
    
    let summary = "";

    if (main === "serotonin")
        summary = "This meal may help with calm happiness and mood balance.";
    else if (main === "dopamine")
        summary = "This meal may support motivation and focus.";
    else if (main === "gaba")
        summary = "this meal may promote relaxation and reduced stress.";
    else if (main === "acetylcholine")
        summary = "This meal may aid memory and mental clarity.";

    const percent = (x) => Math.round(x * 100);

    return (
        summary +
        `\n\nBreakdown:` +
        `\n• Serotonin: ${percent(serotonin)}%` +
        `\n• Dopamine: ${percent(dopamine)}%` +
        `\n• GABA: ${percent(gaba)}%` +
        `\n• Acetylcholine: ${percent(acetylcholine)}%`
    );
}