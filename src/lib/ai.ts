import { xai } from "@ai-sdk/xai";
import { createOpenAI } from "@ai-sdk/openai";

// X-AI runtime ➜ Grok
export const grok = xai("grok-4-0709");

// Native OpenAI runtime
const openai = createOpenAI();
export const o3     = openai("o3");
export const gpt41  = openai("gpt-4.1");

// Helper alias → returns the right runtime at runtime
export function pickModel(id: "grok-4-0709" | "o3" | "gpt-4.1") {
  switch (id) {
    case "o3":        return o3;
    case "gpt-4.1":   return gpt41;
    default:           return grok;
  }
}
