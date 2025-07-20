import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { streamText } from 'npm:ai';
import { createOpenAI } from 'npm:@ai-sdk/openai';
import { z } from 'npm:zod';

// Define the schema for chat messages
const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

const ChatPayloadSchema = z.object({
  messages: z.array(MessageSchema),
});

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }

  try {
    const body = await req.json();
    
    // Parse and validate the request body
    const parseResult = ChatPayloadSchema.safeParse(body);
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request payload', 
          details: parseResult.error.errors 
        }), 
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    const { messages } = parseResult.data;

    // Get XAI API key from environment
    const xaiApiKey = Deno.env.get('XAI_API_KEY');
    if (!xaiApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'XAI API key not configured' 
        }), 
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    // Create XAI provider
    const xai = createOpenAI({
      baseURL: 'https://api.x.ai/v1',
      apiKey: xaiApiKey,
    });

    // Stream the chat response
    const result = await streamText({
      model: xai('grok-4-0709'),
      messages,
    });

    // Return data stream response with CORS headers
    const response = result.toDataStreamResponse();
    
    // Add CORS headers to the streaming response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    console.error('Chat Stream Edge Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Something went wrong. Please retry.'
      }), 
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
});