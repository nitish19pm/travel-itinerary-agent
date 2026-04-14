// =============================================================================
// tools.js — Tool definitions and simulated implementations
//
// LEARNING NOTE:
// Tools have two parts:
//   1. The SCHEMA (sent to Gemini) — tells the model what tools exist and their params
//   2. The IMPLEMENTATION (runs on server) — executes when Gemini calls a tool
//
// Gemini uses "functionDeclarations" format (different from Anthropic's format).
// In production, implementations would call real APIs (weather, maps, etc.)
// The agent loop in agent.js never changes — only these implementations do.
// =============================================================================

// -----------------------------------------------------------------------------
// PART 1: Tool schemas — sent to Gemini as part of every API call
// Gemini reads these to know what tools are available and how to call them.
// Note: Gemini wraps these in a "tools" array with a "functionDeclarations" key.
// -----------------------------------------------------------------------------
export const TOOL_DEFINITIONS = [
  {
    name: "get_destination_info",
    description:
      "Research a travel destination. Returns key facts, top attractions, best neighborhoods to stay, local customs, transportation tips, and must-know practical info.",
    parameters: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          description: "City and country, e.g. 'Tokyo, Japan' or 'Paris, France'",
        },
        travel_style: {
          type: "string",
          enum: ["adventure", "cultural", "relaxation", "foodie", "budget", "luxury", "general"],
          description: "The traveler's primary style to tailor recommendations",
        },
      },
      required: ["destination"],
    },
  },
  {
    name: "get_weather_forecast",
    description:
      "Get a weather forecast for a travel destination during specified dates. Returns expected temperatures, precipitation, and packing/activity recommendations.",
    parameters: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          description: "City and country",
        },
        start_date: {
          type: "string",
          description: "Travel start date in ISO format (YYYY-MM-DD)",
        },
        end_date: {
          type: "string",
          description: "Travel end date in ISO format (YYYY-MM-DD)",
        },
      },
      required: ["destination", "start_date", "end_date"],
    },
  },
  {
    name: "calculate_budget_breakdown",
    description:
      "Calculate a realistic daily budget breakdown for a destination, covering accommodation, food, local transport, and activities. Returns per-day and total estimates.",
    parameters: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          description: "City and country",
        },
        total_budget: {
          type: "number",
          description: "Total trip budget in USD",
        },
        duration_days: {
          type: "number",
          description: "Number of days for the trip",
        },
        budget_tier: {
          type: "string",
          enum: ["budget", "mid-range", "luxury"],
          description: "Spending style preference",
        },
      },
      required: ["destination", "total_budget", "duration_days", "budget_tier"],
    },
  },
];

// -----------------------------------------------------------------------------
// PART 2: Tool implementations — executed by the server when Gemini calls them
//
// These return simulated but realistic data. The data varies meaningfully by
// destination so itineraries feel genuinely different per location.
// -----------------------------------------------------------------------------

