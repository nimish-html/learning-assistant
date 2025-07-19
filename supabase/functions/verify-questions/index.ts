import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { streamText } from 'npm:ai';
import { createOpenAI } from 'npm:@ai-sdk/openai';

// Define the schemas inline since we can't import from src/lib
import { z } from 'npm:zod';

// Question schema for generated questions
const QuestionSchema = z.object({
  id: z.string().uuid(),
  stem: z.string().min(1, 'Question stem cannot be empty'),
  options: z.array(z.string()).min(2).max(6).optional(),
  answer: z.string(),
  explanation: z.string().optional(),
  difficulty: z.enum(['Beginner', 'Amateur', 'Ninja']),
  subject: z.string(),
});

// Verify payload schema
const VerifyPayloadSchema = z.object({
  questions: z.array(QuestionSchema),
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
    const parseResult = VerifyPayloadSchema.safeParse(body);
    
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

    const { questions } = parseResult.data;

    // Create the system prompt for verification
    const systemPrompt = `You are an expert question validator for competitive exams. You must return results in valid JSON format only.

Check each question for:
1. Duplicate questions (same or very similar stem/content)
2. Syllabus mismatch (inappropriate for the stated exam/difficulty)
3. Answer key errors (for MCQ: answer not in options, for Subjective: unclear/incorrect answers)
4. Format issues (missing required fields, invalid structure)

Return ONLY a valid JSON object with this exact structure:
{
  "validQuestions": [array of valid questions],
  "issues": [
    {
      "questionId": "uuid",
      "type": "duplicate|syllabus|answer_key|format",
      "description": "specific issue description",
      "severity": "high|medium|low"
    }
  ],
  "summary": {
    "totalQuestions": number,
    "validQuestions": number,
    "issuesFound": number,
    "duplicatesRemoved": number
  }
}

Return ONLY valid JSON. No additional text or markdown formatting.`;

    // Create the user prompt with questions to verify
    const userPrompt = `Verify the following ${questions.length} questions:

${JSON.stringify(questions, null, 2)}

Please check for:
- Duplicate questions (identify questions with same/similar content)
- Answer key validation (ensure answers are correct and available in options for MCQ)
- Syllabus appropriateness 
- Format compliance

Return the verification results in the specified JSON format.`;

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

    // Stream the verification
    const result = await streamText({
      model: xai('grok-4-0709'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.1, // Lower temperature for more consistent verification
    });

    // Collect the full streamed response
    let fullText = '';
    for await (const chunk of result.textStream) {
      fullText += chunk;
    }

    // Clean up the response like we do in the frontend
    let cleanedText = fullText.trim();
    
    // Strip AI markdown fences
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    // Return the cleaned JSON response with CORS headers
    return new Response(cleanedText, {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Verify Edge Function error:', error);
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