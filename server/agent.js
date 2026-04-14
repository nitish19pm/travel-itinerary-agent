// =============================================================================
// agent.js — The AI Agent Loop (Google Gemini version)
//
// LEARNING NOTE — THIS IS THE MOST IMPORTANT FILE IN THE PROJECT
//
// This file implements the universal agentic AI pattern:
//
//   1. Send user request + tool definitions to Gemini
//   2. Gemini responds: either with tool calls or a final answer
//   3. If tool calls → execute them, add results to chat history, go to step 1
//   4. If final answer → extract the result and return it
//
// Gemini uses a "chat session" model — history is managed by the SDK.
// Tool calls come back as "functionCall" parts; results go back as
// "functionResponse" parts. The loop pattern is identical to other LLMs.
// =============================================================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import { TOOL_DEFINITIONS, executeTool } from "./tools.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Maximum number of agent loop iterations (safety guard against infinite loops)
const MAX_ITERATIONS = 10;

// -----------------------------------------------------------------------------
// runTravelAgent — the main agent function
//
// Parameters:
//   preferences  — user's travel preferences from the form
//   onProgress   — callback called at each agent step, streams to frontend via SSE
//
// Returns: parsed itinerary JSON object
// -----------------------------------------------------------------------------
export async function runTravelAgent(preferences, onProgress) {
  // Initialise the Gemini model with tool definitions
  // Gemini wraps function declarations inside a "tools" array
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations: TOOL_DEFINITIONS }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  });

  // Start a chat session — Gemini manages conversation history internally
  const chat = model.startChat();

  const userMessage = buildUserPrompt(preferences);

  onProgress({
    step: "start",
    message: `Starting travel agent for ${preferences.destination}...`,
  });

  // Send the first user message to kick off the agent
  let response = await chat.sendMessage(userMessage);

  let iteration = 0;

  // ============================================================
  // THE AGENT LOOP — runs until Gemini stops calling tools
  // ============================================================
  while (iteration < MAX_ITERATIONS) {
    iteration++;

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No response candidate from Gemini");

    const parts = candidate.content?.parts ?? [];

    // Collect any function call parts in this response
    const functionCalls = parts.filter((p) => p.functionCall);

    // ----------------------------------------------------------
    // If no function calls → Gemini is done, extract the answer
    // ----------------------------------------------------------
    if (functionCalls.length === 0) {
      onProgress({ step: "complete", message: "Itinerary generated successfully!" });

      const textPart = parts.find((p) => p.text);
      if (!textPart) throw new Error("No text in Gemini final response");
      return extractItinerary(textPart.text);
    }

    // ----------------------------------------------------------
    // Gemini wants to call tools — execute each one and return results
    // ----------------------------------------------------------
    onProgress({
      step: "thinking",
      message: iteration === 1
        ? "Agent is analyzing your preferences..."
        : "Agent is reasoning with tool results...",
    });

    const functionResponses = [];

    for (const part of functionCalls) {
      const { name, args } = part.functionCall;

      onProgress({
        step: "tool_call",
        message: getToolProgressMessage(name, args),
        tool: name,
        input: args,
      });

      try {
        const result = await executeTool(name, args);

        onProgress({ step: "tool_result", message: `Got ${name} data`, tool: name });

        // Gemini expects tool results as "functionResponse" parts
        functionResponses.push({
          functionResponse: {
            name,
            response: { result },
          },
        });
      } catch (err) {
        functionResponses.push({
          functionResponse: {
            name,
            response: { error: err.message },
          },
        });
      }
    }

    // Send all tool results back to Gemini in one message — loop continues
    response = await chat.sendMessage(functionResponses);
  }

  throw new Error(`Agent exceeded maximum iterations (${MAX_ITERATIONS}). Something went wrong.`);
}

// -----------------------------------------------------------------------------
// extractItinerary — parses Gemini's final text response into a JSON object
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
