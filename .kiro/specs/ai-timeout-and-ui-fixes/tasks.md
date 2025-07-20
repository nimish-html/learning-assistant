# Implementation Plan

- [x] 1. Create Supabase Edge Functions directory structure
  - Set up the supabase directory structure for Edge Functions
  - Create individual function directories for each AI endpoint
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 2. Create generate-questions Edge Function
  - [x] 2.1 Create generate-questions Edge Function file
    - Create `supabase/functions/generate-questions/index.ts`
    - Implement the same logic as `src/app/api/generate/route.ts` using AI SDK
    - Configure XAI provider and streaming text response
    - Add proper CORS headers for frontend access
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.7_
  
  - [x] 2.2 Add request validation to generate-questions function
    - Import and use GeneratePayloadSchema from the existing schema
    - Implement the same validation logic as the current API route
    - Return appropriate error responses for invalid requests
    - _Requirements: 1.6_

- [x] 3. Create verify-questions Edge Function
  - [x] 3.1 Create verify-questions Edge Function file
    - Create `supabase/functions/verify-questions/index.ts`
    - Implement the same logic as `src/app/api/verify/route.ts` using AI SDK
    - Configure XAI provider and JSON response handling
    - Add proper CORS headers for frontend access
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_
  
  - [x] 3.2 Add request validation to verify-questions function
    - Import and use VerifyPayloadSchema from the existing schema
    - Implement the same validation logic as the current API route
    - Return appropriate error responses for invalid requests
    - _Requirements: 2.6_

- [x] 4. Create chat-stream Edge Function
  - [x] 4.1 Create chat-stream Edge Function file
    - Create `supabase/functions/chat-stream/index.ts`
    - Implement the same logic as `src/app/api/chat/route.ts` using AI SDK
    - Configure XAI provider and data stream response
    - Add proper CORS headers for frontend access
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Create API configuration service
  - [x] 5.1 Create API configuration utility
    - Create `src/lib/api-config.ts` file
    - Implement function to generate Edge Function URLs from environment variables
    - Export configuration object with all three Edge Function endpoints
    - Add environment variable validation
    - _Requirements: 7.4_

- [x] 6. Create option label utility
  - [x] 6.1 Create option formatting utility
    - Create `src/lib/option-utils.ts` file
    - Implement function to detect existing option labels (A., B., C., D.)
    - Implement function to format options without duplicating labels
    - Add unit tests for option label detection and formatting
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Fix duplicate option labels in components
  - [x] 7.1 Update QuestionList component option rendering
    - Modify `src/components/QuestionList.tsx` to use option utility
    - Replace direct `String.fromCharCode(65 + idx)` usage with utility function
    - Test that options display correctly without duplication
    - _Requirements: 4.1, 4.5_
  
  - [x] 7.2 Update AnswerKeyView component option rendering
    - Modify `src/components/AnswerKeyView.tsx` to use option utility
    - Replace direct `String.fromCharCode(65 + optIndex)` usage with utility function
    - Test that answer key displays correctly without duplication
    - _Requirements: 4.2, 4.5_
  
  - [x] 7.3 Update QuestionOnlyView component option rendering
    - Modify `src/components/QuestionOnlyView.tsx` to use option utility
    - Replace direct `String.fromCharCode(65 + optIndex)` usage with utility function
    - Test that question-only view displays correctly without duplication
    - _Requirements: 4.3, 4.5_
  
  - [x] 7.4 Update ChatStream component option rendering
    - Modify `src/components/ChatStream.tsx` to use option utility
    - Replace direct `String.fromCharCode(65 + optIdx)` usage with utility function
    - Test that chat stream displays correctly without duplication
    - _Requirements: 4.4, 4.5_

- [x] 8. Remove duplicate save button
  - [x] 8.1 Audit and remove duplicate save button instances
    - Review `src/app/page.tsx` for any duplicate save button rendering
    - Ensure save functionality is only available through QuestionList component
    - Remove any redundant save button code outside of QuestionList
    - Test that only one save button appears for authenticated users
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 9. Remove duplicate verify button
  - [x] 9.1 Audit and remove duplicate verify button instances
    - Review all components for duplicate verify button rendering
    - Ensure verify functionality is only in the main page component
    - Remove any redundant verify button code
    - Test that only one verify button appears when questions are available
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 10. Update frontend to use Edge Functions
  - [x] 10.1 Update main page to use generate-questions Edge Function
    - Modify `useCompletion` hook in `src/app/page.tsx` to use Edge Function URL
    - Import and use API configuration service
    - Test that question generation works with Edge Function
    - _Requirements: 7.1, 7.5_
  
  - [x] 10.2 Update main page to use verify-questions Edge Function
    - Modify verification fetch call in `src/app/page.tsx` to use Edge Function URL
    - Import and use API configuration service
    - Test that question verification works with Edge Function
    - _Requirements: 7.2, 7.5_
  
  - [x] 10.3 Update ChatStream to use chat-stream Edge Function
    - Modify `useChat` hook in `src/components/ChatStream.tsx` to use Edge Function URL
    - Import and use API configuration service
    - Test that chat streaming works with Edge Function
    - _Requirements: 7.3, 7.5_

- [x] 11. Update environment configuration
  - [x] 11.1 Update environment example file
    - Add documentation for Edge Function usage in `.env.example`
    - Ensure NEXT_PUBLIC_SUPABASE_URL is documented
    - Add comments explaining Edge Function configuration
    - _Requirements: 8.3_

- [x] 12. Deploy and test Edge Functions
  - [x] 12.1 Deploy Edge Functions to Supabase
    - Deploy all three Edge Functions to Supabase project
    - Configure XAI_API_KEY environment variable in Supabase dashboard
    - Test Edge Functions independently using Supabase dashboard
    - _Requirements: 8.1, 8.4_
  
  - [x] 12.2 Test complete integration
    - Test end-to-end question generation flow using Edge Functions
    - Test question verification flow using Edge Functions
    - Test chat streaming flow using Edge Functions
    - Verify all UI fixes are working correctly
    - _Requirements: 7.5, 4.5, 5.3, 6.3_