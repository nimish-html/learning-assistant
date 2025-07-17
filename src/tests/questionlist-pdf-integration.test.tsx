import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestionList from '@/components/QuestionList';
import { Question, OutputFormat } from '@/lib/schema';
import { pdfService } from '@/lib/pdf-service';

// Mock jsPDF to avoid actual PDF generation in tests
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297
      }
    },
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    setLineWidth: jest.fn(),
    line: jest.fn(),
    addPage: jest.fn(),
    getTextWidth: jest.fn(() => 50),
    splitTextToSize: jest.fn((text) => [text]),
    save: jest.fn()
  }))
}));

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

describe('QuestionList PDF Export Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Solved Examples Format Integration', () => {
    it('integrates with PDF service to export single combined PDF', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={mockQuestions} outputFormat="solved-examples" />);
      
      const exportButton = screen.getByText('Download PDF');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const callArgs = generatePDFSpy.mock.calls[0];
      const document = callArgs[0];
      
      // Verify document structure for solved examples
      expect(document.title).toBe('Solved Examples');
      expect(document.type).toBe('combined');
      expect(document.content).toContain('**Question 1:**');
      expect(document.content).toContain('**Question 2:**');
      expect(document.content).toContain('What is the capital of France?');
      expect(document.content).toContain('**Answer 1:**');
      expect(document.content).toContain('**Answer 2:**');
      expect(document.content).toContain('Paris');
      expect(document.content).toContain('Photosynthesis');
      
      generatePDFSpy.mockRestore();
    });

    it('shows loading state during PDF generation for solved examples', async () => {
      let resolvePromise: () => void;
      const generatePDFPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      
      jest.spyOn(pdfService, 'generatePDF').mockReturnValue(generatePDFPromise);
      
      render(<QuestionList questions={mockQuestions} outputFormat="solved-examples" />);
      
      const exportButton = screen.getByText('Download PDF');
      fireEvent.click(exportButton);
      
      // Should show loading state
      expect(screen.getByText(/generating/i)).toBeInTheDocument();
      expect(exportButton).toBeDisabled();
      
      // Resolve the promise
      resolvePromise!();
      
      await waitFor(() => {
        expect(screen.queryByText(/generating/i)).not.toBeInTheDocument();
        expect(exportButton).not.toBeDisabled();
      });
    });
  });

  describe('Assignment Format Integration', () => {
    it('integrates with PDF service to export assignment format PDF', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={mockQuestions} outputFormat="assignment-format" />);
      
      const exportButton = screen.getByText('Download PDF');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const callArgs = generatePDFSpy.mock.calls[0];
      const document = callArgs[0];
      
      // Verify document structure for assignment format
      expect(document.title).toBe('Assignment with Answer Key');
      expect(document.type).toBe('combined');
      expect(document.content).toContain('# Questions');
      expect(document.content).toContain('# Answer Key');
      expect(document.content).toContain('**Question 1:**');
      expect(document.content).toContain('**Answer 1:**');
      expect(document.content).toContain('---'); // Separator between sections
      
      generatePDFSpy.mockRestore();
    });

    it('handles PDF generation errors for assignment format', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF')
        .mockRejectedValue(new Error('PDF generation failed'));
      
      render(<QuestionList questions={mockQuestions} outputFormat="assignment-format" />);
      
      const exportButton = screen.getByText('Download PDF');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to generate pdf/i)).toBeInTheDocument();
      });
      
      // Should show error state
      expect(screen.getByText(/please try again/i)).toBeInTheDocument();
      expect(exportButton).not.toBeDisabled(); // Should be re-enabled for retry
      
      generatePDFSpy.mockRestore();
    });
  });

  describe('Separate Documents Format Integration', () => {
    it('integrates with PDF service to export questions PDF separately', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={mockQuestions} outputFormat="separate-documents" />);
      
      const questionsButton = screen.getByText('Download Questions PDF');
      fireEvent.click(questionsButton);
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const callArgs = generatePDFSpy.mock.calls[0];
      const document = callArgs[0];
      
      // Verify questions document structure
      expect(document.title).toBe('Questions');
      expect(document.type).toBe('questions');
      expect(document.content).toContain('**Question 1:**');
      expect(document.content).toContain('**Question 2:**');
      expect(document.content).toContain('What is the capital of France?');
      expect(document.content).toContain('Explain the process of photosynthesis.');
      
      // Should NOT contain answers
      expect(document.content).not.toContain('**Answer 1:**');
      expect(document.content).not.toContain('**Answer 2:**');
      expect(document.content).not.toContain('Paris is the capital and largest city');
      
      generatePDFSpy.mockRestore();
    });

    it('integrates with PDF service to export answers PDF separately', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={mockQuestions} outputFormat="separate-documents" />);
      
      const answersButton = screen.getByText('Download Answers PDF');
      fireEvent.click(answersButton);
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const callArgs = generatePDFSpy.mock.calls[0];
      const document = callArgs[0];
      
      // Verify answers document structure
      expect(document.title).toBe('Answer Key');
      expect(document.type).toBe('answers');
      expect(document.content).toContain('**Answer 1:**');
      expect(document.content).toContain('**Answer 2:**');
      expect(document.content).toContain('Paris');
      expect(document.content).toContain('Photosynthesis is the process');
      expect(document.content).toContain('**Explanation:**');
      
      // Should NOT contain question stems
      expect(document.content).not.toContain('What is the capital of France?');
      expect(document.content).not.toContain('Explain the process of photosynthesis.');
      
      generatePDFSpy.mockRestore();
    });

    it('handles independent loading states for separate document exports', async () => {
      let resolveQuestionsPromise: () => void;
      let resolveAnswersPromise: () => void;
      
      const questionsPromise = new Promise<void>((resolve) => {
        resolveQuestionsPromise = resolve;
      });
      
      const answersPromise = new Promise<void>((resolve) => {
        resolveAnswersPromise = resolve;
      });
      
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF')
        .mockImplementationOnce(() => questionsPromise)
        .mockImplementationOnce(() => answersPromise);
      
      render(<QuestionList questions={mockQuestions} outputFormat="separate-documents" />);
      
      const questionsButton = screen.getByText('Download Questions PDF');
      const answersButton = screen.getByText('Download Answers PDF');
      
      // Start questions export
      fireEvent.click(questionsButton);
      
      // Should show loading for questions button
      expect(screen.getAllByText(/generating/i)).toHaveLength(2); // Both buttons show loading
      expect(questionsButton).toBeDisabled();
      expect(answersButton).toBeDisabled(); // Both should be disabled during generation
      
      // Resolve questions promise
      resolveQuestionsPromise!();
      
      await waitFor(() => {
        expect(questionsButton).not.toBeDisabled();
        expect(answersButton).not.toBeDisabled();
      });
      
      // Start answers export
      fireEvent.click(answersButton);
      
      // Should show loading for answers button
      expect(screen.getByText(/generating/i)).toBeInTheDocument();
      expect(questionsButton).toBeDisabled();
      expect(answersButton).toBeDisabled();
      
      // Resolve answers promise
      resolveAnswersPromise!();
      
      await waitFor(() => {
        expect(questionsButton).not.toBeDisabled();
        expect(answersButton).not.toBeDisabled();
        expect(screen.queryByText(/generating/i)).not.toBeInTheDocument();
      });
      
      generatePDFSpy.mockRestore();
    });

    it('handles errors independently for separate document exports', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF')
        .mockRejectedValueOnce(new Error('Questions PDF failed'))
        .mockResolvedValueOnce();
      
      render(<QuestionList questions={mockQuestions} outputFormat="separate-documents" />);
      
      const questionsButton = screen.getByText('Download Questions PDF');
      const answersButton = screen.getByText('Download Answers PDF');
      
      // Try to export questions (should fail)
      fireEvent.click(questionsButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to generate questions pdf/i)).toBeInTheDocument();
      });
      
      // Try to export answers (should succeed)
      fireEvent.click(answersButton);
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(2);
      });
      
      // Error should still be visible, but answers export should work
      expect(screen.getByText(/failed to generate questions pdf/i)).toBeInTheDocument();
      
      generatePDFSpy.mockRestore();
    });
  });

  describe('Format-Specific Export Logic', () => {
    it('uses correct formatter for each output format', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      // Test solved examples
      const { rerender } = render(<QuestionList questions={mockQuestions} outputFormat="solved-examples" />);
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      let document = generatePDFSpy.mock.calls[0][0];
      expect(document.title).toBe('Solved Examples');
      expect(document.type).toBe('combined');
      
      generatePDFSpy.mockClear();
      
      // Test assignment format
      rerender(<QuestionList questions={mockQuestions} outputFormat="assignment-format" />);
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      document = generatePDFSpy.mock.calls[0][0];
      expect(document.title).toBe('Assignment with Answer Key');
      expect(document.type).toBe('combined');
      expect(document.content).toContain('# Questions');
      expect(document.content).toContain('# Answer Key');
      
      generatePDFSpy.mockRestore();
    });

    it('generates appropriate documents for separate-documents format', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={mockQuestions} outputFormat="separate-documents" />);
      
      // Export questions
      fireEvent.click(screen.getByText('Download Questions PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      let document = generatePDFSpy.mock.calls[0][0];
      expect(document.title).toBe('Questions');
      expect(document.type).toBe('questions');
      
      // Export answers
      fireEvent.click(screen.getByText('Download Answers PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(2);
      });
      
      document = generatePDFSpy.mock.calls[1][0];
      expect(document.title).toBe('Answer Key');
      expect(document.type).toBe('answers');
      
      generatePDFSpy.mockRestore();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles empty questions array gracefully', () => {
      render(<QuestionList questions={[]} outputFormat="solved-examples" />);
      
      // Should not render PDF export controls when no questions
      expect(screen.queryByText('Download PDF')).not.toBeInTheDocument();
    });

    it('handles questions without options correctly in PDF export', async () => {
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

      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={subjectiveQuestions} outputFormat="solved-examples" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      expect(document.content).toContain('Explain quantum mechanics.');
      expect(document.content).toContain('Quantum mechanics is a fundamental theory');
      expect(document.content).not.toContain('A.'); // No options
      
      generatePDFSpy.mockRestore();
    });

    it('handles questions without explanations correctly in PDF export', async () => {
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

      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={questionsWithoutExplanation} outputFormat="solved-examples" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      expect(document.content).toContain('What is 2 + 2?');
      expect(document.content).toContain('**Answer 1:** 4');
      expect(document.content).not.toContain('**Explanation:**'); // No explanation
      
      generatePDFSpy.mockRestore();
    });

    it('maintains proper error recovery after failed exports', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF')
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce();
      
      render(<QuestionList questions={mockQuestions} outputFormat="solved-examples" />);
      
      const exportButton = screen.getByText('Download PDF');
      
      // First attempt should fail
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to generate pdf/i)).toBeInTheDocument();
      });
      
      // Dismiss error
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);
      
      expect(screen.queryByText(/failed to generate pdf/i)).not.toBeInTheDocument();
      
      // Second attempt should succeed
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(2);
      });
      
      // Should not show error
      expect(screen.queryByText(/failed to generate pdf/i)).not.toBeInTheDocument();
      
      generatePDFSpy.mockRestore();
    });
  });

  describe('User Experience Integration', () => {
    it('provides appropriate tooltips for different export formats', () => {
      const { rerender } = render(<QuestionList questions={mockQuestions} outputFormat="solved-examples" />);
      
      // Solved examples tooltip
      const solvedExamplesButton = screen.getByText('Download PDF');
      expect(solvedExamplesButton).toHaveAttribute('title', 
        'Download a PDF with questions and answers shown together as solved examples');
      
      // Assignment format tooltip
      rerender(<QuestionList questions={mockQuestions} outputFormat="assignment-format" />);
      const assignmentButton = screen.getByText('Download PDF');
      expect(assignmentButton).toHaveAttribute('title', 
        'Download a PDF with questions followed by an answer key section');
      
      // Separate documents tooltips
      rerender(<QuestionList questions={mockQuestions} outputFormat="separate-documents" />);
      const questionsButton = screen.getByText('Download Questions PDF');
      const answersButton = screen.getByText('Download Answers PDF');
      
      expect(questionsButton).toHaveAttribute('title', 
        'Download a PDF containing only the questions without answers');
      expect(answersButton).toHaveAttribute('title', 
        'Download a PDF containing only the answer key with explanations');
    });

    it('displays correct question count and format information', () => {
      render(<QuestionList questions={mockQuestions} outputFormat="assignment-format" />);
      
      // Should show question count and format
      expect(screen.getByText(/2 questions/i)).toBeInTheDocument();
      expect(screen.getByText(/format: assignment format/i)).toBeInTheDocument();
    });

    it('shows last export timestamp after successful export', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={mockQuestions} outputFormat="solved-examples" />);
      
      const exportButton = screen.getByText('Download PDF');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      // Should show last exported timestamp
      expect(screen.getByText(/last exported:/i)).toBeInTheDocument();
      
      generatePDFSpy.mockRestore();
    });
  });
});