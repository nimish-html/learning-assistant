import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestionList from '@/components/QuestionList';
import { Question, OutputFormat } from '@/lib/schema';

// Mock the DocumentSection component
jest.mock('@/components/DocumentSection', () => {
  return function MockDocumentSection({ document }: { document: any }) {
    return (
      <div data-testid={`document-${document.type}`}>
        <h2>{document.title}</h2>
        <div>{document.content}</div>
      </div>
    );
  };
});

// Mock the PDFExportControls component
jest.mock('@/components/PDFExportControls', () => {
  return function MockPDFExportControls({ questions, outputFormat }: { questions: any[], outputFormat: string }) {
    return (
      <div data-testid="pdf-export-controls">
        <div data-testid="pdf-questions-count">{questions.length}</div>
        <div data-testid="pdf-output-format">{outputFormat}</div>
        {outputFormat === 'separate-documents' ? (
          <>
            <button data-testid="export-questions-btn">Download Questions PDF</button>
            <button data-testid="export-answers-btn">Download Answers PDF</button>
          </>
        ) : (
          <button data-testid="export-single-btn">Download PDF</button>
        )}
      </div>
    );
  };
});

// Sample test questions
const mockQuestions: Question[] = [
  {
    id: '1',
    stem: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    answer: 'Paris',
    explanation: 'Paris is the capital and largest city of France.',
    difficulty: 'Beginner',
    subject: 'Geography'
  },
  {
    id: '2',
    stem: 'Explain the process of photosynthesis.',
    answer: 'Photosynthesis is the process by which plants convert light energy into chemical energy.',
    explanation: 'Plants use chlorophyll to capture sunlight and convert CO2 and water into glucose.',
    difficulty: 'Amateur',
    subject: 'Biology'
  }
];

