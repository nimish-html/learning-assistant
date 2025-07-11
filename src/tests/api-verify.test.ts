import { POST } from '@/app/api/verify/route';
import { Question } from '@/lib/schema';

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

describe('/api/verify Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.XAI_API_KEY = 'test-api-key';
  });

  const sampleQuestions: Question[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      stem: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      answer: 'Paris',
      explanation: 'Paris is the capital city of France.',
      difficulty: 'Beginner',
      subject: 'Geography',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      stem: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      answer: '4',
      explanation: 'Basic arithmetic: 2 + 2 = 4.',
      difficulty: 'Beginner',
      subject: 'Mathematics',
    },
  ];

  const validPayload = { questions: sampleQuestions };

  it('should handle valid verification request and return streaming response', async () => {
    const mockStreamResult = {
      toDataStreamResponse: jest.fn(() => new Response('mock verification stream')),
    };
    
    streamText.mockResolvedValue(mockStreamResult);
    createOpenAI.mockReturnValue(() => ({ modelId: 'grok-4-0709' }));

    const request = new Request('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);

    expect(response).toBeInstanceOf(Response);
    expect(streamText).toHaveBeenCalledTimes(1);
    expect(mockStreamResult.toDataStreamResponse).toHaveBeenCalled();
  });

  it('should return 400 for invalid payload structure', async () => {
    const invalidPayload = { questions: 'not an array' };

    const request = new Request('http://localhost:3000/api/verify', {
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

  it('should return 400 for questions with invalid structure', async () => {
    const invalidQuestions = [
      {
        id: 'invalid-uuid',
        stem: 'Test question',
        answer: 'Test answer',
        difficulty: 'Beginner',
        subject: 'Test',
      },
    ];

    const request = new Request('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: invalidQuestions }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData.error).toBe('Invalid request payload');
  });

  it('should handle empty questions array', async () => {
    const mockStreamResult = {
      toDataStreamResponse: jest.fn(() => new Response('empty verification')),
    };
    
    streamText.mockResolvedValue(mockStreamResult);

    const request = new Request('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: [] }),
    });

    const response = await POST(request);

    expect(response).toBeInstanceOf(Response);
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('Verify the following 0 questions'),
      })
    );
  });

  it('should handle AI service errors with retry logic', async () => {
    streamText
      .mockRejectedValueOnce(new Error('Verification API Error'))
      .mockResolvedValueOnce({
        toDataStreamResponse: jest.fn(() => new Response('success after retry')),
      });

    const request = new Request('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);

    expect(streamText).toHaveBeenCalledTimes(2); // Initial call + 1 retry
    expect(response).toBeInstanceOf(Response);
  });

  it('should return 500 after max retry attempts', async () => {
    streamText.mockRejectedValue(new Error('Persistent Verification Error'));

    const request = new Request('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(streamText).toHaveBeenCalledTimes(2); // Initial + 1 retry
    
    const responseData = await response.json();
    expect(responseData.error).toBe('Failed to verify questions after retries');
  });

  it('should include correct verification prompts', async () => {
    const mockStreamResult = {
      toDataStreamResponse: jest.fn(() => new Response('mock stream')),
    };
    
    streamText.mockResolvedValue(mockStreamResult);

    const request = new Request('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    await POST(request);

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining('expert question validator'),
        prompt: expect.stringContaining('Verify the following 2 questions'),
        temperature: 0.1, // Lower temperature for verification
        maxSteps: 3,
      })
    );
  });

  it('should handle malformed JSON request', async () => {
    const request = new Request('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    const responseData = await response.json();
    expect(responseData.error).toBe('Internal server error');
  });
}); 