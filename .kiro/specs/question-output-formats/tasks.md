# Implementation Plan

- [x] 1. Update schema definitions for output format support
  - Add OutputFormat enum and update GeneratePayload schema in src/lib/schema.ts
  - Add FormattedOutput interface for structured document output
  - Update existing type exports to include new format types
  - _Requirements: 5.1, 6.2_

- [x] 2. Create question formatting service
  - [x] 2.1 Create base formatter interface and service structure
    - Create src/lib/formatters.ts with QuestionFormatter interface
    - Implement getFormatter factory function for format selection
    - Define document structure interfaces for different output types
    - _Requirements: 6.1, 6.3_

  - [x] 2.2 Implement SolvedExamplesFormatter class
    - Code formatter that maintains current behavior (answers after each question)
    - Generate single combined document with interleaved questions and answers
    - Write unit tests for solved examples formatting logic
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.3 Implement AssignmentFormatter class
    - Code formatter that separates questions from answers
    - Generate single document with questions section followed by answer key section
    - Write unit tests for assignment format logic
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.4 Implement SeparateDocumentsFormatter class
    - Code formatter that creates two distinct documents
    - Generate questions-only document and separate answer key document
    - Write unit tests for separate documents formatting logic
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Update QuestionForm component to include output format selection
  - Add output format dropdown with three options and descriptive labels
  - Implement form validation for new outputFormat field
  - Add visual icons and help text for each format option
  - Update form submission to include selected output format
  - Write component tests for form with new format selection
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 4. Create document display components
  - [x] 4.1 Create DocumentSection component for rendering formatted documents
    - Build reusable component that displays document title and content
    - Handle different document types (questions, answers, combined)
    - Add proper styling and accessibility attributes
    - _Requirements: 5.2, 6.4_

  - [x] 4.2 Create QuestionOnlyView component
    - Implement component that displays questions without answers or explanations
    - Ensure clean formatting suitable for test papers
    - Write component tests for questions-only display
    - _Requirements: 4.2_

  - [x] 4.3 Create AnswerKeyView component
    - Implement component that displays answer key with question numbers
    - Include answers and explanations in structured format
    - Write component tests for answer key display
    - _Requirements: 3.3, 4.3_

- [x] 5. Update QuestionList component to support multiple formats
  - Modify QuestionList to accept outputFormat prop
  - Integrate formatter service to generate appropriate document structure
  - Update component to render different document sections based on format
  - Maintain backward compatibility with existing question display
  - Write component tests for all three output formats
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 6. Update API route to handle output format parameter
  - Modify src/app/api/generate/route.ts to accept outputFormat in request body
  - Update request validation to include new format parameter
  - Ensure backward compatibility for requests without format specification
  - Add error handling for invalid format values
  - Write API tests for format parameter handling
  - _Requirements: 5.4, 6.2_

- [x] 7. Update main page component to pass format to display components
  - Modify src/app/page.tsx to track selected output format
  - Pass format parameter from form submission to question display
  - Update state management to include format preference
  - Implement session storage for format preference persistence
  - _Requirements: 5.3, 5.4_

- [ ] 8. Add comprehensive tests for the complete feature
  - [x] 8.1 Write integration tests for end-to-end format functionality
    - Test complete flow from format selection to formatted output display
    - Verify each format produces correct document structure
    - Test format switching and state persistence
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 8.2 Write unit tests for all new formatter classes
    - Test each formatter with various question types and edge cases
    - Verify correct document generation for MCQ and Subjective questions
    - Test error handling and fallback behavior
    - _Requirements: 6.1, 6.3_

  - [x] 8.3 Update existing tests to work with new format system
    - Modify existing component tests to handle format parameter
    - Update API tests to include format validation
    - Ensure backward compatibility tests pass
    - _Requirements: 6.2, 6.4_