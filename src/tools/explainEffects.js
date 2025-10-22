// Summarize neurotransmitter profile into friendly text
export function explainEffects(profile) {
  if (!profile) return "No data available.";

  const { serotonin, dopamine, gaba, acetylcholine } = profile;

  // Calculate the maximum score to determine if there are any meaningful effects
  const maxScore = Math.max(serotonin, dopamine, gaba, acetylcholine);

  // If all scores are very low (less than 10%), indicate minimal effects
  if (maxScore < 0.1) {
    return (
      "This meal has minimal mood-boosting effects based on its nutritional profile.\n\n" +
      "Breakdown:\n" +
      `• Serotonin: ${Math.round(serotonin * 100)}%\n` +
      `• Dopamine: ${Math.round(dopamine * 100)}%\n` +
      `• GABA: ${Math.round(gaba * 100)}%\n` +
      `• Acetylcholine: ${Math.round(acetylcholine * 100)}%\n\n` +
      "💡 Consider foods rich in tryptophan, tyrosine, magnesium, or theanine for better mood support."
    );
  }

  // Find the dominant neurotransmitter
  const main = Object.entries(profile).sort((a, b) => b[1] - a[1])[0][0];

  let summary = "";

  if (main === "serotonin")
    summary = "This meal may help with calm happiness and mood balance.";
  else if (main === "dopamine")
    summary = "This meal may support motivation and focus.";
  else if (main === "gaba")
    summary = "This meal may promote relaxation and reduced stress.";
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
