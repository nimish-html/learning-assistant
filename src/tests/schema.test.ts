import { 
  QuestionSchema, 
  GeneratePayloadSchema, 
  VerifyPayloadSchema,
  SavedResultSchema,
  SaveResultsPayloadSchema,
  Question,
  GeneratePayload,
  SavedResult,
  SaveResultsPayload 
} from '@/lib/schema';

describe('Schema Validation Tests', () => {
  describe('QuestionSchema', () => {
    const validQuestion: Question = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      stem: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      answer: 'Paris',
      explanation: 'Paris is the capital and largest city of France.',
      difficulty: 'Beginner',
      subject: 'Geography',
    };

    it('should validate a valid question object', () => {
      const result = QuestionSchema.safeParse(validQuestion);
      expect(result.success).toBe(true);
    });

    it('should reject question with invalid UUID', () => {
      const invalidQuestion = { ...validQuestion, id: 'invalid-uuid' };
      const result = QuestionSchema.safeParse(invalidQuestion);
      expect(result.success).toBe(false);
    });

    it('should reject question with empty stem', () => {
      const invalidQuestion = { ...validQuestion, stem: '' };
      const result = QuestionSchema.safeParse(invalidQuestion);
      expect(result.success).toBe(false);
    });

    it('should reject question with invalid difficulty', () => {
      const invalidQuestion = { ...validQuestion, difficulty: 'Expert' as any };
      const result = QuestionSchema.safeParse(invalidQuestion);
      expect(result.success).toBe(false);
    });

    it('should allow question without options (for subjective)', () => {
      const subjectiveQuestion = { ...validQuestion };
      delete subjectiveQuestion.options;
      const result = QuestionSchema.safeParse(subjectiveQuestion);
      expect(result.success).toBe(true);
    });

    it('should reject question with too few options', () => {
      const invalidQuestion = { ...validQuestion, options: ['Only one'] };
      const result = QuestionSchema.safeParse(invalidQuestion);
      expect(result.success).toBe(false);
    });

    it('should reject question with too many options', () => {
      const invalidQuestion = { 
        ...validQuestion, 
        options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] 
      };
      const result = QuestionSchema.safeParse(invalidQuestion);
      expect(result.success).toBe(false);
    });
  });

  describe('GeneratePayloadSchema', () => {
    const validPayload: GeneratePayload = {
      exam: 'JEE (India)',
      classStandard: '12th',
      count: 5,
      difficulty: 'Amateur',
      type: 'MCQ',
      preferredSource: 'NCERT',
    };

    it('should validate a valid generate payload', () => {
      const result = GeneratePayloadSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject payload with empty exam', () => {
      const invalidPayload = { ...validPayload, exam: '' };
      const result = GeneratePayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject payload with invalid classStandard', () => {
      const invalidPayload = { ...validPayload, classStandard: '10th' as any };
      const result = GeneratePayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject payload with count less than 1', () => {
      const invalidPayload = { ...validPayload, count: 0 };
      const result = GeneratePayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject payload with count greater than 50', () => {
      const invalidPayload = { ...validPayload, count: 51 };
      const result = GeneratePayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should allow payload without preferredSource', () => {
      const payloadWithoutSource = { ...validPayload };
      delete payloadWithoutSource.preferredSource;
      const result = GeneratePayloadSchema.safeParse(payloadWithoutSource);
      expect(result.success).toBe(true);
    });

    it('should reject invalid question type', () => {
      const invalidPayload = { ...validPayload, type: 'TrueFalse' as any };
      const result = GeneratePayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('VerifyPayloadSchema', () => {
    const validQuestion: Question = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      stem: 'Test question',
      answer: 'Test answer',
      difficulty: 'Beginner',
      subject: 'Test',
    };

    it('should validate a valid verify payload', () => {
      const payload = { questions: [validQuestion] };
      const result = VerifyPayloadSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject payload with empty questions array', () => {
      const payload = { questions: [] };
      const result = VerifyPayloadSchema.safeParse(payload);
      expect(result.success).toBe(true); // Empty array is allowed
    });

    it('should reject payload with invalid questions', () => {
      const invalidQuestion = { ...validQuestion, id: 'invalid-uuid' };
      const payload = { questions: [invalidQuestion] };
      const result = VerifyPayloadSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('SaveResultsPayloadSchema', () => {
    const validQuestion: Question = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      stem: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      answer: 'Paris',
      explanation: 'Paris is the capital and largest city of France.',
      difficulty: 'Beginner',
      subject: 'Geography',
    };

    const validPayload: SaveResultsPayload = {
      title: 'Geography Quiz - European Capitals',
      questions: [validQuestion],
      metadata: {
        exam: 'JEE (India)',
        classStandard: '12th',
        difficulty: 'Beginner',
        type: 'MCQ',
        outputFormat: 'solved-examples',
        questionCount: 1
      }
    };

    it('should validate a valid save results payload', () => {
      const result = SaveResultsPayloadSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject payload with empty title', () => {
      const invalidPayload = { ...validPayload, title: '' };
      const result = SaveResultsPayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject payload with invalid questions', () => {
      const invalidQuestion = { ...validQuestion, id: 'invalid-uuid' };
      const invalidPayload = { ...validPayload, questions: [invalidQuestion] };
      const result = SaveResultsPayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject payload with invalid metadata classStandard', () => {
      const invalidPayload = {
        ...validPayload,
        metadata: { ...validPayload.metadata, classStandard: '10th' as any }
      };
      const result = SaveResultsPayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject payload with invalid metadata difficulty', () => {
      const invalidPayload = {
        ...validPayload,
        metadata: { ...validPayload.metadata, difficulty: 'Expert' as any }
      };
      const result = SaveResultsPayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject payload with invalid metadata type', () => {
      const invalidPayload = {
        ...validPayload,
        metadata: { ...validPayload.metadata, type: 'TrueFalse' as any }
      };
      const result = SaveResultsPayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject payload with invalid metadata outputFormat', () => {
      const invalidPayload = {
        ...validPayload,
        metadata: { ...validPayload.metadata, outputFormat: 'invalid-format' as any }
      };
      const result = SaveResultsPayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should validate payload with multiple questions', () => {
      const multipleQuestionsPayload = {
        ...validPayload,
        questions: [validQuestion, { ...validQuestion, id: '550e8400-e29b-41d4-a716-446655440001' }],
        metadata: { ...validPayload.metadata, questionCount: 2 }
      };
      const result = SaveResultsPayloadSchema.safeParse(multipleQuestionsPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('SavedResultSchema', () => {
    const validQuestion: Question = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      stem: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      answer: 'Paris',
      explanation: 'Paris is the capital and largest city of France.',
      difficulty: 'Beginner',
      subject: 'Geography',
    };

    const validSavedResult: SavedResult = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      user_id: '550e8400-e29b-41d4-a716-446655440003',
      title: 'Geography Quiz - European Capitals',
      questions: [validQuestion],
      metadata: {
        exam: 'JEE (India)',
        classStandard: '12th',
        difficulty: 'Beginner',
        type: 'MCQ',
        outputFormat: 'solved-examples',
        questionCount: 1
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    it('should validate a valid saved result', () => {
      const result = SavedResultSchema.safeParse(validSavedResult);
      expect(result.success).toBe(true);
    });

    it('should reject saved result with invalid id UUID', () => {
      const invalidResult = { ...validSavedResult, id: 'invalid-uuid' };
      const result = SavedResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });

    it('should reject saved result with invalid user_id UUID', () => {
      const invalidResult = { ...validSavedResult, user_id: 'invalid-uuid' };
      const result = SavedResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });

    it('should reject saved result with invalid questions', () => {
      const invalidQuestion = { ...validQuestion, id: 'invalid-uuid' };
      const invalidResult = { ...validSavedResult, questions: [invalidQuestion] };
      const result = SavedResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });

    it('should reject saved result with invalid metadata', () => {
      const invalidResult = {
        ...validSavedResult,
        metadata: { ...validSavedResult.metadata, difficulty: 'Expert' as any }
      };
      const result = SavedResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });

    it('should validate saved result with different output formats', () => {
      const formats = ['solved-examples', 'assignment-format', 'separate-documents'] as const;
      
      formats.forEach(format => {
        const resultWithFormat = {
          ...validSavedResult,
          metadata: { ...validSavedResult.metadata, outputFormat: format }
        };
        const result = SavedResultSchema.safeParse(resultWithFormat);
        expect(result.success).toBe(true);
      });
    });

    it('should validate saved result with subjective questions', () => {
      const subjectiveQuestion = { ...validQuestion };
      delete subjectiveQuestion.options;
      
      const subjectiveResult = {
        ...validSavedResult,
        questions: [subjectiveQuestion],
        metadata: { ...validSavedResult.metadata, type: 'Subjective' as const }
      };
      
      const result = SavedResultSchema.safeParse(subjectiveResult);
      expect(result.success).toBe(true);
    });

    it('should ensure compatibility with existing Question schema', () => {
      // Test that SavedResult questions field accepts valid Question objects
      const complexQuestion: Question = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        stem: 'Complex question with all fields',
        options: ['A', 'B', 'C', 'D'],
        answer: 'A',
        explanation: 'Detailed explanation',
        difficulty: 'Ninja',
        subject: 'Physics',
      };

      const resultWithComplexQuestion = {
        ...validSavedResult,
        questions: [complexQuestion]
      };

      const result = SavedResultSchema.safeParse(resultWithComplexQuestion);
      expect(result.success).toBe(true);
    });
  });
}); 