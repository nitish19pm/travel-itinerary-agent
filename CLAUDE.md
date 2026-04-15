# ChaiNashta — India Travel Planner

## What This Is
ChaiNashta is an India-only AI travel planner that generates personalised, food-forward itineraries. The name means "chai + nashta" (tea + breakfast) — quintessentially Indian.

**Scope:** India destinations only. Every itinerary must emphasise regional Indian cuisines as the core experience, not an afterthought.

**Live URL:** https://travel-itinerary-agent.vercel.app

---

## Tech Stack
- **Backend:** Node.js + Express (ES modules, no TypeScript, no build step)
- **AI:** Groq SDK (`groq-sdk`) with model `llama3-groq-70b-8192-tool-use-preview` (tool-use fine-tuned)
- **Frontend:** Vanilla HTML/CSS/JS — no framework
- **Deployment:** Vercel (auto-deploys on push to GitHub `main`)
- **Env var required:** `GROQ_API_KEY`

---

## Agentic Pattern
The core agentic loop is in `server/agent.js`:
1. Send user preferences + tool definitions to Llama via Groq
2. Model calls tools autonomously (destination info → weather → budget)
3. Server executes tools, returns results to model
4. Model synthesises a structured JSON itinerary
5. Frontend renders the JSON

---

## File Responsibilities
- `server/agent.js` — **THE core file**: the agent loop with tool dispatch
- `server/tools.js` — tool schemas (sent to model) + simulated implementations for 6 Indian cities
- `server/prompts.js` — system prompt (India + cuisine focus), user prompt builder, output schema
- `server/index.js` — Express server, `/api/itinerary` POST endpoint
- `public/index.html` — single-page app with main form + edit panel for replanning
- `public/app.js` — form handling, fetch, replan logic, itinerary rendering
- `public/style.css` — saffron-themed UI styling

---

## Supported Cities (hardcoded tool data)
Delhi, Mumbai, Jaipur, Varanasi, Goa, Bangalore
All other Indian cities use a sensible India-specific fallback.

---

## Key Conventions
- ES modules throughout (`import`/`export`) — `"type": "module"` in package.json
- No TypeScript — plain `.js` files
- No build step — `node server/index.js` runs directly
- Dev: `npm run dev` (uses `node --watch`)
- Currency shown in USD with INR equivalent notes

---

## Cuisine Emphasis Rule
The system prompt mandates at least 2 dedicated food experiences per day, each with:
- A specific named regional dish
- A specific named place to eat it
- Why it is unique to that city/region
This is non-negotiable — it is the product's differentiator.
