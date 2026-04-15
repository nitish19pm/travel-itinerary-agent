// =============================================================================
// agent.js — The AI Agent Loop (Groq / Llama version)
//
// LEARNING NOTE — THIS IS THE MOST IMPORTANT FILE IN THE PROJECT
//
// This file implements the universal agentic AI pattern:
//
//   1. Send user request + tool definitions to the model
//   2. Model responds: either with tool calls or a final answer
//   3. If tool calls → execute them, add results to message history, go to step 1
//   4. If final answer → extract the result and return it
//
// Groq uses the OpenAI-compatible API format:
//   - Tools defined as { type: "function", function: { name, description, parameters } }
//   - Tool calls come back in message.tool_calls[]
//   - Results go back as role: "tool" messages
// =============================================================================

import Groq from "groq-sdk";
import { TOOL_DEFINITIONS, executeTool } from "./tools.js";
import { SYSTEM_PROMPT, SYNTHESIS_PROMPT, buildUserPrompt } from "./prompts.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Maximum number of agent loop iterations (safety guard against infinite loops)
const MAX_ITERATIONS = 10;

// Convert our tool definitions to OpenAI/Groq format
const GROQ_TOOLS = TOOL_DEFINITIONS.map((t) => ({
  type: "function",
  function: {
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  },
}));

// -----------------------------------------------------------------------------
// runTravelAgent — the main agent function
//
// Parameters:
//   preferences  — user's travel preferences from the form
//   onProgress   — callback called at each agent step
//
// Returns: parsed itinerary JSON object
// -----------------------------------------------------------------------------
export async function runTravelAgent(preferences, onProgress) {
  const userMessage = buildUserPrompt(preferences);

  // Message history — appended to throughout the agent loop
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user",   content: userMessage },
  ];

  onProgress({
    step: "start",
    message: `Starting travel agent for ${preferences.destination}...`,
  });

  let iteration = 0;

  // ============================================================
  // THE AGENT LOOP — runs until the model stops calling tools
  // ============================================================
  while (iteration < MAX_ITERATIONS) {
    iteration++;

    onProgress({
      step: "thinking",
      message: iteration === 1
        ? "Agent is analyzing your preferences..."
        : "Agent is reasoning with tool results...",
    });

    // ----------------------------------------------------------
    // Call the model with current message history + tools
    // ----------------------------------------------------------
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      tools: GROQ_TOOLS,
      tool_choice: "auto",
      max_tokens: 8192,
      temperature: 0.7,
    });

    const message = response.choices[0].message;

    // Add the model's response to history
    messages.push(message);

    // ----------------------------------------------------------
    // Check if the model wants to call tools
    // ----------------------------------------------------------
    if (message.tool_calls?.length) {
      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;
        const toolInput = JSON.parse(toolCall.function.arguments);

        onProgress({
          step: "tool_call",
          message: getToolProgressMessage(toolName, toolInput),
          tool: toolName,
          input: toolInput,
        });

        try {
          const result = await executeTool(toolName, toolInput);

          onProgress({ step: "tool_result", message: `Got ${toolName} data`, tool: toolName });

          // Add tool result to history as a "tool" role message
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        } catch (err) {
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: err.message }),
          });
        }
      }

      // Continue the loop — model will reason with the tool results
      continue;
    }

    // ----------------------------------------------------------
    // No tool calls → all tools have been called.
    // PHASE 2: Make a separate call with the synthesis prompt + schema
    // (no tools this time) to generate the final structured JSON.
    // This keeps the tool-calling phase short and focused, which
    // significantly improves Llama's tool-call reliability.
    // ----------------------------------------------------------
    onProgress({ step: "thinking", message: "Building your itinerary..." });

    // Build synthesis messages: replace system prompt with the full schema prompt,
    // keep all the tool results in history so the model has all research data
    const synthesisMessages = [
      { role: "system", content: SYNTHESIS_PROMPT },
      ...messages.slice(1), // drop original system prompt, keep user msg + tool results
      { role: "user", content: "Now write the complete itinerary JSON using all the research above." },
    ];

    const synthesisResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: synthesisMessages,
      // No tools in synthesis phase — just JSON generation
      max_tokens: 8192,
      temperature: 0.3, // lower temp for more reliable JSON
    });

    onProgress({ step: "complete", message: "Itinerary generated successfully!" });

    const text = synthesisResponse.choices[0].message.content;
    if (!text) throw new Error("No text in model synthesis response");
    return extractItinerary(text);
  }

  throw new Error(`Agent exceeded maximum iterations (${MAX_ITERATIONS}). Something went wrong.`);
}

// -----------------------------------------------------------------------------
// extractItinerary — parses the model's final text response into JSON
// -----------------------------------------------------------------------------
function extractItinerary(text) {
  let clean = text.trim();

  // Strip markdown code fences if the model included them
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }

  try {
    return JSON.parse(clean);
  } catch {
    // Try to extract a JSON object from within surrounding text
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Could not parse itinerary JSON from model response");
  }
}

// -----------------------------------------------------------------------------
// getToolProgressMessage — human-friendly messages shown during tool calls
// -----------------------------------------------------------------------------
function getToolProgressMessage(toolName, input) {
  switch (toolName) {
    case "get_destination_info":
      return `Researching ${input.destination}...`;
    case "get_weather_forecast":
      return `Checking weather for ${input.destination} (${input.start_date} to ${input.end_date})...`;
    case "calculate_budget_breakdown":
      return `Calculating budget breakdown for ${input.duration_days} days in ${input.destination}...`;
    default:
      return `Running tool: ${toolName}...`;
  }
}
