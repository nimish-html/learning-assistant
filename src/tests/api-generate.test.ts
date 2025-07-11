import { POST } from '@/app/api/generate/route';
import { GeneratePayload } from '@/lib/schema';

// Mock the AI SDK
jest.mock('ai', () => ({
  streamText: jest.fn(),
}));

jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(() => ({
    __call: jest.fn(),
  })),
}));

const { streamText } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');

describe('/api/generate Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.XAI_API_KEY = 'test-api-key';
  });

  const validPayload: GeneratePayload = {
    exam: 'JEE (India)',
    classStandard: '12th',
    count: 3,
    difficulty: 'Amateur',
    type: 'MCQ',
    preferredSource: 'NCERT',
  };

  it('should handle valid request and return streaming response', async () => {
    const mockStreamResult = {
      toTextStreamResponse: jest.fn(() => new Response('mock stream')),
    };
    
    streamText.mockResolvedValue(mockStreamResult);
    createOpenAI.mockReturnValue(() => ({ modelId: 'grok-4-0709' }));

    const request = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);

    expect(response).toBeInstanceOf(Response);
    expect(streamText).toHaveBeenCalledTimes(1);
    expect(mockStreamResult.toTextStreamResponse).toHaveBeenCalled();
  });

  it('should return 400 for invalid payload', async () => {
    const invalidPayload = { ...validPayload, count: 0 }; // Invalid count

    const request = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData.error).toBe('Invalid request payload');
    expect(responseData.details).toBeDefined();
  });

  it('should return 400 for missing required fields', async () => {
    const invalidPayload = { ...validPayload };
    delete (invalidPayload as any).exam;

    const request = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData.error).toBe('Invalid request payload');
  });

  it('should handle AI service errors', async () => {
    streamText.mockRejectedValue(new Error('API Error'));

    const request = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);

    expect(streamText).toHaveBeenCalledTimes(1);
    expect(response).toBeInstanceOf(Response);
    expect(response!.status).toBe(500);
    
    const responseData = await response!.json();
    expect(responseData.error).toBe('Internal server error');
  });

  it('should handle malformed JSON request', async () => {
    const request = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    const response = await POST(request);

    expect(response).toBeInstanceOf(Response);
    expect(response!.status).toBe(500);
    const responseData = await response!.json();
    expect(responseData.error).toBe('Internal server error');
  });

  it('should include correct prompts in streamText call', async () => {
    const mockStreamResult = {
      toTextStreamResponse: jest.fn(() => new Response('mock stream')),
    };
    
    streamText.mockResolvedValue(mockStreamResult);

    const request = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    await POST(request);

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining('expert question generator'),
        prompt: expect.stringContaining('Generate 3 MCQ questions'),
        temperature: 0.7,
      })
    );
  });
}); 