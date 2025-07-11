import { z } from 'zod';

// Question schema for generated questions
export const QuestionSchema = z.object({
  id: z.string().uuid(),
  stem: z.string().min(1, 'Question stem cannot be empty'),
  options: z.array(z.string()).min(2).max(6).optional(),
  answer: z.string(),
  explanation: z.string().optional(),
  difficulty: z.enum(['Beginner', 'Amateur', 'Ninja']),
  subject: z.string(),
});

export type Question = z.infer<typeof QuestionSchema>;

// Generate payload schema for API requests
export const GeneratePayloadSchema = z.object({
  exam: z.string().min(1, 'Exam selection is required'),
  classStandard: z.enum(['11th', '12th']),
  count: z.number().min(1).max(50),
  difficulty: z.enum(['Beginner', 'Amateur', 'Ninja']),
  type: z.enum(['MCQ', 'Subjective']),
  preferredSource: z.string().optional(),
});

export type GeneratePayload = z.infer<typeof GeneratePayloadSchema>;

// Verify payload schema
export const VerifyPayloadSchema = z.object({
  questions: z.array(QuestionSchema),
});

export type VerifyPayload = z.infer<typeof VerifyPayloadSchema>; 