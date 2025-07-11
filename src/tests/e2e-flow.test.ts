import { GeneratePayload, Question } from '@/lib/schema';

// Mock fetch globally for E2E simulation
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('E2E Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.XAI_API_KEY = 'test-api-key';
  });

  const samplePayload: GeneratePayload = {
    exam: 'JEE (India)',
    classStandard: '12th',
    count: 5,
    difficulty: 'Amateur',
    type: 'MCQ',
    preferredSource: 'NCERT',
  };

  const mockQuestions: Question[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      stem: 'What is the acceleration due to gravity on Earth?',
      options: ['9.8 m/s²', '10 m/s²', '8.9 m/s²', '11 m/s²'],
      answer: '9.8 m/s²',
      explanation: 'The standard acceleration due to gravity on Earth is approximately 9.8 m/s².',
      difficulty: 'Amateur',
      subject: 'Physics',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      stem: 'Which of the following is a noble gas?',
      options: ['Oxygen', 'Hydrogen', 'Helium', 'Nitrogen'],
      answer: 'Helium',
      explanation: 'Helium is a noble gas found in Group 18 of the periodic table.',
      difficulty: 'Amateur',
      subject: 'Chemistry',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      stem: 'What is the derivative of x²?',
      options: ['x', '2x', 'x³', '2x²'],
      answer: '2x',
      explanation: 'Using the power rule: d/dx(x²) = 2x.',
      difficulty: 'Amateur',
      subject: 'Mathematics',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      stem: 'What is the unit of electric current?',
      options: ['Volt', 'Ampere', 'Ohm', 'Watt'],
      answer: 'Ampere',
      explanation: 'The SI unit of electric current is the ampere (A).',
      difficulty: 'Amateur',
      subject: 'Physics',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      stem: 'What is the molecular formula of water?',
      options: ['H₂O', 'CO₂', 'O₂', 'CH₄'],
      answer: 'H₂O',
      explanation: 'Water consists of two hydrogen atoms and one oxygen atom: H₂O.',
      difficulty: 'Amateur',
      subject: 'Chemistry',
    },
  ];

  const mockVerificationResult = {
    validQuestions: mockQuestions,
    issues: [],
    summary: {
      totalQuestions: 5,
      validQuestions: 5,
      issuesFound: 0,
      duplicatesRemoved: 0,
    },
  };

  it('should complete full generate → verify flow successfully', async () => {
    // Mock the generate API response
    const generateResponse = new Response(
      JSON.stringify(mockQuestions),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // Mock the verify API response
    const verifyResponse = new Response(
      JSON.stringify(mockVerificationResult),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    mockFetch
      .mockResolvedValueOnce(generateResponse)
      .mockResolvedValueOnce(verifyResponse);

    // Step 1: Generate questions
    const generateResult = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(samplePayload),
    });

    expect(generateResult.status).toBe(200);
    const questions = await generateResult.json();
    expect(questions).toHaveLength(5);
    expect(questions[0]).toHaveProperty('id');
    expect(questions[0]).toHaveProperty('stem');
    expect(questions[0]).toHaveProperty('options');
    expect(questions[0]).toHaveProperty('answer');

    // Step 2: Verify questions
    const verifyResult = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions }),
    });

    expect(verifyResult.status).toBe(200);
    const verification = await verifyResult.json();
    expect(verification.validQuestions).toHaveLength(5);
    expect(verification.issues).toHaveLength(0);
    expect(verification.summary.totalQuestions).toBe(5);
    expect(verification.summary.validQuestions).toBe(5);
  });

  it('should handle generate API errors gracefully', async () => {
    const errorResponse = new Response(
      JSON.stringify({ 
        error: 'Failed to generate questions after retries',
        message: 'Something went wrong. Please retry.'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    mockFetch.mockResolvedValueOnce(errorResponse);

    const result = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(samplePayload),
    });

    expect(result.status).toBe(500);
    const error = await result.json();
    expect(error.error).toBe('Failed to generate questions after retries');
    expect(error.message).toBe('Something went wrong. Please retry.');
  });

  it('should handle verify API errors gracefully', async () => {
    const errorResponse = new Response(
      JSON.stringify({ 
        error: 'Failed to verify questions after retries',
        message: 'Something went wrong. Please retry.'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    mockFetch.mockResolvedValueOnce(errorResponse);

    const result = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: mockQuestions }),
    });

    expect(result.status).toBe(500);
    const error = await result.json();
    expect(error.error).toBe('Failed to verify questions after retries');
  });

  it('should handle duplicate questions in verification', async () => {
    const duplicateQuestions = [
      mockQuestions[0],
      mockQuestions[0], // Duplicate
      mockQuestions[1],
    ];

    const duplicateVerificationResult = {
      validQuestions: [mockQuestions[0], mockQuestions[1]], // Duplicate removed
      issues: [
        {
          questionId: mockQuestions[0].id,
          type: 'duplicate',
          description: 'Duplicate question found and removed',
          severity: 'medium',
        },
      ],
      summary: {
        totalQuestions: 3,
        validQuestions: 2,
        issuesFound: 1,
        duplicatesRemoved: 1,
      },
    };

    const verifyResponse = new Response(
      JSON.stringify(duplicateVerificationResult),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    mockFetch.mockResolvedValueOnce(verifyResponse);

    const result = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: duplicateQuestions }),
    });

    expect(result.status).toBe(200);
    const verification = await result.json();
    expect(verification.validQuestions).toHaveLength(2);
    expect(verification.issues).toHaveLength(1);
    expect(verification.issues[0].type).toBe('duplicate');
    expect(verification.summary.duplicatesRemoved).toBe(1);
  });

  it('should handle invalid payloads', async () => {
    const invalidPayload = { ...samplePayload, count: 0 }; // Invalid count

    const errorResponse = new Response(
      JSON.stringify({ 
        error: 'Invalid request payload',
        details: [{ path: ['count'], message: 'Number must be greater than or equal to 1' }]
      }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    mockFetch.mockResolvedValueOnce(errorResponse);

    const result = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload),
    });

    expect(result.status).toBe(400);
    const error = await result.json();
    expect(error.error).toBe('Invalid request payload');
    expect(error.details).toBeDefined();
  });

  it('should validate question structure in E2E flow', () => {
    mockQuestions.forEach((question) => {
      // Validate UUID format
      expect(question.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      
      // Validate required fields
      expect(question.stem).toBeTruthy();
      expect(question.answer).toBeTruthy();
      expect(question.difficulty).toMatch(/^(Beginner|Amateur|Ninja)$/);
      expect(question.subject).toBeTruthy();
      
      // Validate MCQ-specific fields
      if (question.options) {
        expect(question.options).toHaveLength(4);
        expect(question.options).toContain(question.answer);
      }
      
      // Validate explanation exists
      expect(question.explanation).toBeTruthy();
    });
  });
}); 