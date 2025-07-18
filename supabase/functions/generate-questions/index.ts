import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { streamText } from 'npm:ai';
import { createOpenAI } from 'npm:@ai-sdk/openai';

// Define the GeneratePayloadSchema inline since we can't import from src/lib
import { z } from 'npm:zod';

const OutputFormatSchema = z.enum([
  'solved-examples',
  'assignment-format', 
  'separate-documents'
]);

const GeneratePayloadSchema = z.object({
  exam: z.string().min(1, 'Exam selection is required'),
  classStandard: z.enum(['11th', '12th']),
  count: z.number().min(1).max(50),
  difficulty: z.enum(['Beginner', 'Amateur', 'Ninja']),
  type: z.enum(['MCQ', 'Subjective']),
  preferredSource: z.string().optional(),
  outputFormat: OutputFormatSchema.default('solved-examples'),
});

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
    const parseResult = GeneratePayloadSchema.safeParse(body);
    
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

    const payload = parseResult.data;

    // Create the system prompt
    const systemPrompt = `You are an expert question generator for competitive exams. You MUST respond with ONLY valid JSON - no explanations, no markdown, no additional text.

CRITICAL: Your response must be ONLY a JSON array. Do not include any explanations, reasoning, or text outside the JSON.

For each question, use this exact JSON structure:
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "stem": "question text here",
  "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
  "answer": "A. option1",
  "explanation": "detailed explanation of why this is correct",
  "difficulty": "Beginner",
  "subject": "Mathematics"
}

Example response format:
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "stem": "What is 2 + 2?",
    "options": ["A. 3", "B. 4", "C. 5", "D. 6"],
    "answer": "B. 4",
    "explanation": "Basic addition: 2 + 2 equals 4.",
    "difficulty": "Beginner",
    "subject": "Mathematics"
  }
]

RESPOND WITH ONLY THE JSON ARRAY. NO OTHER TEXT.`;

    // Create the user prompt
    const userPrompt = `Generate ${payload.count} ${payload.type} questions for ${payload.exam} exam, ${payload.classStandard} standard, at ${payload.difficulty} difficulty level.

Requirements:
- Generate unique UUIDs for each question
- For MCQ: provide exactly 4 options (A, B, C, D format)
- For Subjective: provide detailed answer and explanation  
- Appropriate for ${payload.exam} syllabus
- Difficulty: ${payload.difficulty}
${payload.preferredSource ? `- Topic focus: ${payload.preferredSource}` : ''}

Return ONLY the JSON array with ${payload.count} questions.`;

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

    // Stream the question generation
    const result = await streamText({
      model: xai('grok-4-0709'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    // Return text stream response with CORS headers
    const response = result.toTextStreamResponse();
    
    // Add CORS headers to the streaming response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    console.error('Generate Edge Function error:', error);
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