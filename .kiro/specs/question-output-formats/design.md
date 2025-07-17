# Design Document

## Overview

This design extends the existing question generator system to support three different output formats for generated questions. The current system generates questions and displays them in a single format with answers and explanations shown immediately after each question. This enhancement will provide educators with flexible output options suitable for different educational scenarios.

The solution maintains backward compatibility while adding new formatting capabilities through a modular approach that separates content generation from presentation logic.

## Architecture

### Current System Analysis

The existing system follows this flow:
1. User fills QuestionForm with generation parameters
2. Form data is sent to `/api/generate` endpoint
3. AI generates questions in JSON format
4. Questions are parsed and displayed using QuestionList component
5. All questions show answers and explanations immediately

### Enhanced Architecture

The enhanced system will modify this flow:
1. User fills QuestionForm with generation parameters + output format selection
2. Form data (including format preference) is sent to `/api/generate` endpoint
3. AI generates questions in JSON format (unchanged)
4. Questions are parsed and formatted according to selected output format
5. Questions are displayed using enhanced QuestionList component or new format-specific components

### Key Design Principles

- **Separation of Concerns**: Content generation remains separate from presentation formatting
- **Backward Compatibility**: Existing functionality continues to work unchanged
- **Modularity**: Each output format is handled by dedicated formatting logic
- **Consistency**: All formats use the same underlying question data structure

## Components and Interfaces

### 1. Enhanced Schema (src/lib/schema.ts)

```typescript
// New output format enum
export const OutputFormatSchema = z.enum([
  'solved-examples',    // Answers shown after each question
  'assignment-format',  // Answer key at the end
  'separate-documents'  // Two separate documents
]);

export type OutputFormat = z.infer<typeof OutputFormatSchema>;

// Enhanced GeneratePayload to include output format
export const GeneratePayloadSchema = z.object({
  exam: z.string().min(1, 'Exam selection is required'),
  classStandard: z.enum(['11th', '12th']),
  count: z.number().min(1).max(50),
  difficulty: z.enum(['Beginner', 'Amateur', 'Ninja']),
  type: z.enum(['MCQ', 'Subjective']),
  preferredSource: z.string().optional(),
  outputFormat: OutputFormatSchema.default('solved-examples'), // New field
});

// New interface for formatted output
export const FormattedOutputSchema = z.object({
  format: OutputFormatSchema,
  questions: z.array(QuestionSchema),
  documents: z.array(z.object({
    title: z.string(),
    content: z.string(),
    type: z.enum(['questions', 'answers', 'combined'])
  }))
});

export type FormattedOutput = z.infer<typeof FormattedOutputSchema>;
```

### 2. Enhanced QuestionForm Component

The QuestionForm will be updated to include output format selection:

```typescript
// New section in the form
<div className="space-y-2">
  <div className="flex items-center gap-2">
    <FileText className="w-4 h-4 text-gray-600" />
    <label className="text-sm font-medium text-gray-700">Output Format *</label>
  </div>
  <select
    value={formData.outputFormat || 'solved-examples'}
    onChange={(e) => handleInputChange('outputFormat', e.target.value)}
    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md..."
  >
    <option value="solved-examples">📚 Solved Examples (answers with each question)</option>
    <option value="assignment-format">📝 Assignment Format (answer key at end)</option>
    <option value="separate-documents">📄 Separate Documents (questions & answers separate)</option>
  </select>
</div>
```

### 3. Question Formatting Service (src/lib/formatters.ts)

New service to handle different output formats:

```typescript
export interface QuestionFormatter {
  format(questions: Question[], options?: any): FormattedOutput;
}

export class SolvedExamplesFormatter implements QuestionFormatter {
  format(questions: Question[]): FormattedOutput {
    // Current behavior - show answers after each question
  }
}

export class AssignmentFormatter implements QuestionFormatter {
  format(questions: Question[]): FormattedOutput {
    // Questions first, then answer key section
  }
}

export class SeparateDocumentsFormatter implements QuestionFormatter {
  format(questions: Question[]): FormattedOutput {
    // Generate two separate documents
  }
}

export function getFormatter(format: OutputFormat): QuestionFormatter {
  switch (format) {
    case 'solved-examples': return new SolvedExamplesFormatter();
    case 'assignment-format': return new AssignmentFormatter();
    case 'separate-documents': return new SeparateDocumentsFormatter();
  }
}
```

