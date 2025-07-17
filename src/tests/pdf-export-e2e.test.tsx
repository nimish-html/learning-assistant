import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestionList from '@/components/QuestionList';
import { Question } from '@/lib/schema';
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

describe('PDF Export End-to-End Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete PDF Export Workflow', () => {
    const basicQuestions: Question[] = [
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
        stem: 'Calculate 15 × 8',
        options: ['110', '120', '130', '140'],
        answer: '120',
        explanation: '15 × 8 = 120',
        difficulty: 'Amateur',
        subject: 'Mathematics'
      }
    ];

    it('should complete full workflow for solved examples format', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={basicQuestions} outputFormat="solved-examples" />);
      
      // Verify initial state
      expect(screen.getByText('Export to PDF')).toBeInTheDocument();
      expect(screen.getByText('Download PDF')).toBeInTheDocument();
      expect(screen.getByText(/2 questions/i)).toBeInTheDocument();
      
      // Start export
      const exportButton = screen.getByText('Download PDF');
      fireEvent.click(exportButton);
      
      // Wait for PDF service to be called
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      // Verify PDF service was called correctly
      const callArgs = generatePDFSpy.mock.calls[0];
      const document = callArgs[0];
      
      expect(document.title).toBe('Solved Examples');
      expect(document.type).toBe('combined');
      expect(document.content).toContain('What is the capital of France?');
      expect(document.content).toContain('Paris');
      expect(document.content).toContain('Calculate 15 × 8');
      expect(document.content).toContain('120');
      
      generatePDFSpy.mockRestore();
    });

    it('should complete full workflow for assignment format', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={basicQuestions} outputFormat="assignment-format" />);
      
      const exportButton = screen.getByText('Download PDF');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      expect(document.title).toBe('Assignment with Answer Key');
      expect(document.type).toBe('combined');
      expect(document.content).toContain('# Questions');
      expect(document.content).toContain('# Answer Key');
      expect(document.content).toContain('---'); // Section separator
      
      generatePDFSpy.mockRestore();
    });

    it('should complete full workflow for separate documents format', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={basicQuestions} outputFormat="separate-documents" />);
      
      // Export questions
      const questionsButton = screen.getByText('Download Questions PDF');
      fireEvent.click(questionsButton);
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      let document = generatePDFSpy.mock.calls[0][0];
      expect(document.title).toBe('Questions');
      expect(document.type).toBe('questions');
      expect(document.content).toContain('What is the capital of France?');
      expect(document.content).not.toContain('Paris is the capital');
      
      // Export answers
      const answersButton = screen.getByText('Download Answers PDF');
      fireEvent.click(answersButton);
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(2);
      });
      
      document = generatePDFSpy.mock.calls[1][0];
      expect(document.title).toBe('Answer Key');
      expect(document.type).toBe('answers');
      expect(document.content).toContain('Paris');
      expect(document.content).toContain('120');
      expect(document.content).not.toContain('What is the capital of France?');
      
      generatePDFSpy.mockRestore();
    });
  });

  describe('Mathematical Expressions and Special Characters', () => {
    const mathQuestions: Question[] = [
      {
        id: '1',
        stem: 'Solve for x: 2x² + 5x - 3 = 0',
        options: ['x = 1/2, x = -3', 'x = -1/2, x = 3', 'x = 2, x = -3/2', 'x = -2, x = 3/2'],
        answer: 'x = 1/2, x = -3',
        explanation: 'Using the quadratic formula: x = (-5 ± √(25 + 24))/4 = (-5 ± 7)/4',
        difficulty: 'Ninja',
        subject: 'Mathematics'
      },
      {
        id: '2',
        stem: 'What is the integral ∫(2x + 3)dx?',
        answer: 'x² + 3x + C',
        explanation: '∫(2x + 3)dx = ∫2x dx + ∫3 dx = x² + 3x + C',
        difficulty: 'Ninja',
        subject: 'Calculus'
      }
    ];

    it('should handle mathematical expressions in PDF export', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={mathQuestions} outputFormat="solved-examples" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      
      // Verify mathematical expressions are preserved
      expect(document.content).toContain('2x² + 5x - 3 = 0');
      expect(document.content).toContain('∫(2x + 3)dx');
      expect(document.content).toContain('x² + 3x + C');
      expect(document.content).toContain('√(25 + 24)');
      
      generatePDFSpy.mockRestore();
    });

    it('should handle special characters and symbols', async () => {
      const specialCharQuestions: Question[] = [
        {
          id: '1',
          stem: 'Which Greek letters are commonly used in mathematics? α, β, γ, δ, π, σ, Ω',
          answer: 'All of the above are commonly used',
          explanation: 'Greek letters like α (alpha), β (beta), γ (gamma), δ (delta), π (pi), σ (sigma), and Ω (omega) are frequently used in mathematical notation.',
          difficulty: 'Amateur',
          subject: 'Mathematics'
        }
      ];

      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={specialCharQuestions} outputFormat="solved-examples" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      
      // Verify special characters are preserved
      expect(document.content).toContain('α, β, γ, δ, π, σ, Ω');
      expect(document.content).toContain('α (alpha)');
      expect(document.content).toContain('Ω (omega)');
      
      generatePDFSpy.mockRestore();
    });
  });

  describe('Different Output Format Validation', () => {
    const testQuestions: Question[] = [
      {
        id: '1',
        stem: 'Test question 1',
        options: ['A', 'B', 'C', 'D'],
        answer: 'B',
        explanation: 'Test explanation 1',
        difficulty: 'Beginner',
        subject: 'Test'
      },
      {
        id: '2',
        stem: 'Test question 2',
        answer: 'Test answer 2',
        explanation: 'Test explanation 2',
        difficulty: 'Amateur',
        subject: 'Test'
      }
    ];

    it('should validate solved examples format structure', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={testQuestions} outputFormat="solved-examples" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      
      // Validate structure
      expect(document.title).toBe('Solved Examples');
      expect(document.type).toBe('combined');
      
      // Should contain questions and answers together
      expect(document.content).toContain('**Question 1:**');
      expect(document.content).toContain('**Answer 1:**');
      expect(document.content).toContain('**Question 2:**');
      expect(document.content).toContain('**Answer 2:**');
      
      // Should contain explanations
      expect(document.content).toContain('**Explanation:**');
      expect(document.content).toContain('Test explanation 1');
      expect(document.content).toContain('Test explanation 2');
      
      generatePDFSpy.mockRestore();
    });

    it('should validate assignment format structure', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={testQuestions} outputFormat="assignment-format" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      
      // Validate structure
      expect(document.title).toBe('Assignment with Answer Key');
      expect(document.type).toBe('combined');
      
      // Should have separate sections
      expect(document.content).toContain('# Questions');
      expect(document.content).toContain('# Answer Key');
      expect(document.content).toContain('---'); // Section separator
      
      // Questions section should come before answers
      const questionsIndex = document.content.indexOf('# Questions');
      const answersIndex = document.content.indexOf('# Answer Key');
      expect(questionsIndex).toBeLessThan(answersIndex);
      
      generatePDFSpy.mockRestore();
    });

    it('should validate separate documents format structure', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={testQuestions} outputFormat="separate-documents" />);
      
      // Test questions document
      fireEvent.click(screen.getByText('Download Questions PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      let document = generatePDFSpy.mock.calls[0][0];
      
      // Validate questions document
      expect(document.title).toBe('Questions');
      expect(document.type).toBe('questions');
      expect(document.content).toContain('Test question 1');
      expect(document.content).toContain('Test question 2');
      expect(document.content).not.toContain('Test answer');
      expect(document.content).not.toContain('Test explanation');
      
      // Test answers document
      fireEvent.click(screen.getByText('Download Answers PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(2);
      });
      
      document = generatePDFSpy.mock.calls[1][0];
      
      // Validate answers document
      expect(document.title).toBe('Answer Key');
      expect(document.type).toBe('answers');
      expect(document.content).toContain('Test answer 2');
      expect(document.content).toContain('Test explanation 1');
      expect(document.content).toContain('Test explanation 2');
      expect(document.content).not.toContain('Test question 1');
      expect(document.content).not.toContain('Test question 2');
      
      generatePDFSpy.mockRestore();
    });
  });

  describe('Edge Cases and Large Documents', () => {
    it('should handle large number of questions', async () => {
      // Generate 25 questions for testing
      const largeQuestionSet: Question[] = Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}`,
        stem: `Question ${i + 1}: What is ${i + 1} + ${i + 1}?`,
        options: [`${(i + 1) * 2 - 1}`, `${(i + 1) * 2}`, `${(i + 1) * 2 + 1}`, `${(i + 1) * 2 + 2}`],
        answer: `${(i + 1) * 2}`,
        explanation: `${i + 1} + ${i + 1} = ${(i + 1) * 2}`,
        difficulty: 'Beginner' as const,
        subject: 'Mathematics'
      }));

      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={largeQuestionSet} outputFormat="solved-examples" />);
      
      expect(screen.getByText(/25 questions/i)).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      
      // Verify questions are included
      expect(document.content).toContain('Question 1:');
      expect(document.content).toContain('Question 25:');
      
      // Verify content length is substantial
      expect(document.content.length).toBeGreaterThan(2000);
      
      generatePDFSpy.mockRestore();
    });

    it('should handle questions with missing optional fields', async () => {
      const incompleteQuestions: Question[] = [
        {
          id: '1',
          stem: 'Question without options or explanation',
          answer: 'Simple answer',
          difficulty: 'Beginner',
          subject: 'Test'
          // No options, no explanation
        },
        {
          id: '2',
          stem: 'Question with options but no explanation',
          options: ['A', 'B', 'C', 'D'],
          answer: 'B',
          difficulty: 'Amateur',
          subject: 'Test'
          // No explanation
        }
      ];

      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={incompleteQuestions} outputFormat="solved-examples" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      
      // Should handle missing fields gracefully
      expect(document.content).toContain('Question without options');
      expect(document.content).toContain('Simple answer');
      expect(document.content).toContain('Question with options');
      
      generatePDFSpy.mockRestore();
    });
  });

  describe('Malformed Content Handling', () => {
    it('should handle questions with malformed HTML/markdown', async () => {
      const malformedQuestions: Question[] = [
        {
          id: '1',
          stem: 'Question with <script>alert("xss")</script> malicious content',
          answer: 'Answer with **unclosed markdown',
          explanation: 'Explanation with <div>unclosed HTML tags',
          difficulty: 'Beginner',
          subject: 'Security'
        }
      ];

      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={malformedQuestions} outputFormat="solved-examples" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      
      // Should sanitize and handle malformed content
      expect(document.content).toContain('malicious content');
      expect(document.content).toContain('unclosed markdown');
      
      // Should not contain actual script tags
      expect(document.content).not.toContain('<script>');
      expect(document.content).not.toContain('alert(');
      
      generatePDFSpy.mockRestore();
    });
  });

  describe('Browser Compatibility and Error Recovery', () => {
    it('should handle PDF generation failures gracefully', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF')
        .mockRejectedValue(new Error('PDF generation failed'));
      
      const testQuestions: Question[] = [
        {
          id: '1',
          stem: 'Test question',
          answer: 'Test answer',
          difficulty: 'Beginner',
          subject: 'Test'
        }
      ];

      render(<QuestionList questions={testQuestions} outputFormat="solved-examples" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(screen.getByText(/failed to generate pdf/i)).toBeInTheDocument();
      });
      
      // Should show error message
      expect(screen.getByText(/please try again/i)).toBeInTheDocument();
      
      generatePDFSpy.mockRestore();
    });

    it('should handle browser compatibility issues', async () => {
      const { PDFExportError } = require('@/lib/pdf-service');
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF')
        .mockRejectedValue(new PDFExportError('Browser not supported', 'BROWSER_UNSUPPORTED'));
      
      const testQuestions: Question[] = [
        {
          id: '1',
          stem: 'Test question',
          answer: 'Test answer',
          difficulty: 'Beginner',
          subject: 'Test'
        }
      ];

      render(<QuestionList questions={testQuestions} outputFormat="solved-examples" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(screen.getByText(/browser does not support/i)).toBeInTheDocument();
      });
      
      // Should not show retry option for browser compatibility issues
      expect(screen.queryByText(/retry/i)).not.toBeInTheDocument();
      
      generatePDFSpy.mockRestore();
    });

    it('should recover from errors and allow successful retry', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF')
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce();
      
      const testQuestions: Question[] = [
        {
          id: '1',
          stem: 'Test question',
          answer: 'Test answer',
          difficulty: 'Beginner',
          subject: 'Test'
        }
      ];

      render(<QuestionList questions={testQuestions} outputFormat="solved-examples" />);
      
      // First attempt should fail
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(screen.getByText(/failed to generate pdf/i)).toBeInTheDocument();
      });
      
      // Dismiss error and try again
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);
      
      expect(screen.queryByText(/failed to generate pdf/i)).not.toBeInTheDocument();
      
      // Second attempt should succeed
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(2);
      });
      
      // Should not show error
      expect(screen.queryByText(/failed to generate pdf/i)).not.toBeInTheDocument();
      
      generatePDFSpy.mockRestore();
    });
  });
});