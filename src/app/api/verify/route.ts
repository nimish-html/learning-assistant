import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { VerifyPayloadSchema, Question } from '@/lib/schema';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
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
          headers: { 'Content-Type': 'application/json' } 
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

    // Create XAI provider
    const xai = createOpenAI({
      baseURL: 'https://api.x.ai/v1',
      apiKey: process.env.XAI_API_KEY,
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

    // Return the cleaned JSON response
    return new Response(cleanedText, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Verify API error:', error);
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