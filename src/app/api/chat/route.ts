import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Create XAI provider
  const xai = createOpenAI({
    baseURL: 'https://api.x.ai/v1',
    apiKey: process.env.XAI_API_KEY,
  });

  const result = await streamText({
    model: xai('grok-4-0709'),
    messages,
  });

  return result.toDataStreamResponse();
} 