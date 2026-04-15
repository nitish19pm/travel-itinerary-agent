// =============================================================================
// prompts.js — System prompt, user prompt builder, and output schema
//
// LEARNING NOTE:
// Prompt engineering is how you "program" an AI agent's behavior.
// The system prompt sets Claude's role, process, and output format.
// The user prompt converts form data into natural language Claude reasons about.
// The JSON schema tells Claude exactly what structure to return.
// =============================================================================

// -----------------------------------------------------------------------------
// Output schema — the exact JSON structure Claude must return
// Defining this explicitly ensures machine-parseable, renderable output
// -----------------------------------------------------------------------------
export const ITINERARY_SCHEMA = {
  destination: "string — full destination name",
  summary: "string — 2-3 sentence overview of the trip",
  highlights: ["array of 3-5 top highlights for this specific trip"],
  weather_advisory: "string — what weather to expect and how it affects plans",
  budget_summary: {
    total_budget: "number — USD",
    estimated_trip_cost: "number — USD",
    daily_average: "number — USD",
    breakdown: {
      accommodation: "number — USD per day",
      food: "number — USD per day",
      transport: "number — USD per day",
      activities: "number — USD per day",
    },
    notes: "string — budget tips specific to this trip",
  },
  days: [
    {
      day: "number — day number (1, 2, 3...)",
      date: "string — formatted date e.g. 'Monday, March 15'",
      theme: "string — short evocative theme for the day",
      morning: {
        activity: "string — what to do",
        location: "string — specific place name",
        duration: "string — e.g. '2 hours'",
        cost: "string — e.g. 'Free' or '$15'",
        notes: "string — practical tip or context",
      },
      afternoon: {
        activity: "string",
        location: "string",
        duration: "string",
        cost: "string",
        notes: "string",
      },
      evening: {
        activity: "string",
        location: "string",
        duration: "string",
        cost: "string",
        notes: "string",
      },
      daily_tips: ["array of 2-3 practical tips specific to this day"],
      estimated_daily_cost: "number — USD",
    },
  ],
  packing_suggestions: ["array of 8-12 specific packing items for this trip"],
  booking_priorities: ["array of 4-6 things to book in advance with brief reason why"],
  local_phrases: [
    {
      phrase: "string — local language phrase",
      pronunciation: "string — phonetic guide",
      meaning: "string — what it means",
    },
  ],
};

// -----------------------------------------------------------------------------
// System prompt — instructs the model on its role, process, and output format
//
// LEARNING NOTE:
// The system prompt is the most powerful lever in agentic AI.
// Notice how it:
//   1. Assigns a clear expert role
//   2. Specifies a mandatory tool-use sequence (prompt-based orchestration)
//   3. Sets output format constraints (JSON only, no markdown)
//   4. Injects the schema so the model knows exactly what to produce
// -----------------------------------------------------------------------------
// System prompt used during the tool-calling phase (kept short so Llama stays focused)
export const SYSTEM_PROMPT = `You are ChaiNashta, an expert India travel planner specialising in regional cuisines.

Use the available tools to research the destination before writing the itinerary. Call all three tools:
1. get_destination_info — research the destination
2. get_weather_forecast — check weather for the travel dates
3. calculate_budget_breakdown — plan realistic spending

Do NOT write the itinerary until you have called all three tools and received their results.`;

// System prompt used for the final JSON generation step (no tools, full schema)
export const SYNTHESIS_PROMPT = `You are ChaiNashta, an expert India travel planner specialising in regional cuisines.

Using the research data provided, write a detailed day-by-day India travel itinerary.

CUISINE RULES — every day must include at least 2 food experiences with:
- A specific named regional dish (not generic "Indian food")
- A specific named place to eat it
- Why it is unique to this city/region

Return ONLY a valid JSON object matching this schema exactly:
${JSON.stringify(ITINERARY_SCHEMA, null, 2)}

Rules: strings must be strings, numbers must be numbers, days array must have an entry for every day, do not include schema descriptions — use real values.`;

// -----------------------------------------------------------------------------
// User prompt builder — converts form data to natural language
//
// LEARNING NOTE:
// Converting structured form data into natural language is a key pattern.
// Claude reasons better about "a couple celebrating their anniversary"
// than about raw JSON fields. This translation is part of prompt engineering.
// -----------------------------------------------------------------------------
export function buildUserPrompt(preferences) {
  const {
    destination,
    departureDate,
    returnDate,
    travelers,
    totalBudget,
    budgetStyle,
    interests,
    groupType,
    specialRequirements,
  } = preferences;

  // Calculate trip duration
  const start = new Date(departureDate);
  const end = new Date(returnDate);
  const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  // Build interests string
  const interestsList = interests && interests.length > 0
    ? interests.join(", ")
    : "general sightseeing";

  // Build group description
  const groupDescriptions = {
    solo: "solo traveler",
    couple: "couple",
    family: "family with children",
    group: "group of friends",
  };
  const groupDesc = groupDescriptions[groupType] || groupType || "traveler";

  // Format dates nicely
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  let prompt = `Please create a personalized travel itinerary for the following trip:

**Destination:** ${destination}
**Travel Dates:** ${formatDate(departureDate)} to ${formatDate(returnDate)} (${durationDays} days)
**Travelers:** ${travelers} ${groupDesc}
**Total Budget:** $${totalBudget} USD
**Budget Style:** ${budgetStyle}
**Main Interests:** ${interestsList}`;

  if (specialRequirements && specialRequirements.trim()) {
    prompt += `\n**Special Requirements:** ${specialRequirements}`;
  }

  prompt += `

Please use your tools to research ${destination}, check the weather for ${departureDate} to ${returnDate}, and calculate the budget breakdown before creating the itinerary.

Create a day-by-day itinerary that reflects the traveler's interests in ${interestsList}, respects the ${budgetStyle} budget tier, and makes the most of ${durationDays} days in ${destination}.

Place special emphasis on local and regional Indian cuisine experiences — name specific dishes, specific places to eat them, and explain what makes each food experience unique to this destination.`;


  return prompt;
}
