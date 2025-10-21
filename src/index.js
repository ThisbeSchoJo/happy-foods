// =============================================================================
// HAPPY-FOODS: MCP-Compatible Nutrition-to-Mood Analysis Server
// =============================================================================
// This server analyzes how foods affect your mood by:
// 1. Looking up nutritional data from OpenFoodFacts
// 2. Predicting neurotransmitter effects (serotonin, dopamine, GABA, acetylcholine)
// 3. Explaining the mood effects in human-friendly text
//
// It implements BOTH REST API and MCP (Model Context Protocol) patterns:
// - REST: Traditional endpoints like /tools/analyze_meal
// - MCP: AI-discoverable tools via /tools (discovery) and /tools/call (execution)
// =============================================================================

// Import Express (web server framework) and environment variables
import express from "express";
import "dotenv/config";

// Import our core business logic functions
import { analyzeMeal } from "./tools/analyzeMeal.js"; // Searches OpenFoodFacts & extracts nutrients
import { predictNeurochemistry } from "./tools/predictNeuro.js"; // Converts nutrients to neurotransmitter scores
import { explainEffects } from "./tools/explainEffects.js"; // Converts scores to human-friendly explanations

// Create Express server instance
const app = express();
// Enable automatic JSON parsing for incoming requests
app.use(express.json());

// =============================================================================
// BASIC SERVER ENDPOINTS
// =============================================================================

// Health check endpoint - simple way to verify the server is running
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "happy-foods" });
});

// =============================================================================
// MCP (MODEL CONTEXT PROTOCOL) COMPATIBLE ENDPOINTS
// =============================================================================
// These endpoints follow MCP patterns that AI models can discover and use:
// 1. /tools - Lists all available tools with their schemas (tool discovery)
// 2. /tools/call - Executes any tool by name with arguments (tool execution)

// --- MCP Tool Discovery Endpoint ---
// GET /tools returns a list of all available tools with their input schemas
// This is how AI models discover what tools are available and how to use them
// Format follows MCP specification for tool descriptions
app.get("/tools", (_req, res) => {
  res.json({
    tools: [
      // Tool 1: Analyze a food item and extract nutritional data
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
          required: ["query"], // query is mandatory
        },
      },
      // Tool 2: Predict how nutrients affect neurotransmitters
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
          required: ["nutrients"], // nutrients object is mandatory
        },
      },
      // Tool 3: Convert neurotransmitter scores to human-friendly explanations
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
          required: ["profile"], // profile object is mandatory
        },
      },
    ],
  });
});

// =============================================================================
// TRADITIONAL REST API ENDPOINTS
// =============================================================================
// These are the original REST-style endpoints for backward compatibility
// Each tool has its own dedicated endpoint following REST conventions

