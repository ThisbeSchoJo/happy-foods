// load Express (server framework) and environment variables from .env
import express from "express";
import "dotenv/config";

const app = express(); // creates my server instance
app.use(express.json()); // lets Express automatically parse incoming JSON (so I can send data via POST)

// --- Health check route ---
// /health route is a quick "is this running?" endpoint - always returns { ok: true }
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "happy-foods" });
});

// --- Placeholder tool endpoint (I’ll replace this soon) ---
// /tools/analyze meal route is a placeholder route - it just echoes a test response for now
app.post("/tools/analyze_meal", (req, res) => {
  const { query } = req.body || {};

  if (!query) {
    return res.status(400).json({ ok: false, error: "Missing 'query'" });
  }

  // For now, just send back a dummy response
  return res.json({
    ok: true,
    nutrients: { example: true },
    note: "Stub endpoint – will connect to Edamam later"
  });
});

// --- Start the server ---
const port = process.env.PORT || 3000;
// app.listen(...) starts my server so it listens on port 3000
app.listen(port, () => {
  console.log(`Server running: http://localhost:${port}`);
});