function getDestinationInfo(destination, travelStyle = "general") {
  // Normalize destination for matching
  const dest = destination.toLowerCase();

  const destinations = {
    tokyo: {
      country: "Japan",
      region: "East Asia",
      language: "Japanese",
      currency: "Japanese Yen (JPY) — ~150 JPY = $1 USD",
      best_areas: ["Shinjuku (nightlife & shopping)", "Shibuya (trendy, young)", "Asakusa (traditional)", "Roppongi (art & expats)", "Akihabara (tech & anime)"],
      top_attractions: ["Senso-ji Temple", "Shibuya Crossing", "Tsukiji Outer Market", "teamLab Borderless", "Meiji Shrine", "Tokyo Skytree", "Shinjuku Gyoen"],
      food_highlights: ["Ramen at Ichiran", "Sushi at Tsukiji", "Yakitori in Omoide Yokocho", "Tempura in Asakusa", "Conveyor belt sushi (kaiten-zushi)"],
      customs: ["Bow as greeting", "Remove shoes when entering homes/some restaurants", "No tipping — it can be offensive", "Speak quietly on trains", "Cash is still widely used"],
      transport: "Suica IC card covers all trains, subways, and buses. Buy at airport on arrival. JR Pass worth it for day trips (Nikko, Kamakura).",
      practical_tips: ["Get pocket WiFi or SIM at airport", "Google Maps works excellently for transit", "Most signs have English", "Convenience stores (7-Eleven, Lawson) are amazing for cheap meals"],
      best_for: ["food lovers", "culture seekers", "technology enthusiasts", "shoppers"],
    },
    paris: {
      country: "France",
      region: "Western Europe",
      language: "French",
      currency: "Euro (EUR) — ~0.92 EUR = $1 USD",
      best_areas: ["Le Marais (trendy, historic)", "Saint-Germain-des-Prés (café culture)", "Montmartre (artistic, views)", "Bastille (local feel)", "Champs-Élysées (luxury)"],
      top_attractions: ["Eiffel Tower", "Louvre Museum", "Musée d'Orsay", "Notre-Dame Cathedral", "Versailles (day trip)", "Sainte-Chapelle", "Centre Pompidou"],
      food_highlights: ["Croissants at a local boulangerie", "French onion soup", "Steak frites bistro lunch", "Macarons at Ladurée", "Wine and cheese picnic by the Seine"],
      customs: ["Say 'Bonjour' when entering any shop", "Tipping optional (5-10% for good service)", "Lunch is the main meal (12-2pm)", "Dinner rarely before 7:30pm", "Dress well — Parisians notice"],
      transport: "Paris Metro is excellent and cheap. Carnet of 10 tickets saves money. Vélib' bike sharing good for flat areas. Walk whenever possible — city is dense.",
      practical_tips: ["Book museum tickets online to skip queues", "Many museums free first Sunday of month", "Pharmacies everywhere — look for green cross", "Beware pickpockets near Eiffel Tower"],
      best_for: ["romance", "art lovers", "food enthusiasts", "history buffs"],
    },
    bali: {
      country: "Indonesia",
      region: "Southeast Asia",
      language: "Balinese/Indonesian",
      currency: "Indonesian Rupiah (IDR) — ~15,000 IDR = $1 USD",
      best_areas: ["Ubud (culture & rice terraces)", "Seminyak (beach clubs & dining)", "Canggu (surfers & digital nomads)", "Uluwatu (cliffs & surf)", "Nusa Dua (luxury resorts)"],
      top_attractions: ["Tanah Lot Temple", "Tegalalang Rice Terraces", "Sacred Monkey Forest", "Uluwatu Temple", "Mount Batur sunrise hike", "Tirta Empul water temple"],
      food_highlights: ["Nasi goreng (fried rice)", "Babi guling (suckling pig) in Ubud", "Satay skewers", "Fresh fruit smoothie bowls", "Seafood BBQ in Jimbaran"],
      customs: ["Cover shoulders/knees at temples", "Avoid left hand for giving/receiving", "Temples require a sarong (usually provided)", "Cremation ceremonies are public — respectful attendance welcome"],
      transport: "Rent a scooter ($5-8/day) if comfortable riding. Hire a driver for day trips ($40-60). Grab app works in main areas. No reliable public transit.",
      practical_tips: ["Stay hydrated — tropical heat", "Bargain at markets but be respectful", "Many ATMs charge fees — bring USD to exchange", "Rainy season Nov-Mar brings daily showers"],
      best_for: ["relaxation", "spirituality", "surfing", "yoga retreats", "honeymoons"],
    },
    "new york": {
      country: "USA",
      region: "North America",
      language: "English",
      currency: "US Dollar (USD)",
      best_areas: ["Midtown (iconic landmarks)", "Brooklyn (local culture)", "Lower East Side (food & nightlife)", "Greenwich Village (arts)", "Upper West Side (museums & Central Park)"],
      top_attractions: ["Central Park", "Metropolitan Museum of Art", "Brooklyn Bridge", "High Line", "Times Square", "MoMA", "Statue of Liberty", "Whitney Museum"],
      food_highlights: ["NYC-style pizza by the slice", "Bagels with lox", "Smash burgers in the West Village", "Dim sum in Flushing", "Pastrami sandwich at Katz's Deli"],
      customs: ["Tip 18-20% at restaurants", "Tip $1-2 per drink at bars", "Walk on the right, pass on the left", "Hail a cab with hand raised (or use Uber/Lyft)"],
      transport: "MetroCard for subway ($2.90/ride). OMNY contactless pay works too. Walk for short distances. Cabs/rideshare for late nights. Avoid driving.",
      practical_tips: ["Museums often free on certain evenings", "Stand to the right on escalators", "Deli breakfast is the cheapest solid meal", "Neighborhood safety varies — check reviews"],
      best_for: ["city lovers", "foodies", "art enthusiasts", "shopping", "Broadway shows"],
    },
    barcelona: {
      country: "Spain",
      region: "Southern Europe",
      language: "Spanish/Catalan",
      currency: "Euro (EUR) — ~0.92 EUR = $1 USD",
      best_areas: ["Gothic Quarter (historic)", "El Born (hip & artsy)", "Barceloneta (beach)", "Eixample (Gaudí architecture)", "Gràcia (local neighborhood feel)"],
      top_attractions: ["Sagrada Família", "Park Güell", "Casa Batlló", "La Barceloneta Beach", "Picasso Museum", "La Boqueria Market", "Camp Nou"],
      food_highlights: ["Tapas crawl in El Born", "Jamón ibérico", "Pa amb tomàquet (bread with tomato)", "Paella on the beach", "Pintxos in El Raval", "Crema catalana"],
      customs: ["Dinner after 9pm is normal", "Siesta 2-5pm (some shops close)", "Two-cheek kiss greeting", "Tipping optional but appreciated", "Catalans are proud of their culture — acknowledge it"],
      transport: "T-Casual 10-trip metro card is great value. Walking is best in Gothic Quarter. Bikes work well along the seafront. Airport bus much cheaper than taxi.",
      practical_tips: ["Book Sagrada Família months in advance", "Beaches get crowded July-August", "Pickpockets common on La Rambla", "Late-night culture — things start at midnight"],
      best_for: ["architecture lovers", "beach lovers", "foodies", "nightlife", "football fans"],
    },
  };

  // Find matching destination
  let info = null;
  for (const [key, data] of Object.entries(destinations)) {
    if (dest.includes(key)) {
      info = data;
      break;
    }
  }

  // Generic fallback for unknown destinations
  if (!info) {
    info = {
      country: "Unknown",
      region: "International",
      language: "Local language",
      currency: "Local currency — check current exchange rates",
      best_areas: ["City center", "Historic district", "Waterfront area"],
      top_attractions: ["Local landmarks", "Museums", "Historic sites", "Markets", "Parks"],
      food_highlights: ["Local cuisine", "Street food markets", "Traditional restaurants"],
      customs: ["Research local customs before visiting", "Dress modestly at religious sites", "Learn a few basic phrases in local language"],
      transport: "Research local public transit options. Apps like Google Maps and Moovit work in most major cities.",
      practical_tips: ["Check visa requirements", "Get travel insurance", "Notify your bank before traveling", "Download offline maps"],
      best_for: ["general exploration", "cultural discovery"],
    };
  }

  // Add travel-style-specific recommendations
  const styleRecommendations = {
    adventure: "Focus on outdoor activities, hiking, and physically engaging experiences.",
    cultural: "Prioritize museums, historical sites, local ceremonies, and cultural immersion.",
    relaxation: "Emphasize spas, quiet cafes, leisurely walks, and unhurried experiences.",
    foodie: "Center each day around food markets, cooking classes, and acclaimed local restaurants.",
    budget: "Use local transit, eat at markets, find free attractions, stay in well-rated hostels.",
    luxury: "Book in advance for fine dining, private tours, and premium experiences.",
    general: "Balanced mix of sightseeing, food, culture, and leisure.",
  };

  return {
    destination,
    ...info,
    travel_style_advice: styleRecommendations[travelStyle] || styleRecommendations.general,
    data_source: "Destination Research Tool v1.0",
  };
}

