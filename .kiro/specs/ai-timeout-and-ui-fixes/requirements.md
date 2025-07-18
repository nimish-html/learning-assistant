# Requirements Document

## Introduction

This feature migrates AI-related API routes from Vercel serverless functions to Supabase Edge Functions to prevent timeout issues, and fixes duplicate UI elements (option labels and buttons) for a cleaner user experience.

## Requirements

### Requirement 1: Migrate Generate Questions API to Supabase Edge Function

**User Story:** As a developer, I want the question generation API to run on Supabase Edge Functions, so that 30-40 second AI requests don't timeout.

#### Acceptance Criteria

1. WHEN creating the Edge Function THEN it SHALL be named `generate-questions`
2. WHEN migrating `src/app/api/generate/route.ts` THEN it SHALL be converted to a Supabase Edge Function with identical functionality
3. WHEN the Edge Function processes requests THEN it SHALL use the AI SDK's `streamText` function with XAI provider
4. WHEN the Edge Function handles XAI API calls THEN it SHALL use the `XAI_API_KEY` environment variable
5. WHEN the Edge Function returns responses THEN it SHALL maintain the same streaming text format as the current API
6. WHEN the Edge Function validates requests THEN it SHALL use the same `GeneratePayloadSchema` validation
7. WHEN the Edge Function encounters errors THEN it SHALL return the same error response format

### Requirement 2: Migrate Verify Questions API to Supabase Edge Function

**User Story:** As a developer, I want the question verification API to run on Supabase Edge Functions, so that verification requests don't timeout.

#### Acceptance Criteria

1. WHEN creating the Edge Function THEN it SHALL be named `verify-questions`
2. WHEN migrating `src/app/api/verify/route.ts` THEN it SHALL be converted to a Supabase Edge Function with identical functionality
3. WHEN the Edge Function processes requests THEN it SHALL use the AI SDK's `streamText` function with XAI provider
4. WHEN the Edge Function handles verification THEN it SHALL use the same system and user prompts
5. WHEN the Edge Function returns responses THEN it SHALL maintain the same JSON response format
6. WHEN the Edge Function validates requests THEN it SHALL use the same `VerifyPayloadSchema` validation

### Requirement 3: Migrate Chat Stream API to Supabase Edge Function

**User Story:** As a developer, I want the chat streaming API to run on Supabase Edge Functions, so that chat requests don't timeout.

#### Acceptance Criteria

1. WHEN creating the Edge Function THEN it SHALL be named `chat-stream`
2. WHEN migrating `src/app/api/chat/route.ts` THEN it SHALL be converted to a Supabase Edge Function with identical functionality
3. WHEN the Edge Function processes requests THEN it SHALL use the AI SDK's `streamText` function with XAI provider
4. WHEN the Edge Function returns responses THEN it SHALL maintain the same data stream format

### Requirement 4: Fix Duplicate Option Labels (A, B, C, D)

**User Story:** As a user viewing generated questions, I want to see clean, non-duplicated option labels, so that questions are professionally formatted.

#### Acceptance Criteria

1. WHEN `QuestionList.tsx` renders options THEN it SHALL check if options already start with "A.", "B.", etc. before adding labels
2. WHEN `AnswerKeyView.tsx` renders options THEN it SHALL check if options already start with "A.", "B.", etc. before adding labels
3. WHEN `QuestionOnlyView.tsx` renders options THEN it SHALL check if options already start with "A.", "B.", etc. before adding labels
4. WHEN `ChatStream.tsx` renders options THEN it SHALL check if options already start with "A.", "B.", etc. before adding labels
5. WHEN displaying options THEN the format SHALL be consistent as either "A. option text" or "option text" but never "A. A. option text"

### Requirement 5: Remove Duplicate Save Button

**User Story:** As a user viewing generated questions, I want to see only one save button, so that the interface is clean and intuitive.

#### Acceptance Criteria

1. WHEN `QuestionList.tsx` renders THEN it SHALL display only one `SaveResultsButton` component
2. WHEN the main page renders question results THEN it SHALL NOT display additional save buttons
3. WHEN authenticated users view questions THEN save functionality SHALL be available only through the `QuestionList` component

### Requirement 6: Remove Duplicate Verify Button

**User Story:** As a user wanting to verify questions, I want to see only one verify button, so that the interface is clear.

#### Acceptance Criteria

1. WHEN the main page displays questions THEN it SHALL show only one "Verify Questions" button
2. WHEN questions are being verified THEN the verify button SHALL be hidden and show loading state
3. WHEN verification is complete THEN the verify button SHALL remain hidden until new questions are generated

### Requirement 7: Update Frontend to Use Edge Functions

**User Story:** As a developer, I want the frontend to call Supabase Edge Functions instead of Vercel API routes, so that the system works reliably.

#### Acceptance Criteria

1. WHEN `useCompletion` hook in `src/app/page.tsx` makes requests THEN it SHALL call the Supabase Edge Function URL for `generate-questions`
2. WHEN verification requests are made in `src/app/page.tsx` THEN they SHALL call the Supabase Edge Function URL for `verify-questions`
3. WHEN `useChat` hook in `src/components/ChatStream.tsx` makes requests THEN it SHALL call the Supabase Edge Function URL for `chat-stream`
4. WHEN Edge Function URLs are configured THEN they SHALL use `NEXT_PUBLIC_SUPABASE_URL` environment variable
5. WHEN API calls are updated THEN the request/response handling SHALL remain unchanged

### Requirement 8: Environment Configuration

**User Story:** As a developer deploying the application, I want proper environment configuration for Edge Functions, so that they work across environments.

#### Acceptance Criteria

1. WHEN Edge Functions are deployed THEN they SHALL have access to `XAI_API_KEY` environment variable
2. WHEN the frontend calls Edge Functions THEN it SHALL use `NEXT_PUBLIC_SUPABASE_URL` environment variable
3. WHEN environment variables are configured THEN they SHALL be documented in `.env.example`
4. WHEN Edge Functions handle CORS THEN they SHALL allow requests from the frontend domain