// --- REST Endpoint 1: Analyze Meal ---
// POST /tools/analyze_meal - Traditional REST endpoint for meal analysis
// Input: { "query": "matcha latte" }
// Output: { "ok": true, "product_name": "...", "nutrients": {...} }
app.post("/tools/analyze_meal", async (req, res) => {
  try {
    // Extract the query from the request body
    const { query } = req.body || {};
    if (!query)
      return res.status(400).json({ ok: false, error: "Missing 'query'" });

    // Call our business logic function (searches OpenFoodFacts & extracts nutrients)
    const result = await analyzeMeal(query);

    // Return the result in REST format
    res.json({ ok: true, source: "openfoodfacts", ...result });
  } catch (e) {
    // Handle any errors from the business logic
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- REST Endpoint 2: Predict Neurochemistry ---
// POST /tools/predict_neurochemistry - Traditional REST endpoint for neurochemistry prediction
// Input: { "nutrients": {...} }
// Output: { "ok": true, "profile": {"serotonin": 0.8, "dopamine": 0.6, ...} }
app.post("/tools/predict_neurochemistry", (req, res) => {
  try {
    // Extract nutrients data from the request body
    const { nutrients } = req.body || {};
    if (!nutrients) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing 'nutrients' object" });
    }

    // Call our business logic function (converts nutrients to neurotransmitter scores)
    const profile = predictNeurochemistry(nutrients);

    // Return the result in REST format
    res.json({ ok: true, profile });
  } catch (e) {
    // Handle any errors from the business logic
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- REST Endpoint 3: Explain Effects ---
// POST /tools/explain_effects - Traditional REST endpoint for effect explanations
// Input: { "profile": {"serotonin": 0.8, "dopamine": 0.6, ...} }
// Output: { "ok": true, "explanation": "This meal may promote relaxation..." }
app.post("/tools/explain_effects", (req, res) => {
  try {
    // Extract the neurotransmitter profile from the request body
    const { profile } = req.body || {};
    if (!profile)
      return res
        .status(400)
        .json({ ok: false, error: "Missing 'profile' object" });

    // Call our business logic function (converts scores to human-friendly text)
    const text = explainEffects(profile);

    // Return the result in REST format
    res.json({ ok: true, explanation: text });
  } catch (e) {
    // Handle any errors from the business logic
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// =============================================================================
// MCP-STYLE TOOL EXECUTION ENDPOINT
// =============================================================================
// This endpoint implements the MCP (Model Context Protocol) pattern for AI model integration
// Instead of separate endpoints for each tool, this provides a unified interface:
// Input: { "name": "tool_name", "arguments": {...} }
// Output: { "ok": true, "tool": "tool_name", "result": {...} }

// --- MCP Tool Execution Endpoint ---
// POST /tools/call - Unified MCP-style endpoint for all tool execution
// This is how AI models call tools after discovering them via /tools endpoint
app.post("/tools/call", async (req, res) => {
  try {
    // Extract the tool name and arguments from the MCP-style request
    // MCP format: { "name": "tool_name", "arguments": {...} }
    const { name, arguments: args } = req.body || {};

    // Route to the appropriate tool based on the 'name' field
    // This demonstrates the MCP pattern of unified tool execution

    // Tool 1: Explain Effects (converts neurotransmitter scores to human text)
    if (name === "explain_effects") {
      if (!args?.profile) {
        return res.status(400).json({
          ok: false,
          error: "Missing 'profile' argument",
        });
      }
      // Call our business logic function
      const explanation = explainEffects(args.profile);
      // Return in MCP format with tool name and result
      return res.json({
        ok: true,
        tool: "explain_effects",
        result: { explanation },
      });
    }

    // Tool 2: Predict Neurochemistry (converts nutrients to neurotransmitter scores)
    if (name === "predict_neurochemistry") {
      if (!args?.nutrients) {
        return res.status(400).json({
          ok: false,
          error: "Missing 'nutrients' argument",
        });
      }
      // Call our business logic function
      const profile = predictNeurochemistry(args.nutrients);
      // Return in MCP format with tool name and result
      return res.json({
        ok: true,
        tool: "predict_neurochemistry",
        result: { profile },
      });
    }

    // Tool 3: Analyze Meal (searches OpenFoodFacts and extracts nutrients)
    if (name === "analyze_meal") {
      if (!args?.query) {
        return res.status(400).json({
          ok: false,
          error: "Missing 'query' argument",
        });
      }
      // Call our business logic function (this one is async)
      const result = await analyzeMeal(args.query);
      // Return in MCP format with tool name and structured result
      return res.json({
        ok: true,
        tool: "analyze_meal",
        result: {
          product_name: result.product_name,
          brand: result.brand,
          serving_estimate_g: result.serving_estimate_g,
          nutrients: result.nutrients,
        },
      });
    }

    // Handle unknown tools - provide helpful error message
    return res.status(400).json({
      ok: false,
      error: `Unknown tool: '${name}'. Available tools: analyze_meal, predict_neurochemistry, explain_effects`,
    });
  } catch (e) {
    // Handle any errors from the business logic functions
    console.error("MCP-style tool execution error:", e);
    res.status(500).json({
      ok: false,
      error: e.message,
    });
  }
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(
    `Happy Foods MCP-Compatible Server running: http://localhost:${port}`
  );
  console.log(`Available endpoints:`);
  console.log(`  GET  /health                    - Health check`);
  console.log(`  GET  /tools                     - MCP tool discovery`);
  console.log(`  POST /tools/call                - MCP tool execution`);
  console.log(`  POST /tools/analyze_meal        - REST: Analyze meal`);
  console.log(
    `  POST /tools/predict_neurochemistry - REST: Predict neurochemistry`
  );
  console.log(`  POST /tools/explain_effects     - REST: Explain effects`);
});
