// =============================================================================
// index.js — Express server (Vercel-compatible, simple POST/JSON)
//
// LEARNING NOTE:
// Vercel serverless functions have a max execution time and don't support
// long-lived SSE connections well. So we use a simple request/response pattern:
//   1. Client POSTs preferences
//   2. Server runs the full agent loop (tool calls, reasoning)
//   3. Server returns the completed itinerary as JSON in one response
//
// The agent loop in agent.js is unchanged — only the transport layer differs.
// =============================================================================

import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { runTravelAgent } from "./agent.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, "../public")));

// -----------------------------------------------------------------------------
// POST /api/itinerary — runs the agent and returns the itinerary as JSON
// -----------------------------------------------------------------------------
app.post("/api/itinerary", async (req, res) => {
  const preferences = req.body;

  if (!preferences.destination || !preferences.departureDate || !preferences.returnDate) {
    return res.status(400).json({
      error: "Missing required fields: destination, departureDate, returnDate",
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY not configured. Add it to your environment variables.",
    });
  }

  try {
    // Collect progress steps server-side (logged to console, not streamed)
    const steps = [];
    const itinerary = await runTravelAgent(preferences, (progress) => {
      console.log(`[agent] ${progress.message}`);
      steps.push(progress.message);
    });

    res.json({ itinerary, steps });
  } catch (error) {
    console.error("Agent error:", error);
    res.status(500).json({
      error: error.message || "An unexpected error occurred",
    });
  }
});

// -----------------------------------------------------------------------------
// GET /api/health — health check
// -----------------------------------------------------------------------------
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (_req, res) => {
  res.sendFile(join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`\n🌍 Travel Itinerary Agent running at http://localhost:${PORT}`);
  console.log(`   Gemini API Key: ${process.env.GEMINI_API_KEY ? "✓ configured" : "✗ MISSING"}`);
  console.log(`\n   Open your browser to http://localhost:${PORT}\n`);
});

export default app;
