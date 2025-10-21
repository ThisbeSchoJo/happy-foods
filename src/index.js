// load Express (server framework) and environment variables from .env
import express from "express";
import "dotenv/config";
import { analyzeMeal } from "./tools/analyzeMeal.js";
import { predictNeurochemistry } from "./tools/predictNeuro.js";
import { explainEffects } from "./tools/explainEffects.js";

const app = express(); // creates my server instance
app.use(express.json()); // lets Express automatically parse incoming JSON (so I can send data via POST)

// --- Health check route ---
// /health route is a quick "is this running?" endpoint - always returns { ok: true }
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "happy-foods" });
});

// --- MCP-compatible tools discovery endpoint ---
// /tools endpoint lists all available tools with their schemas (like MCP)
app.get("/tools", (_req, res) => {
  res.json({
    tools: [
      {
        name: "analyze_meal",
        description:
          "Analyze a meal and extract nutritional data from OpenFoodFacts",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "Food item to analyze (e.g., 'matcha latte', 'chicken salad')",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "predict_neurochemistry",
        description:
          "Predict neurotransmitter effects based on nutritional data",
        inputSchema: {
          type: "object",
          properties: {
            nutrients: {
              type: "object",
              description: "Nutritional data object with various nutrients",
            },
          },
          required: ["nutrients"],
        },
      },
      {
        name: "explain_effects",
        description: "Explain neurotransmitter effects in human-friendly text",
        inputSchema: {
          type: "object",
          properties: {
            profile: {
              type: "object",
              description:
                "Neurotransmitter profile with serotonin, dopamine, gaba, acetylcholine scores",
            },
          },
          required: ["profile"],
        },
      },
    ],
  });
});

// --- Placeholder tool endpoint (I'll replace this soon) ---
// /tools/analyze meal route is a placeholder route - it just echoes a test response for now
app.post("/tools/analyze_meal", async (req, res) => {
  try {
    const { query } = req.body || {};
    if (!query)
      return res.status(400).json({ ok: false, error: "Missing 'query'" });

    const result = await analyzeMeal(query);
    res.json({ ok: true, source: "openfoodfacts", ...result });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/tools/predict_neurochemistry", (req, res) => {
  try {
    const { nutrients } = req.body || {};
    if (!nutrients) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing 'nutrients' object" });
    }
    const profile = predictNeurochemistry(nutrients);
    res.json({ ok: true, profile });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/tools/explain_effects", (req, res) => {
  try {
    const { profile } = req.body || {};
    if (!profile)
      return res
        .status(400)
        .json({ ok: false, error: "Missing 'profile' object" });

    const text = explainEffects(profile);
    res.json({ ok: true, explanation: text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- MCP-style tool call endpoint (just for explain_effects) ---
// This demonstrates the MCP pattern without changing existing endpoints
app.post("/tools/call", (req, res) => {
  try {
    const { name, arguments: args } = req.body || {};

    if (name === "explain_effects") {
      if (!args?.profile) {
        return res.status(400).json({
          ok: false,
          error: "Missing 'profile' argument",
        });
      }
      const explanation = explainEffects(args.profile);
      return res.json({
        ok: true,
        tool: "explain_effects",
        result: { explanation },
      });
    }

    if (name === "predict_neurochemistry") {
      if (!args?.nutrients) {
        return res.status(400).json({
          ok: false,
          error: "Missing 'nutrients' argument",
        });
      }
      const profile = predictNeurochemistry(args.nutrients);
      return res.json({
        ok: true,
        tool: "predict_neurochemistry",
        result: { profile },
      });
    }

    // For now, only explain_effects and predict_neurochemistry are supported via MCP style
    return res.status(400).json({
      ok: false,
      error: `Tool '${name}' not supported via MCP-style endpoint yet. Try /tools/${name}`,
    });
  } catch (e) {
    console.error("MCP-style tool execution error:", e);
    res.status(500).json({
      ok: false,
      error: e.message,
    });
  }
});

// --- Start the server ---
const port = process.env.PORT || 3000;
// app.listen(...) starts my server so it listens on port 3000
app.listen(port, () => {
  console.log(`Server running: http://localhost:${port}`);
});