### 4. Enhanced QuestionList Component

The QuestionList component will be updated to handle different formats:

```typescript
interface QuestionListProps {
  questions: Question[];
  outputFormat: OutputFormat;
}

export default function QuestionList({ questions, outputFormat }: QuestionListProps) {
  const formatter = getFormatter(outputFormat);
  const formattedOutput = formatter.format(questions);
  
  return (
    <div>
      {formattedOutput.documents.map((doc, index) => (
        <DocumentSection key={index} document={doc} />
      ))}
    </div>
  );
}
```

### 5. New Document Components

```typescript
// src/components/DocumentSection.tsx
interface DocumentSectionProps {
  document: {
    title: string;
    content: string;
    type: 'questions' | 'answers' | 'combined';
  };
}

// src/components/QuestionOnlyView.tsx - for questions without answers
// src/components/AnswerKeyView.tsx - for answer key sections
// src/components/SeparateDocumentView.tsx - for separate document format
```

## Data Models

### Enhanced Question Flow

```typescript
// Input: User form data with output format
interface GenerateRequest {
  exam: string;
  classStandard: '11th' | '12th';
  count: number;
  difficulty: 'Beginner' | 'Amateur' | 'Ninja';
  type: 'MCQ' | 'Subjective';
  preferredSource?: string;
  outputFormat: 'solved-examples' | 'assignment-format' | 'separate-documents';
}

// Processing: Questions generated (unchanged)
interface Question {
  id: string;
  stem: string;
  options?: string[];
  answer: string;
  explanation?: string;
  difficulty: string;
  subject: string;
}

// Output: Formatted documents
interface FormattedOutput {
  format: OutputFormat;
  questions: Question[];
  documents: Array<{
    title: string;
    content: string;
    type: 'questions' | 'answers' | 'combined';
  }>;
}
```

### Document Structure Examples

**Solved Examples Format:**
- Single document with questions and answers interleaved

**Assignment Format:**
- Single document with two sections: Questions section + Answer Key section

**Separate Documents:**
- Document 1: Questions only
- Document 2: Answer key with explanations

## Error Handling

### Validation
- Output format selection is validated in the schema
- Default to 'solved-examples' if format is invalid or missing
- Maintain backward compatibility for existing API calls

### Formatting Errors
- If formatting fails, fall back to solved-examples format
- Log formatting errors for debugging
- Display user-friendly error messages

### Edge Cases
- Handle empty question arrays gracefully
- Manage questions without answers or explanations
- Support mixed question types (MCQ + Subjective) in all formats

## Testing Strategy

### Unit Tests
- Test each formatter class independently
- Validate schema changes and backward compatibility
- Test form validation with new output format field

### Integration Tests
- Test complete flow from form submission to formatted output
- Verify API endpoint handles new format parameter
- Test question parsing with different output formats

### Component Tests
- Test QuestionForm with new output format selection
- Test QuestionList rendering for each format type
- Test new document components

### End-to-End Tests
- Generate questions in each output format
- Verify correct document structure and content
- Test format switching and session persistence

## Implementation Considerations

### Performance
- Formatting is done client-side to avoid additional API calls
- Minimal impact on question generation performance
- Lazy loading of format-specific components

### User Experience
- Clear format descriptions with use case examples
- Visual previews or icons for each format type
- Remember user's format preference in session storage
- Smooth transitions between different format views

### Accessibility
- Proper ARIA labels for format selection
- Keyboard navigation support
- Screen reader friendly document structure
- High contrast support for different document sections

### Browser Compatibility
- Support for modern browsers (ES2020+)
- Graceful degradation for older browsers
- Responsive design for mobile devices

### Future Extensibility
- Plugin architecture for adding new formats
- Configuration options for format customization
- Export capabilities (PDF, Word, etc.)
- Template system for format styling