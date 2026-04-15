// =============================================================================
// tools.js — Tool definitions and simulated implementations
//
// LEARNING NOTE:
// Tools have two parts:
//   1. The SCHEMA (sent to the model) — tells it what tools exist and their params
//   2. The IMPLEMENTATION (runs on server) — executes when the model calls a tool
//
// In production, implementations would call real APIs (weather, maps, etc.)
// The agent loop in agent.js never changes — only these implementations do.
// =============================================================================

// -----------------------------------------------------------------------------
// PART 1: Tool schemas — sent to the model as part of every API call
// -----------------------------------------------------------------------------
export const TOOL_DEFINITIONS = [
  {
    name: "get_destination_info",
    description:
      "Research an Indian travel destination. Returns key facts, top attractions, best neighborhoods, local customs, transportation tips, and must-know practical info with strong emphasis on regional cuisine.",
    parameters: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          description: "City and state in India, e.g. 'Jaipur, Rajasthan' or 'Mumbai, Maharashtra'",
        },
        travel_style: {
          type: "string",
          enum: ["adventure", "cultural", "relaxation", "foodie", "budget", "luxury", "spiritual", "general"],
          description: "The traveler's primary style to tailor recommendations",
        },
      },
      required: ["destination"],
    },
  },
  {
    name: "get_weather_forecast",
    description:
      "Get a weather forecast for an Indian destination during specified dates. Returns expected temperatures, precipitation, and packing/activity recommendations.",
    parameters: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          description: "City and state in India",
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
      "Calculate a realistic daily budget breakdown for an Indian destination in USD, covering accommodation, food, local transport, and activities.",
    parameters: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          description: "City and state in India",
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
// PART 2: Tool implementations
// -----------------------------------------------------------------------------

function getDestinationInfo(destination, travelStyle = "general") {
  const dest = destination.toLowerCase();

  const destinations = {
    delhi: {
      state: "Delhi (NCT)",
      region: "North India",
      language: "Hindi, Punjabi, Urdu",
      currency: "Indian Rupee (INR) — ~83 INR = $1 USD",
      best_areas: [
        "Old Delhi / Chandni Chowk (Mughal heritage & street food)",
        "Connaught Place (shopping & modern dining)",
        "Hauz Khas (cafes, art galleries, nightlife)",
        "Lodi Colony (quiet, upscale, embassies)",
        "Karol Bagh (budget shopping & local food)",
      ],
      top_attractions: [
        "Red Fort (Lal Qila)", "Jama Masjid", "Qutub Minar",
        "India Gate", "Humayun's Tomb", "Lodhi Garden",
        "Akshardham Temple", "National Museum", "Chandni Chowk bazaar",
      ],
      food_highlights: [
        "Paranthe Wali Gali — legendary stuffed paranthas in Old Delhi since 1875",
        "Karim's near Jama Masjid — iconic Mughal-style mutton korma and nihari",
        "Chole bhature at Sita Ram Diwan Chand (Paharganj) — cult classic",
        "Daulat ki chaat — ephemeral winter street dessert made from whipped cream",
        "Butter chicken at its birthplace — Moti Mahal, Daryaganj",
        "Golgappe (pani puri) at Chandni Chowk — tangy tamarind water",
        "Rabri faluda at Kuremal Mohan Lal Kulfi Wale",
        "Bedmi puri with aloo sabzi — quintessential Old Delhi breakfast",
      ],
      customs: [
        "Remove shoes before entering temples and mosques",
        "Dress modestly at religious sites — cover shoulders and knees",
        "Bargain at street markets (Sarojini Nagar, Lajpat Nagar) — it's expected",
        "Auto-rickshaw drivers often quote inflated rates — always use meter or app",
        "Old Delhi can be overwhelming — go early morning for best experience",
      ],
      transport: "Delhi Metro is excellent, affordable, and covers all major sights. Use Ola/Uber for direct trips. Cycle rickshaws are fun in Old Delhi. Avoid peak hours (8-10am, 6-9pm).",
      practical_tips: [
        "Air quality can be poor Oct–Feb — check AQI before outdoor activities",
        "Street food is generally safe if the stall is busy (high turnover = fresh)",
        "Carry small denomination notes — vendors rarely have change",
        "Book Red Fort tickets online to skip queues",
        "Avoid drinking tap water — bottled or filtered only",
      ],
      best_for: ["history lovers", "Mughal cuisine", "street food explorers", "heritage walks", "shopping"],
    },

    mumbai: {
      state: "Maharashtra",
      region: "West India",
      language: "Marathi, Hindi, English",
      currency: "Indian Rupee (INR) — ~83 INR = $1 USD",
      best_areas: [
        "Colaba (heritage, cafes, Gateway of India)",
        "Bandra (trendy, Bollywood, sea-facing restaurants)",
        "Dharavi (largest Asia slum — powerful heritage tours)",
        "Fort/CST area (colonial architecture, street food)",
        "Juhu (beach, local snacks, celebrity neighbourhood)",
      ],
      top_attractions: [
        "Gateway of India", "Elephanta Caves (UNESCO)", "Marine Drive (Queen's Necklace)",
        "Chhatrapati Shivaji Maharaj Terminus (UNESCO)", "Dharavi Heritage Walk",
        "Haji Ali Dargah", "Sanjay Gandhi National Park", "Dhobi Ghat",
      ],
      food_highlights: [
        "Vada pav — Mumbai's soul food, spiced potato fritter in a bread roll, ₹15-30",
        "Pav bhaji at Juhu Beach — buttery mixed vegetable mash with soft bread",
        "Misal pav — spicy sprouted lentil curry with bread, a Maharashtrian breakfast staple",
        "Bombay sandwich — grilled with chutney, beetroot, cucumber, masala",
        "Bhel puri and sev puri at Chowpatty Beach",
        "Keema pav at Olympia (Colaba) — minced meat with soft buns since 1939",
        "Modak — sweet steamed dumpling, Ganesh's favourite, try at Vidyanagari",
        "Solkadhi — cooling kokum and coconut milk drink unique to coastal Maharashtra",
      ],
      customs: [
        "Mumbai is cosmopolitan — relatively relaxed dress code vs other Indian cities",
        "Local trains are packed but efficient — avoid 8-11am and 5-9pm rush hours",
        "Haggling at Crawford Market and Colaba Causeway is normal",
        "Tipping 10% at restaurants is appreciated but not mandatory",
        "Monsoon (Jun–Sep) makes streets flood — plan indoor activities",
      ],
      transport: "Local trains (Central, Western, Harbour lines) are fastest. Metro lines expanding rapidly. Ola/Uber widely available. Kaali-peeli taxis are iconic. Ferry from Gateway of India to Elephanta Caves.",
      practical_tips: [
        "Buy a local SIM at the airport — Jio is cheapest and has great coverage",
        "Street food at busy stalls is generally safe and absolutely delicious",
        "Monsoon (Jun–Sep) is humid but the city comes alive — pack light waterproofs",
        "Crawford Market for spices, nuts, and dry fruits at wholesale prices",
        "Colaba Causeway for clothes, antiques, and souvenirs",
      ],
      best_for: ["coastal cuisine", "street food", "colonial architecture", "Bollywood culture", "nightlife"],
    },

    jaipur: {
      state: "Rajasthan",
      region: "North-West India",
      language: "Hindi, Rajasthani",
      currency: "Indian Rupee (INR) — ~83 INR = $1 USD",
      best_areas: [
        "Old City / Pink City (bazaars, forts, havelis)",
        "C-Scheme (upscale restaurants, cafes)",
        "Bapu Bazaar & Johari Bazaar (traditional shopping)",
        "Jawahar Nagar (heritage hotels)",
        "Sanganer (block printing workshops)",
      ],
      top_attractions: [
        "Amber Fort (Amer Fort)", "City Palace", "Hawa Mahal (Palace of Winds)",
        "Jantar Mantar (UNESCO)", "Nahargarh Fort (sunset views)",
        "Jal Mahal (Water Palace)", "Albert Hall Museum", "Birla Mandir",
      ],
      food_highlights: [
        "Dal Baati Churma — the definitive Rajasthani meal: baked wheat balls with lentils and sweet crumbled bread",
        "Laal Maas — fiery mutton curry made with Mathania red chillies, a Rajput warrior dish",
        "Ker Sangri — wild desert beans and berries cooked with spices, unique to Rajasthan",
        "Pyaaz kachori at Rawat Mishthan Bhandar — flaky onion-filled pastry, Jaipur's breakfast icon",
        "Ghevar — disc-shaped honeycomb sweet soaked in sugar syrup, especially at festivals",
        "Mirchi bada — massive chilli fritter stuffed with spiced potato, a street food legend",
        "Mawa kachori at Laxmi Mishthan Bhandar — sweet version filled with khoya",
        "Rajasthani thali at Chokhi Dhani — complete ceremonial meal experience",
      ],
      customs: [
        "Dress conservatively, especially in the Old City and at temples",
        "Photography inside palaces may require a fee — check before shooting",
        "Camel and elephant rides available — choose ethical operators",
        "Bargain firmly at Johari Bazaar (gems) and Bapu Bazaar (textiles)",
        "Early morning is best for forts before crowds and heat",
      ],
      transport: "Auto-rickshaws are the main way around. Agree on price before boarding. Cycle rickshaws good for Old City lanes. Ola/Uber available. Tuk-tuk tours popular. City bus service exists but crowded.",
      practical_tips: [
        "Summer (Apr–Jun) is brutal — 45°C+. Best time is Oct–March",
        "Pink City walking tour is best done at 7-9am before heat",
        "Gem and jewellery shops are everywhere — be cautious of tourist traps",
        "Block printing and blue pottery workshops worth a half-day visit",
        "Rajasthani food is rich and spice-heavy — tell vendors your spice tolerance",
      ],
      best_for: ["Rajasthani cuisine", "fort exploration", "heritage hotels", "craft shopping", "desert culture"],
    },

    varanasi: {
      state: "Uttar Pradesh",
      region: "North India",
      language: "Hindi, Bhojpuri",
      currency: "Indian Rupee (INR) — ~83 INR = $1 USD",
      best_areas: [
        "Dashashwamedh Ghat (main ghat, evening aarti)",
        "Assi Ghat (bohemian, cafes, yoga)",
        "Manikarnika Ghat (cremation ghat — approach respectfully)",
        "Bengali Tola (old city lanes, temples)",
        "Godaulia (shopping, street food)",
      ],
      top_attractions: [
        "Ganga Aarti at Dashashwamedh Ghat (evening ritual)",
        "Sunrise boat ride on the Ganges",
        "Kashi Vishwanath Temple",
        "Sarnath (where Buddha first preached — 10km away)",
        "Ramnagar Fort",
        "Banaras Hindu University campus",
        "Chunar Fort (day trip)",
      ],
      food_highlights: [
        "Kachori sabzi — flaky deep-fried bread with spiced potato curry, the definitive Banarasi breakfast",
        "Banarasi paan — betel leaf preparation that's an art form, try at Keshav Paan Bhandar",
        "Thandai — chilled milk drink with nuts, spices, and rose water (spiked with bhang at Holi)",
        "Malaiyyo — winter-only morning dessert of whipped milk froth dusted with saffron",
        "Tamatar chaat — tangy tomato-based chaat unique to Varanasi",
        "Baati chokha — roasted wheat balls with mashed spiced vegetables",
        "Lassi at Blue Lassi Shop — cult tiny shop serving 70+ varieties since 1925",
        "Chena dahi vada — lentil dumplings in yogurt, a Banarasi street staple",
      ],
      customs: [
        "Varanasi is deeply spiritual — behave respectfully at all ghats and temples",
        "Non-Hindus may not be allowed inside some temples — check at entrance",
        "Cremation at Manikarnika Ghat is a sacred ritual — do not photograph",
        "Boat rides at dawn are transformative — sunrise aarti is powerful",
        "Sadhus and holy men are genuine — treat with respect",
      ],
      transport: "Cycle rickshaws and e-rickshaws best for old city lanes (too narrow for cars). Ola/Uber for longer distances. Boats on the Ganga for ghat-hopping — negotiate fares. Walking the ghats is the best experience.",
      practical_tips: [
        "The old city labyrinth is confusing — get lost intentionally, it's the best way to explore",
        "Silk weaving workshops in the old city — Banarasi silk is world-famous",
        "Evenings are magical — Ganga Aarti at 7pm is unmissable",
        "Ghats at 5am during sunrise boat ride is a life experience",
        "Keep phone and camera secure — narrow lanes can get crowded",
      ],
      best_for: ["spirituality", "Banarasi cuisine", "sunrise boat rides", "silk shopping", "cultural immersion"],
    },

    goa: {
      state: "Goa",
      region: "West Coast / Konkan",
      language: "Konkani, Marathi, English, Portuguese influence",
      currency: "Indian Rupee (INR) — ~83 INR = $1 USD",
      best_areas: [
        "North Goa — Calangute, Baga, Anjuna (lively beaches, nightlife, water sports)",
        "South Goa — Palolem, Colva, Agonda (quieter, cleaner beaches)",
        "Panaji/Panjim (Goa's charming capital — Latin Quarter, heritage)",
        "Old Goa (UNESCO churches — Se Cathedral, Basilica of Bom Jesus)",
        "Mapusa (Friday market — local produce and spices)",
      ],
      top_attractions: [
        "Basilica of Bom Jesus (UNESCO) — St. Francis Xavier's tomb",
        "Se Cathedral", "Dudhsagar Waterfalls (seasonal)",
        "Anjuna Flea Market (Wednesday)", "Chapora Fort (Dil Chahta Hai fort)",
        "Spice plantation tours (Sahakari or Savoi)", "Fort Aguada",
        "Latin Quarter heritage walk in Panaji",
      ],
      food_highlights: [
        "Fish curry rice (Xitti Codi) — Goa's daily staple: tangy coconut-based fish curry with red rice",
        "Prawn balchão — intensely spiced pickled prawn preparation with tomatoes and vinegar",
        "Sorpotel — pork offal cooked in vinegar and spices, a Goan Catholic classic",
        "Bebinca — 16-layer coconut milk and egg yolk pudding, Goa's signature dessert",
        "Feni — cashew or coconut toddy spirit unique to Goa, try at a local taverna",
        "Goan sausages (chorizo) — pork sausages cured in vinegar and spices",
        "Crab xacuti at a beach shack — whole crab in coconut and roasted spice gravy",
        "Poi bread — crusty traditional Goan bread from wood-fired ovens",
      ],
      customs: [
        "Goa is India's most relaxed state — beach culture is the norm",
        "Bikinis on beaches are fine but cover up when visiting churches or markets",
        "Flea markets have fixed prices at some stalls, negotiable at others",
        "Beach shacks are the best dining experience — sit with your feet in sand",
        "Portuguese colonial influence gives Goa a unique culture — embrace it",
      ],
      transport: "Renting a scooter (₹300-400/day) is the best way to explore. Ola/Uber available in main areas. Taxis (black and yellow) are expensive — negotiate before hiring. Local buses cheap but slow. Ferry crossings between Panaji and Betim are a fun experience.",
      practical_tips: [
        "Avoid May–September (intense monsoon) unless you love dramatic rain",
        "Best time: November to February — perfect weather, peak tourist season",
        "Spice plantation tours include lunch — worth the half-day",
        "Buy cashews, feni, and spices to take home from Mapusa market",
        "South Goa beaches are cleaner and less crowded than North Goa",
      ],
      best_for: ["seafood", "beaches", "colonial heritage", "nightlife", "water sports", "relaxation"],
    },

    bangalore: {
      state: "Karnataka",
      region: "South India",
      language: "Kannada, Tamil, Telugu, English",
      currency: "Indian Rupee (INR) — ~83 INR = $1 USD",
      best_areas: [
        "Indiranagar (restaurants, craft beer, boutiques)",
        "Koramangala (tech hub, eateries, young crowd)",
        "MG Road & Brigade Road (shopping, pubs, heritage)",
        "Malleshwaram (traditional, old Bangalore, filter coffee)",
        "Cubbon Park area (colonial buildings, museums)",
      ],
      top_attractions: [
        "Lalbagh Botanical Garden", "Cubbon Park",
        "Bangalore Palace", "ISKCON Temple",
        "Tipu Sultan's Summer Palace", "Vidhana Soudha (exterior)",
        "National Gallery of Modern Art", "Bull Temple (Dodda Ganesha)",
        "Day trip: Mysore (150km) — Mysore Palace, silk, sandal",
      ],
      food_highlights: [
        "Masala dosa at MTR (Mavalli Tiffin Rooms) — legendary since 1924, crispy crepe with spiced potato",
        "Idli-vada-sambar-chutney at Brahmin's Coffee Bar — morning ritual for locals",
        "Filter coffee (kaapi) — South Indian decoction coffee with frothy milk, served in a tumbler-davara",
        "Bisi bele bath — Karnataka's one-pot rice-lentil-vegetable dish with ghee",
        "Ragi mudde — dark finger millet ball eaten with sambar or saaru (rasam), deeply nutritious",
        "Set dosa with saagu — soft spongy dosas with mixed vegetable curry",
        "Mangalorean fish curry at any coastal Karnataka restaurant",
        "Craft beer at Toit or Arbor Brewing — Bangalore is India's craft beer capital",
      ],
      customs: [
        "Bangalore is cosmopolitan and tech-forward — fairly liberal atmosphere",
        "Auto-rickshaw drivers often refuse meters — use Ola/Uber to avoid conflict",
        "Kannada pride is strong — attempt 'Dhanyavadagalu' (thank you) and locals will love you",
        "Restaurants popular with locals mean the food is authentic and good",
        "Traffic is severe during peak hours — plan your day around avoiding 8-11am and 5-9pm",
      ],
      transport: "Namma Metro is growing rapidly — useful for key routes. Ola/Uber widely used. BMTC buses extensive but complex for visitors. Auto-rickshaws everywhere. Traffic is notorious — plan extra time.",
      practical_tips: [
        "Bangalore weather is pleasant year-round — the best climate of any major Indian city",
        "Day trip to Mysore (3hr drive) is excellent — Mysore Palace is stunning",
        "Silk sarees, sandalwood products, and coffee are best Bangalore souvenirs",
        "The pub scene on MG Road and in Indiranagar is among India's best",
        "UB City mall has high-end Indian and international dining if needed",
      ],
      best_for: ["South Indian cuisine", "coffee culture", "craft beer", "tech culture", "day trips to Mysore"],
    },
  };

  let info = null;
  for (const [key, data] of Object.entries(destinations)) {
    if (dest.includes(key)) {
      info = data;
      break;
    }
  }

  // India-specific fallback for cities not in the hardcoded list
  if (!info) {
    info = {
      state: "India",
      region: "India",
      language: "Hindi and local regional language",
      currency: "Indian Rupee (INR) — ~83 INR = $1 USD",
      best_areas: ["City centre", "Old quarter", "Market area", "Temple district"],
      top_attractions: ["Local temples and monuments", "Markets and bazaars", "Heritage sites", "Natural attractions"],
      food_highlights: [
        "Regional thali — the complete local meal with multiple curries, dal, rice/roti",
        "Local street chaat — spiced snacks unique to this region",
        "Regional sweets — every Indian city has its signature mithai",
        "Dal and roti — comforting everyday food done perfectly by local dhabas",
      ],
      customs: [
        "Remove shoes at temples and religious sites",
        "Dress modestly — cover shoulders and knees",
        "Bargaining is normal and expected at markets",
        "Respect local customs around food — many areas are vegetarian-dominant",
      ],
      transport: "Auto-rickshaws and local taxis available. Ola/Uber works in most cities. Local buses for budget travel.",
      practical_tips: [
        "Carry cash — many local vendors don't accept cards",
        "Stick to bottled or filtered water",
        "Street food at busy stalls is generally safe and delicious",
        "Ask locals for their favourite restaurant — you'll always eat better",
      ],
      best_for: ["cultural exploration", "regional cuisine", "authentic local experiences"],
    };
  }

  const styleRecommendations = {
    adventure:  "Focus on trekking, outdoor activities, wildlife safaris, and physically engaging experiences.",
    cultural:   "Prioritize temples, historical monuments, local ceremonies, art forms, and cultural immersion.",
    relaxation: "Emphasize Ayurvedic spas, quiet heritage cafes, leisurely walks, and unhurried experiences.",
    foodie:     "Center every day around food — morning street breakfast, local lunch thali, evening market snacks, and dinner at a regional specialty restaurant.",
    budget:     "Use local transit, eat at dhabas and street stalls, focus on free temples and markets, stay in heritage guesthouses.",
    luxury:     "Book heritage palace hotels, private guided tours, chef's table experiences, and Ayurvedic retreats in advance.",
    spiritual:  "Prioritize temple visits at dawn, yoga and meditation sessions, aarti ceremonies, and interactions with local spiritual communities.",
    general:    "Balanced mix of sightseeing, regional food, culture, and some leisure time.",
  };

  return {
    destination,
    ...info,
    travel_style_advice: styleRecommendations[travelStyle] || styleRecommendations.general,
    cuisine_note: "Indian regional cuisine varies dramatically between cities — the food highlights above are unique to this specific region and cannot be authentically replicated elsewhere.",
    data_source: "ChaiNashta Destination Research Tool v2.0",
  };
}

function getWeatherForecast(destination, startDate, endDate) {
  const dest = destination.toLowerCase();
  const month = new Date(startDate).getMonth(); // 0-11

  const climates = {
    delhi: [
      { months: [11, 0, 1], season: "Winter", temp_low: 5, temp_high: 20, conditions: "Cool, dry, and pleasant. Occasional morning fog in January. Best time to visit.", rain_days: 1, clothing: "Light woolens, jacket for evenings" },
      { months: [2, 3], season: "Spring", temp_low: 14, temp_high: 32, conditions: "Warming up fast. March pleasant, April gets hot. Good for sightseeing.", rain_days: 1, clothing: "Light cottons, sunscreen essential" },
      { months: [4, 5], season: "Summer", temp_low: 27, temp_high: 45, conditions: "Extreme heat. Hot dry winds (loo). Outdoor activities only early morning or evening.", rain_days: 1, clothing: "Loose light cottons, hat, stay hydrated" },
      { months: [6, 7, 8], season: "Monsoon", temp_low: 25, temp_high: 36, conditions: "Heavy rains with humidity. Streets flood occasionally. Greenery returns.", rain_days: 15, clothing: "Light clothes, waterproof sandals, umbrella" },
      { months: [9, 10], season: "Post-Monsoon", temp_low: 16, temp_high: 33, conditions: "Cooling down, occasional rain. October is excellent, November ideal.", rain_days: 3, clothing: "Light layers" },
    ],
    goa: [
      { months: [10, 11, 0, 1, 2, 3], season: "Dry Season", temp_low: 20, temp_high: 33, conditions: "Sunny, low humidity, perfect beach weather. Peak tourist season Nov–Jan.", rain_days: 1, clothing: "Light summer clothes, swimwear" },
      { months: [4, 5], season: "Pre-Monsoon", temp_low: 24, temp_high: 35, conditions: "Getting hot and humid. Some beach shacks close. Quieter and cheaper.", rain_days: 3, clothing: "Light breathable clothes" },
      { months: [6, 7, 8, 9], season: "Monsoon", temp_low: 23, temp_high: 30, conditions: "Heavy intense rains. Waterfalls at peak. Most beach shacks closed. Dramatic and beautiful.", rain_days: 22, clothing: "Waterproofs, quick-dry clothes" },
    ],
    jaipur: [
      { months: [11, 0, 1], season: "Winter", temp_low: 8, temp_high: 22, conditions: "Cool and dry. Perfect for fort exploration. Occasional cold nights.", rain_days: 1, clothing: "Layers, light jacket, scarf for evenings" },
      { months: [2, 3], season: "Spring", temp_low: 16, temp_high: 34, conditions: "Warming up. Holi festival in March is spectacular in Rajasthan.", rain_days: 1, clothing: "Light cottons, sun protection" },
      { months: [4, 5, 6], season: "Summer", temp_low: 26, temp_high: 44, conditions: "Intense desert heat. Fort visits only at dawn/dusk. Stay hydrated.", rain_days: 2, clothing: "Loose cotton, hat, sunscreen, lots of water" },
      { months: [7, 8, 9], season: "Monsoon", temp_low: 22, temp_high: 35, conditions: "Relief from heat with rains. Forts look dramatic. Some roads muddy.", rain_days: 10, clothing: "Light clothes, umbrella" },
      { months: [10], season: "Post-Monsoon", temp_low: 16, temp_high: 32, conditions: "Beautiful — lush and green after rains, not yet cold.", rain_days: 2, clothing: "Light layers" },
    ],
    mumbai: [
      { months: [11, 0, 1, 2], season: "Winter / Dry", temp_low: 17, temp_high: 30, conditions: "Best time to visit. Low humidity, pleasant evenings, great for street food walks.", rain_days: 0, clothing: "Light cottons, one light layer for evenings" },
      { months: [3, 4, 5], season: "Summer", temp_low: 24, temp_high: 36, conditions: "Hot and increasingly humid. Indoor attractions recommended midday.", rain_days: 1, clothing: "Very light cottons, stay hydrated" },
      { months: [6, 7, 8, 9], season: "Monsoon", temp_low: 23, temp_high: 30, conditions: "Very heavy rains (Mumbai gets ~2400mm annually). Streets flood. City still vibrant.", rain_days: 20, clothing: "Waterproofs, waterproof footwear, quick-dry clothes" },
      { months: [10], season: "Post-Monsoon", temp_low: 21, temp_high: 32, conditions: "Humidity dropping, pleasant. One of the best months.", rain_days: 3, clothing: "Light clothes" },
    ],
    varanasi: [
      { months: [11, 0, 1], season: "Winter", temp_low: 6, temp_high: 18, conditions: "Cold mornings with mist on the Ganges. Deeply atmospheric. Best time for ghats.", rain_days: 1, clothing: "Warm layers, especially for dawn boat rides" },
      { months: [2, 3], season: "Spring", temp_low: 14, temp_high: 30, conditions: "Pleasant. Holi celebrations on the ghats are spectacular.", rain_days: 1, clothing: "Light cottons" },
      { months: [4, 5, 6], season: "Summer", temp_low: 26, temp_high: 44, conditions: "Very hot. Ghats best at dawn only. Indoor temple visits midday.", rain_days: 1, clothing: "Loose light cottons, hat" },
      { months: [7, 8, 9], season: "Monsoon", temp_low: 24, temp_high: 33, conditions: "Rains bring the Ganga to flood levels. Ghats submerged. Dramatic atmosphere.", rain_days: 18, clothing: "Waterproofs, sandals" },
      { months: [10], season: "Post-Monsoon", temp_low: 18, temp_high: 30, conditions: "Beautiful — Diwali in Varanasi is one of India's great experiences (October/November).", rain_days: 2, clothing: "Light layers" },
    ],
    bangalore: [
      { months: [0, 1, 2], season: "Dry Season", temp_low: 15, temp_high: 28, conditions: "Pleasant and mild. Bangalore's famously good weather. Perfect for exploring.", rain_days: 1, clothing: "Light cottons with a layer for evenings" },
      { months: [3, 4], season: "Pre-Monsoon", temp_low: 20, temp_high: 34, conditions: "Warmer but still manageable. Occasional thunderstorms.", rain_days: 4, clothing: "Light cottons, umbrella handy" },
      { months: [5, 6, 7, 8, 9], season: "Monsoon", temp_low: 18, temp_high: 27, conditions: "Long moderate monsoon season. Cool and green. Rarely heavy enough to disrupt plans.", rain_days: 12, clothing: "Light waterproofs, layer up" },
      { months: [10, 11], season: "Post-Monsoon", temp_low: 14, temp_high: 26, conditions: "Beautiful weather. One of the best times. Lalbagh in full bloom.", rain_days: 5, clothing: "Light layers" },
    ],
    default: [
      { months: [0,1,2,3,4,5,6,7,8,9,10,11], season: "Check locally", temp_low: 15, temp_high: 32,
        conditions: "India has diverse climates. Northern plains are extreme in summer and winter. South is tropical year-round. Coastal areas have monsoon Jun–Sep.",
        rain_days: 6, clothing: "Pack light cottons, one warm layer, and a compact umbrella" },
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

  const start = new Date(startDate);
  const end   = new Date(endDate);
  const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  return {
    destination,
    travel_dates: { start: startDate, end: endDate, duration_days: durationDays },
    season: climateData.season,
    temperature: {
      average_low_celsius:    climateData.temp_low,
      average_high_celsius:   climateData.temp_high,
      average_low_fahrenheit:  Math.round(climateData.temp_low  * 9 / 5 + 32),
      average_high_fahrenheit: Math.round(climateData.temp_high * 9 / 5 + 32),
    },
    conditions: climateData.conditions,
    expected_rain_days: Math.round(climateData.rain_days * durationDays / 30),
    what_to_wear: climateData.clothing,
    outdoor_activity_suitability: climateData.rain_days <= 4 ? "Excellent" : climateData.rain_days <= 12 ? "Good" : "Fair — plan indoor alternatives for rainy spells",
    data_source: "ChaiNashta Weather Tool v2.0",
  };
}

function calculateBudgetBreakdown(destination, totalBudget, durationDays, budgetTier) {
  const dest = destination.toLowerCase();

  // India is very affordable vs USD. Multipliers relative to NYC baseline (1.0).
  // ₹83 = $1 USD approx. India costs are 15–25x cheaper than NYC for most things.
  const costMultipliers = {
    mumbai:    0.18,
    delhi:     0.15,
    bangalore: 0.17,
    goa:       0.20,  // slightly higher due to tourism premium
    jaipur:    0.13,
    varanasi:  0.10,
    kolkata:   0.12,
    hyderabad: 0.14,
    chennai:   0.15,
    pune:      0.16,
    default:   0.14,
  };

  let multiplier = costMultipliers.default;
  for (const [key, val] of Object.entries(costMultipliers)) {
    if (dest.includes(key)) { multiplier = val; break; }
  }

  // Base daily costs (USD, NYC baseline)
  const baseCosts = {
    budget:     { accommodation: 40,  food: 25,  transport: 10, activities: 15 },
    "mid-range":{ accommodation: 120, food: 60,  transport: 20, activities: 40 },
    luxury:     { accommodation: 350, food: 150, transport: 60, activities: 100 },
  };

  const base = baseCosts[budgetTier] || baseCosts["mid-range"];

  const dailyCosts = {
    accommodation: Math.round(base.accommodation * multiplier),
    food:          Math.round(base.food          * multiplier),
    transport:     Math.round(base.transport     * multiplier),
    activities:    Math.round(base.activities    * multiplier),
  };

  const dailyTotal    = Object.values(dailyCosts).reduce((a, b) => a + b, 0);
  const tripTotal     = dailyTotal * durationDays;
  const flightEst     = Math.round(totalBudget * 0.20); // domestic flights ~20% of budget
  const nonFlightBudget = totalBudget - flightEst;
  const dailyAvailable  = Math.round(nonFlightBudget / durationDays);

  const inrNote = `(approx. ₹${Math.round(dailyTotal * 83).toLocaleString("en-IN")}/day in Indian Rupees)`;

  const foodTips = {
    budget:     "Eat at local dhabas and street stalls — best food in India is cheapest. Chai costs ₹10-20, a full thali ₹80-150.",
    "mid-range":"Mix restaurant meals with strategic street food. A sit-down regional meal at a good local restaurant is ₹300-600.",
    luxury:     "India's luxury dining is exceptional value vs global standards. Heritage hotel restaurants, rooftop dining, and chef's table experiences are ₹1500-4000 per person.",
  };

  return {
    destination,
    duration_days: durationDays,
    total_budget: totalBudget,
    budget_tier: budgetTier,
    estimated_flight_cost: flightEst,
    remaining_after_flights: nonFlightBudget,
    recommended_daily_budget: dailyAvailable,
    estimated_daily_costs: dailyCosts,
    estimated_daily_total: dailyTotal,
    inr_equivalent: inrNote,
    estimated_total_cost: tripTotal,
    budget_assessment: tripTotal <= nonFlightBudget
      ? `Budget is very comfortable for India. You have ~$${nonFlightBudget - tripTotal} buffer after flights.`
      : `Budget is workable. India is affordable — prioritise food experiences over premium accommodation.`,
    money_saving_tips: [
      "Street food and dhabas offer India's most authentic and cheapest meals — never skip them",
      "Use Ola/Uber instead of negotiating with auto-rickshaws for fair pricing",
      "Book heritage guesthouses (havelis) instead of chain hotels — more character, same price",
      "Visit monuments early morning for free photography light and thinner crowds",
      foodTips[budgetTier] || foodTips["mid-range"],
    ],
    data_source: "ChaiNashta Budget Calculator v2.0",
  };
}

// -----------------------------------------------------------------------------
// PART 3: Tool dispatcher
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
