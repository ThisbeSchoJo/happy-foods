// load Express (server framework) and environment variables from .env
import express from "express";
import "dotenv/config";
import { analyzeMeal } from "./tools/analyzeMeal.js";
import { predictNeurochemistry } from "./tools/predictNeuro.js";

const app = express(); // creates my server instance
app.use(express.json()); // lets Express automatically parse incoming JSON (so I can send data via POST)

// --- Health check route ---
// /health route is a quick "is this running?" endpoint - always returns { ok: true }
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "happy-foods" });
});

// --- Placeholder tool endpoint (I’ll replace this soon) ---
// /tools/analyze meal route is a placeholder route - it just echoes a test response for now
app.post("/tools/analyze_meal", async (req, res) => {
    try {
        const { query } = req.body || {};
        if (!query) return res.status(400).json({ ok:false, error:"Missing 'query'" });

        const result = await analyzeMeal(query);
        res.json({ ok: true, source: "openfoodfacts", ...result });
    } catch (e) {
        res.status(500).json({ ok:false, error: e.message })
    }
  });

app.post("/tools/predict_neurochemistry", (req, res) => {
    try {
        const { nutrients } = req.body || {};
        if (!nutrients) {
            return res.status(400).json({ ok: false, error: "Missing 'nutrients' object"})
        }
        const profile = predictNeurochemistry(nutrients);
        res.json({ ok: true, profile });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// --- Start the server ---
const port = process.env.PORT || 3000;
// app.listen(...) starts my server so it listens on port 3000
app.listen(port, () => {
  console.log(`Server running: http://localhost:${port}`);
});