function getWeatherForecast(destination, startDate, endDate) {
  const dest = destination.toLowerCase();

  // Determine month for seasonal data
  const month = new Date(startDate).getMonth(); // 0-11

  // Climate profiles by destination
  const climates = {
    tokyo: [
      { months: [11, 0, 1], season: "Winter", temp_low: 2, temp_high: 12, conditions: "Cold and dry. Occasional frost. Clear skies common.", rain_days: 2, clothing: "Heavy coat, layers, scarf, gloves" },
      { months: [2, 3, 4], season: "Spring", temp_low: 8, temp_high: 20, conditions: "Cherry blossom season (late March–April). Mild and beautiful.", rain_days: 5, clothing: "Light jacket, layers" },
      { months: [5, 6, 7], season: "Summer", temp_low: 22, temp_high: 35, conditions: "Hot and very humid. Rainy season June–July.", rain_days: 10, clothing: "Light breathable clothes, umbrella essential" },
      { months: [8, 9, 10], season: "Autumn", temp_low: 12, temp_high: 26, conditions: "Beautiful fall foliage in October–November. Very pleasant.", rain_days: 4, clothing: "Light layers, light jacket" },
    ],
    paris: [
      { months: [11, 0, 1], season: "Winter", temp_low: 3, temp_high: 8, conditions: "Cold, grey, and occasionally rainy. Fewer tourists.", rain_days: 8, clothing: "Heavy coat, layers, waterproof jacket" },
      { months: [2, 3, 4], season: "Spring", temp_low: 8, temp_high: 18, conditions: "Beautiful — flowers blooming, parks lively. Light rain possible.", rain_days: 7, clothing: "Light layers, light jacket, small umbrella" },
      { months: [5, 6, 7], season: "Summer", temp_low: 15, temp_high: 28, conditions: "Warm and sunny. Peak tourist season — book ahead!", rain_days: 5, clothing: "Light clothes, one warm layer for evenings" },
      { months: [8, 9, 10], season: "Autumn", temp_low: 9, temp_high: 20, conditions: "Mild with some rain. Golden leaves from October.", rain_days: 7, clothing: "Layers, waterproof jacket" },
    ],
    bali: [
      { months: [5, 6, 7, 8], season: "Dry Season", temp_low: 22, temp_high: 30, conditions: "Best time to visit. Sunny with low humidity. Perfect beach weather.", rain_days: 1, clothing: "Light summer clothes, swimwear, light cardigan for temples" },
      { months: [9, 10, 11, 0, 1, 2, 3, 4], season: "Wet Season", temp_low: 23, temp_high: 31, conditions: "Daily tropical downpours (usually 1-2 hours). Hot and humid but still very enjoyable.", rain_days: 15, clothing: "Light clothes, waterproof sandals, compact umbrella" },
    ],
    default: [
      { months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], season: "Year-round", temp_low: 15, temp_high: 25, conditions: "Moderate conditions expected. Check local forecasts closer to travel.", rain_days: 5, clothing: "Pack layers to accommodate variable weather" },
    ],
  };

  let climateData = climates.default[0];

  for (const [key, seasons] of Object.entries(climates)) {
    if (dest.includes(key)) {
      for (const season of seasons) {
        if (season.months.includes(month)) {
          climateData = season;
          break;
        }
      }
      break;
    }
  }

  // Calculate trip duration
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  return {
    destination,
    travel_dates: { start: startDate, end: endDate, duration_days: durationDays },
    season: climateData.season,
    temperature: {
      average_low_celsius: climateData.temp_low,
      average_high_celsius: climateData.temp_high,
      average_low_fahrenheit: Math.round(climateData.temp_low * 9 / 5 + 32),
      average_high_fahrenheit: Math.round(climateData.temp_high * 9 / 5 + 32),
    },
    conditions: climateData.conditions,
    expected_rain_days: Math.round(climateData.rain_days * durationDays / 30),
    what_to_wear: climateData.clothing,
    outdoor_activity_suitability: climateData.rain_days <= 5 ? "Excellent" : climateData.rain_days <= 10 ? "Good" : "Fair — plan indoor alternatives",
    data_source: "Weather Forecast Tool v1.0",
  };
}

