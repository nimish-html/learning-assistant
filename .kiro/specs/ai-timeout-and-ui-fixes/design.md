# Design Document

## Overview

This design outlines the migration of AI-related API routes from Next.js API routes to Supabase Edge Functions to enable production deployment with proper timeout handling for long-running AI operations, along with UI fixes for duplicate elements. The solution maintains backward compatibility while preparing the application for live deployment.

## Architecture

### Current Architecture
```
Frontend (Next.js) → Next.js API Routes → XAI API
                   ↓
                Works locally, needs deployment solution
```

### Target Architecture
```
Frontend (Next.js) → Supabase Edge Functions → XAI API
                   ↓
                Ready for production deployment with 150-second timeout
```

## Components and Interfaces

### 1. Supabase Edge Functions

#### 1.1 Generate Questions Edge Function
- **File**: `supabase/functions/generate-questions/index.ts`
- **Purpose**: Handle question generation requests with AI SDK
- **Timeout**: 150 seconds (vs 10-15 seconds on Vercel)
- **Dependencies**: AI SDK, XAI provider, Zod validation

**Interface**:
```typescript
// Request
POST /functions/v1/generate-questions
Content-Type: application/json
{
  "exam": string,
  "classStandard": string,
  "type": "MCQ" | "Subjective",
  "count": number,
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "outputFormat": "solved-examples" | "assignment-format" | "separate-documents",
  "preferredSource"?: string
}

// Response (Streaming Text)
Content-Type: text/plain
[{"id": "uuid", "stem": "...", "options": [...], ...}]
```

#### 1.2 Verify Questions Edge Function
- **File**: `supabase/functions/verify-questions/index.ts`
- **Purpose**: Handle question verification with AI analysis
- **Timeout**: 150 seconds

**Interface**:
```typescript
// Request
POST /functions/v1/verify-questions
Content-Type: application/json
{
  "questions": Question[]
}

// Response (JSON)
Content-Type: application/json
{
  "validQuestions": Question[],
  "issues": Issue[],
  "summary": Summary
}
```

#### 1.3 Chat Stream Edge Function
- **File**: `supabase/functions/chat-stream/index.ts`
- **Purpose**: Handle chat streaming requests
- **Timeout**: 150 seconds

**Interface**:
```typescript
// Request
POST /functions/v1/chat-stream
Content-Type: application/json
{
  "messages": Message[]
}

// Response (Data Stream)
Content-Type: text/plain
// AI SDK data stream format
```

### 2. Frontend Updates

#### 2.1 API Configuration Service
- **File**: `src/lib/api-config.ts`
- **Purpose**: Centralize Edge Function URL configuration
- **Functionality**: Generate Edge Function URLs based on environment

```typescript
interface ApiConfig {
  generateQuestionsUrl: string;
  verifyQuestionsUrl: string;
  chatStreamUrl: string;
}

export function getApiConfig(): ApiConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return {
    generateQuestionsUrl: `${supabaseUrl}/functions/v1/generate-questions`,
    verifyQuestionsUrl: `${supabaseUrl}/functions/v1/verify-questions`,
    chatStreamUrl: `${supabaseUrl}/functions/v1/chat-stream`
  };
}
```

#### 2.2 Option Label Utility
- **File**: `src/lib/option-utils.ts`
- **Purpose**: Handle option label detection and formatting
- **Functionality**: Prevent duplicate A, B, C, D labels

```typescript
export function hasOptionLabels(option: string): boolean {
  return /^[A-Z]\.\s/.test(option.trim());
}

export function formatOption(option: string, index: number): string {
  if (hasOptionLabels(option)) {
    return option;
  }
  return `${String.fromCharCode(65 + index)}. ${option}`;
}
```

### 3. UI Component Updates

#### 3.1 Question Display Components
- **Files**: `QuestionList.tsx`, `AnswerKeyView.tsx`, `QuestionOnlyView.tsx`, `ChatStream.tsx`
- **Changes**: Use option utility to prevent duplicate labels
- **Pattern**: Check for existing labels before adding new ones

#### 3.2 Button Consolidation
- **Save Button**: Only in `QuestionList.tsx` component
- **Verify Button**: Only in main page (`page.tsx`)
- **Pattern**: Remove duplicate button instances

## Data Models

### Edge Function Environment Variables
```typescript
interface EdgeFunctionEnv {
  XAI_API_KEY: string;
  // Supabase automatically provides:
  // - SUPABASE_URL
  // - SUPABASE_ANON_KEY
  // - SUPABASE_SERVICE_ROLE_KEY
}
```

### API Request/Response Types
The Edge Functions will use the same TypeScript types as the current API routes:
- `GeneratePayloadSchema` from `src/lib/schema.ts`
- `VerifyPayloadSchema` from `src/lib/schema.ts`
- `Question` interface from `src/lib/schema.ts`

## Error Handling

### 1. Edge Function Error Handling
- **Timeout Errors**: 150-second limit should prevent most timeouts
- **XAI API Errors**: Same error handling as current implementation
- **Validation Errors**: Use existing Zod schemas
- **CORS Errors**: Configure proper CORS headers

### 2. Frontend Error Handling
- **Network Errors**: Existing error handling remains unchanged
- **URL Configuration Errors**: Validate environment variables
- **Fallback Strategy**: Log errors for debugging

## Testing Strategy

### 1. Edge Function Testing
- **Unit Tests**: Test individual Edge Functions locally
- **Integration Tests**: Test with actual XAI API calls
- **Performance Tests**: Verify timeout improvements
- **CORS Tests**: Verify frontend can call Edge Functions

### 2. Frontend Testing
- **Component Tests**: Update existing tests for UI fixes
- **API Integration Tests**: Update to use Edge Function URLs
- **E2E Tests**: Verify complete user workflows work

### 3. Migration Testing
- **Parallel Testing**: Run both old and new APIs during migration
- **Response Comparison**: Ensure identical responses
- **Performance Comparison**: Measure timeout improvements

## Deployment Strategy

### Phase 1: Edge Function Development
1. Create Edge Functions in Supabase
2. Deploy with environment variables
3. Test Edge Functions independently

### Phase 2: Frontend Updates
1. Create API configuration service
2. Update option label handling
3. Remove duplicate buttons
4. Update API calls to use Edge Functions

### Phase 3: Migration
1. Deploy Edge Functions to production
2. Update frontend environment variables
3. Monitor for issues
4. Remove old API routes after verification

## Security Considerations

### 1. Environment Variables
- **XAI_API_KEY**: Secure in Supabase Edge Function environment
- **CORS Configuration**: Restrict to frontend domain
- **Rate Limiting**: Use Supabase's built-in rate limiting

### 2. Authentication
- **Edge Functions**: Use Supabase auth context if needed
- **API Access**: Maintain same access patterns as current implementation

## Performance Considerations

### 1. Timeout Improvements
- **Current**: Works locally with Next.js API routes
- **Target**: 150 seconds (Supabase Edge Function limit)
- **Expected**: 30-40 second AI requests will work in production deployment

### 2. Network Latency
- **Edge Function Location**: Supabase global edge network
- **Streaming**: Maintain streaming responses for better UX
- **Caching**: Consider response caching where appropriate

## Monitoring and Observability

### 1. Edge Function Monitoring
- **Supabase Dashboard**: Monitor function invocations and errors
- **Logs**: Use console.log for debugging
- **Metrics**: Track success/failure rates

### 2. Frontend Monitoring
- **Error Tracking**: Existing error handling
- **Performance**: Monitor API response times
- **User Experience**: Track timeout reduction impact