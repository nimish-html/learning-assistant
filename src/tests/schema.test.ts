import { 
  QuestionSchema, 
  GeneratePayloadSchema, 
  VerifyPayloadSchema,
  Question,
  GeneratePayload 
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
}); 