function calculateBudgetBreakdown(destination, totalBudget, durationDays, budgetTier) {
  const dest = destination.toLowerCase();

  // Cost-of-living multipliers by destination (relative to NYC baseline = 1.0)
  const costMultipliers = {
    tokyo: 0.85,
    paris: 0.90,
    bali: 0.35,
    "new york": 1.0,
    barcelona: 0.75,
    london: 1.10,
    singapore: 0.95,
    bangkok: 0.30,
    sydney: 1.05,
    default: 0.75,
  };

  let multiplier = costMultipliers.default;
  for (const [key, val] of Object.entries(costMultipliers)) {
    if (dest.includes(key)) {
      multiplier = val;
      break;
    }
  }

  // Base daily costs by tier (USD, NYC baseline)
  const baseCosts = {
    budget: { accommodation: 40, food: 25, transport: 10, activities: 15 },
    "mid-range": { accommodation: 120, food: 60, transport: 20, activities: 40 },
    luxury: { accommodation: 350, food: 150, transport: 60, activities: 100 },
  };

  const base = baseCosts[budgetTier] || baseCosts["mid-range"];

  const dailyCosts = {
    accommodation: Math.round(base.accommodation * multiplier),
    food: Math.round(base.food * multiplier),
    transport: Math.round(base.transport * multiplier),
    activities: Math.round(base.activities * multiplier),
  };

  const dailyTotal = Object.values(dailyCosts).reduce((a, b) => a + b, 0);
  const tripTotal = dailyTotal * durationDays;
  const flightEstimate = Math.round(totalBudget * 0.25); // rough 25% for flights
  const nonFlightBudget = totalBudget - flightEstimate;
  const dailyAvailableAfterFlights = Math.round(nonFlightBudget / durationDays);

  return {
    destination,
    duration_days: durationDays,
    total_budget: totalBudget,
    budget_tier: budgetTier,
    estimated_flight_cost: flightEstimate,
    remaining_after_flights: nonFlightBudget,
    recommended_daily_budget: dailyAvailableAfterFlights,
    estimated_daily_costs: dailyCosts,
    estimated_daily_total: dailyTotal,
    estimated_total_cost: tripTotal,
    budget_assessment:
      tripTotal <= nonFlightBudget
        ? `Budget is comfortable. You have ~$${nonFlightBudget - tripTotal} buffer after flights.`
        : `Budget is tight. Consider reducing activities or accommodation tier to stay within budget.`,
    money_saving_tips: [
      "Eat lunch as your main meal — restaurants often have cheaper lunch menus",
      "Use public transit instead of taxis for most trips",
      "Book accommodation and major attractions in advance for better rates",
      "Visit free museums and parks on weekdays to avoid weekend crowds",
      `At ${budgetTier} tier in ${destination}, prioritize: ${budgetTier === "budget" ? "street food, hostels, free sights" : budgetTier === "mid-range" ? "boutique hotels, local restaurants, selective paid attractions" : "premium hotels, fine dining, private experiences"}`,
    ],
    data_source: "Budget Calculator Tool v1.0",
  };
}

// -----------------------------------------------------------------------------
// PART 3: Tool dispatcher — called by the agent loop in agent.js
//
// This is the function the agent loop calls to execute any tool.
// Add new tools here as the project grows.
// -----------------------------------------------------------------------------
export async function executeTool(toolName, toolInput) {
  switch (toolName) {
    case "get_destination_info":
      return getDestinationInfo(toolInput.destination, toolInput.travel_style);

    case "get_weather_forecast":
      return getWeatherForecast(toolInput.destination, toolInput.start_date, toolInput.end_date);

    case "calculate_budget_breakdown":
      return calculateBudgetBreakdown(
        toolInput.destination,
        toolInput.total_budget,
        toolInput.duration_days,
        toolInput.budget_tier
      );

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
