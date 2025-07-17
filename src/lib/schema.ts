import { z } from 'zod';

// Output format enum for different question presentation formats
export const OutputFormatSchema = z.enum([
  'solved-examples',    // Answers shown after each question
  'assignment-format',  // Answer key at the end
  'separate-documents'  // Two separate documents
]);

export type OutputFormat = z.infer<typeof OutputFormatSchema>;

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
  outputFormat: OutputFormatSchema.default('solved-examples'), // New field with default
});

export type GeneratePayload = z.infer<typeof GeneratePayloadSchema>;

// Verify payload schema
export const VerifyPayloadSchema = z.object({
  questions: z.array(QuestionSchema),
});

export type VerifyPayload = z.infer<typeof VerifyPayloadSchema>;

// Document schema for formatted output documents
export const DocumentSchema = z.object({
  title: z.string(),
  content: z.string(),
  type: z.enum(['questions', 'answers', 'combined'])
});

export type Document = z.infer<typeof DocumentSchema>;

// Formatted output schema for structured document output
export const FormattedOutputSchema = z.object({
  format: OutputFormatSchema,
  questions: z.array(QuestionSchema),
  documents: z.array(DocumentSchema)
});

export type FormattedOutput = z.infer<typeof FormattedOutputSchema>;

// Supabase-related schemas for authentication and data storage

// Saved result metadata schema
export const SavedResultMetadataSchema = z.object({
  exam: z.string(),
  classStandard: z.enum(['11th', '12th']),
  difficulty: z.enum(['Beginner', 'Amateur', 'Ninja']),
  type: z.enum(['MCQ', 'Subjective']),
  outputFormat: OutputFormatSchema,
  questionCount: z.number()
});

export type SavedResultMetadata = z.infer<typeof SavedResultMetadataSchema>;

// Save results payload schema for saving generated questions
export const SaveResultsPayloadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  questions: z.array(QuestionSchema),
  metadata: SavedResultMetadataSchema
});

export type SaveResultsPayload = z.infer<typeof SaveResultsPayloadSchema>;

// Saved result schema for database records
export const SavedResultSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  questions: z.array(QuestionSchema),
  metadata: SavedResultMetadataSchema,
  created_at: z.string(),
  updated_at: z.string()
});

export type SavedResult = z.infer<typeof SavedResultSchema>;

// User profile schema
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  created_at: z.string(),
  updated_at: z.string()
});

export type UserProfile = z.infer<typeof UserProfileSchema>; 