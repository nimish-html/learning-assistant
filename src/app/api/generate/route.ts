import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { GeneratePayloadSchema } from '@/lib/schema';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // The useCompletion hook sends data in the body, not as a prompt
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
          headers: { 'Content-Type': 'application/json' } 
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

    // Create XAI provider
    const xai = createOpenAI({
      baseURL: 'https://api.x.ai/v1',
      apiKey: process.env.XAI_API_KEY,
    });

    // Stream the question generation
    const result = await streamText({
      model: xai('grok-4-0709'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    // Return **text** stream so the frontend can parse plain JSON easily
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Generate API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Something went wrong. Please retry.'
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
} 