describe('QuestionList Component', () => {
  describe('Backward Compatibility', () => {
    it('renders questions in legacy format when no outputFormat is provided', () => {
      render(<QuestionList questions={mockQuestions} />);
      
      // Should render legacy question cards
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Question 2')).toBeInTheDocument();
      expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
      expect(screen.getByText('Explain the process of photosynthesis.')).toBeInTheDocument();
      
      // Should show answers and explanations in legacy format (use getAllByText for multiple instances)
      expect(screen.getAllByText(/Answer:/)).toHaveLength(2);
      expect(screen.getAllByText(/Explanation:/)).toHaveLength(2);
      expect(screen.getByText('Paris is the capital and largest city of France.')).toBeInTheDocument();
    });

    it('renders questions in legacy format when outputFormat is solved-examples', () => {
      render(<QuestionList questions={mockQuestions} outputFormat="solved-examples" />);
      
      // Should render legacy question cards
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Question 2')).toBeInTheDocument();
      expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
      
      // Should show difficulty and subject tags
      expect(screen.getByText('Beginner')).toBeInTheDocument();
      expect(screen.getByText('Geography')).toBeInTheDocument();
      expect(screen.getByText('Amateur')).toBeInTheDocument();
      expect(screen.getByText('Biology')).toBeInTheDocument();
    });

    it('renders MCQ options correctly in legacy format', () => {
      render(<QuestionList questions={mockQuestions} outputFormat="solved-examples" />);
      
      // Should show options with correct labels
      expect(screen.getByText('A.')).toBeInTheDocument();
      expect(screen.getByText('London')).toBeInTheDocument();
      expect(screen.getByText('B.')).toBeInTheDocument();
      expect(screen.getByText('Berlin')).toBeInTheDocument();
      expect(screen.getByText('C.')).toBeInTheDocument();
      expect(screen.getAllByText('Paris')).toHaveLength(2); // Once in options, once in answer
      expect(screen.getByText('D.')).toBeInTheDocument();
      expect(screen.getByText('Madrid')).toBeInTheDocument();
    });
  });

  describe('Assignment Format', () => {
    it('renders questions using DocumentSection for assignment format', () => {
      render(<QuestionList questions={mockQuestions} outputFormat="assignment-format" />);
      
      // Should render using DocumentSection component
      expect(screen.getByTestId('document-combined')).toBeInTheDocument();
      expect(screen.getByText('Assignment with Answer Key')).toBeInTheDocument();
      
      // Should not render legacy question cards
      expect(screen.queryByText('Question 1')).not.toBeInTheDocument();
    });

    it('formats content correctly for assignment format', () => {
      render(<QuestionList questions={mockQuestions} outputFormat="assignment-format" />);
      
      const documentContent = screen.getByTestId('document-combined');
      expect(documentContent).toBeInTheDocument();
      
      // Content should include both questions and answers sections
      const content = documentContent.textContent;
      expect(content).toContain('# Questions');
      expect(content).toContain('# Answer Key');
      expect(content).toContain('**Question 1:**');
      expect(content).toContain('**Answer 1:**');
    });
  });

  describe('Separate Documents Format', () => {
    it('renders two separate documents for separate-documents format', () => {
      render(<QuestionList questions={mockQuestions} outputFormat="separate-documents" />);
      
      // Should render two DocumentSection components
      expect(screen.getByTestId('document-questions')).toBeInTheDocument();
      expect(screen.getByTestId('document-answers')).toBeInTheDocument();
      
      // Should have correct titles
      expect(screen.getByText('Questions')).toBeInTheDocument();
      expect(screen.getByText('Answer Key')).toBeInTheDocument();
    });

    it('separates questions and answers correctly', () => {
      render(<QuestionList questions={mockQuestions} outputFormat="separate-documents" />);
      
      const questionsDoc = screen.getByTestId('document-questions');
      const answersDoc = screen.getByTestId('document-answers');
      
      // Questions document should contain questions but not answers
      expect(questionsDoc.textContent).toContain('**Question 1:**');
      expect(questionsDoc.textContent).toContain('What is the capital of France?');
      expect(questionsDoc.textContent).not.toContain('**Answer 1:**');
      expect(questionsDoc.textContent).not.toContain('Paris is the capital');
      
      // Answers document should contain answers but not question stems
      expect(answersDoc.textContent).toContain('**Answer 1:**');
      expect(answersDoc.textContent).toContain('Paris');
      expect(answersDoc.textContent).not.toContain('What is the capital of France?');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty questions array', () => {
      render(<QuestionList questions={[]} outputFormat="assignment-format" />);
      
      // Should still render DocumentSection but with empty content
      expect(screen.getByTestId('document-combined')).toBeInTheDocument();
    });

    it('handles questions without options (subjective questions)', () => {
      const subjectiveQuestions: Question[] = [
        {
          id: '1',
          stem: 'Explain quantum mechanics.',
          answer: 'Quantum mechanics is a fundamental theory in physics.',
          explanation: 'It describes the physical properties of nature at atomic scales.',
          difficulty: 'Ninja',
          subject: 'Physics'
        }
      ];

      render(<QuestionList questions={subjectiveQuestions} outputFormat="solved-examples" />);
      
      expect(screen.getByText('Explain quantum mechanics.')).toBeInTheDocument();
      expect(screen.getByText('Quantum mechanics is a fundamental theory in physics.')).toBeInTheDocument();
      
      // Should not show options section
      expect(screen.queryByText('Options:')).not.toBeInTheDocument();
    });

    it('handles questions without explanations', () => {
      const questionsWithoutExplanation: Question[] = [
        {
          id: '1',
          stem: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          answer: '4',
          difficulty: 'Beginner',
          subject: 'Mathematics'
        }
      ];

      render(<QuestionList questions={questionsWithoutExplanation} outputFormat="solved-examples" />);
      
      expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      expect(screen.getAllByText('4')).toHaveLength(2); // Once in options, once in answer
      
      // Should not show explanation section
      expect(screen.queryByText('Explanation:')).not.toBeInTheDocument();
    });

    it('handles invalid output format by falling back to solved-examples formatter', () => {
      // TypeScript would prevent this, but testing runtime behavior
      render(<QuestionList questions={mockQuestions} outputFormat={'invalid-format' as OutputFormat} />);
      
      // Should fall back to SolvedExamplesFormatter and render using DocumentSection
      expect(screen.getByTestId('document-combined')).toBeInTheDocument();
      expect(screen.getByText('Solved Examples')).toBeInTheDocument();
      
      // Content should include formatted questions
      const content = screen.getByTestId('document-combined').textContent;
      expect(content).toContain('**Question 1:**');
      expect(content).toContain('**Question 2:**');
    });
  });

  describe('Component Integration', () => {
    it('passes correct document structure to DocumentSection', () => {
      render(<QuestionList questions={mockQuestions} outputFormat="separate-documents" />);
      
      // Should render both document types
      expect(screen.getByTestId('document-questions')).toBeInTheDocument();
      expect(screen.getByTestId('document-answers')).toBeInTheDocument();
    });

    it('maintains question order across all formats', () => {
      const { rerender } = render(<QuestionList questions={mockQuestions} outputFormat="solved-examples" />);
      
      // In solved-examples, first question should appear first
      const firstQuestionElement = screen.getByText('Question 1');
      const secondQuestionElement = screen.getByText('Question 2');
      expect(firstQuestionElement.compareDocumentPosition(secondQuestionElement) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      
      // Test assignment format maintains order
      rerender(<QuestionList questions={mockQuestions} outputFormat="assignment-format" />);
      const content = screen.getByTestId('document-combined').textContent;
      const firstQuestionIndex = content?.indexOf('**Question 1:**') || -1;
      const secondQuestionIndex = content?.indexOf('**Question 2:**') || -1;
      expect(firstQuestionIndex).toBeLessThan(secondQuestionIndex);
    });
  });

  describe('Accessibility', () => {
    it('maintains accessibility in legacy format', () => {
      render(<QuestionList questions={mockQuestions} outputFormat="solved-examples" />);
      
      // Should have proper heading structure
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Question 2')).toBeInTheDocument();
    });

    it('delegates accessibility to DocumentSection for formatted outputs', () => {
      render(<QuestionList questions={mockQuestions} outputFormat="assignment-format" />);
      
      // DocumentSection should handle accessibility
      expect(screen.getByTestId('document-combined')).toBeInTheDocument();
    });
  });

  describe('PDF Export Integration', () => {
    it('renders PDF export controls when questions are available in legacy format', () => {
      render(<QuestionList questions={mockQuestions} outputFormat="solved-examples" />);
      
      // Should render PDF export controls
      expect(screen.getByTestId('pdf-export-controls')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-questions-count')).toHaveTextContent('2');
      expect(screen.getByTestId('pdf-output-format')).toHaveTextContent('solved-examples');
      
      // Should show single PDF export button for solved-examples format
      expect(screen.getByTestId('export-single-btn')).toBeInTheDocument();
      expect(screen.queryByTestId('export-questions-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('export-answers-btn')).not.toBeInTheDocument();
    });

    it('renders PDF export controls when questions are available in assignment format', () => {
      render(<QuestionList questions={mockQuestions} outputFormat="assignment-format" />);
      
      // Should render PDF export controls
      expect(screen.getByTestId('pdf-export-controls')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-questions-count')).toHaveTextContent('2');
      expect(screen.getByTestId('pdf-output-format')).toHaveTextContent('assignment-format');
      
      // Should show single PDF export button for assignment format
      expect(screen.getByTestId('export-single-btn')).toBeInTheDocument();
      expect(screen.queryByTestId('export-questions-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('export-answers-btn')).not.toBeInTheDocument();
    });

    it('renders separate PDF export buttons for separate-documents format', () => {
      render(<QuestionList questions={mockQuestions} outputFormat="separate-documents" />);
      
      // Should render PDF export controls
      expect(screen.getByTestId('pdf-export-controls')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-questions-count')).toHaveTextContent('2');
      expect(screen.getByTestId('pdf-output-format')).toHaveTextContent('separate-documents');
      
      // Should show separate PDF export buttons for separate-documents format
      expect(screen.getByTestId('export-questions-btn')).toBeInTheDocument();
      expect(screen.getByTestId('export-answers-btn')).toBeInTheDocument();
      expect(screen.queryByTestId('export-single-btn')).not.toBeInTheDocument();
    });

    it('does not render PDF export controls when no questions are available', () => {
      render(<QuestionList questions={[]} outputFormat="solved-examples" />);
      
      // Should not render PDF export controls when no questions
      expect(screen.queryByTestId('pdf-export-controls')).not.toBeInTheDocument();
    });

    it('passes correct props to PDFExportControls component', () => {
      render(<QuestionList questions={mockQuestions} outputFormat="assignment-format" />);
      
      // Should pass correct question count and output format
      expect(screen.getByTestId('pdf-questions-count')).toHaveTextContent('2');
      expect(screen.getByTestId('pdf-output-format')).toHaveTextContent('assignment-format');
    });

    it('renders PDF export controls for default solved-examples format', () => {
      render(<QuestionList questions={mockQuestions} />);
      
      // Should render PDF export controls with default format
      expect(screen.getByTestId('pdf-export-controls')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-output-format')).toHaveTextContent('solved-examples');
      expect(screen.getByTestId('export-single-btn')).toBeInTheDocument();
    });

    it('maintains PDF export controls position after questions in legacy format', () => {
      render(<QuestionList questions={mockQuestions} outputFormat="solved-examples" />);
      
      const lastQuestion = screen.getByText('Question 2');
      const pdfControls = screen.getByTestId('pdf-export-controls');
      
      // PDF controls should appear after the questions
      expect(lastQuestion.compareDocumentPosition(pdfControls) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('maintains PDF export controls position after documents in formatted output', () => {
      render(<QuestionList questions={mockQuestions} outputFormat="assignment-format" />);
      
      const document = screen.getByTestId('document-combined');
      const pdfControls = screen.getByTestId('pdf-export-controls');
      
      // PDF controls should appear after the document
      expect(document.compareDocumentPosition(pdfControls) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('handles format-specific export logic correctly', () => {
      const { rerender } = render(<QuestionList questions={mockQuestions} outputFormat="solved-examples" />);
      
      // Solved examples should show single button
      expect(screen.getByTestId('export-single-btn')).toBeInTheDocument();
      
      // Assignment format should show single button
      rerender(<QuestionList questions={mockQuestions} outputFormat="assignment-format" />);
      expect(screen.getByTestId('export-single-btn')).toBeInTheDocument();
      
      // Separate documents should show two buttons
      rerender(<QuestionList questions={mockQuestions} outputFormat="separate-documents" />);
      expect(screen.getByTestId('export-questions-btn')).toBeInTheDocument();
      expect(screen.getByTestId('export-answers-btn')).toBeInTheDocument();
    });
  });
});