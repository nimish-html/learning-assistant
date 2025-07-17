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

describe('PDF Export End-to-End Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete PDF Export Workflow - All Formats', () => {
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
    it('should handle complex mathematical expressions', async () => {
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
        },
        {
          id: '3',
          stem: 'Express in scientific notation: 0.000456',
          options: ['4.56 × 10⁻⁴', '4.56 × 10⁻³', '45.6 × 10⁻⁵', '0.456 × 10⁻³'],
          answer: '4.56 × 10⁻⁴',
          explanation: 'Move decimal point 4 places right: 4.56 × 10⁻⁴',
          difficulty: 'Amateur',
          subject: 'Mathematics'
        }
      ];

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
      expect(document.content).toContain('4.56 × 10⁻⁴');
      expect(document.content).toContain('√(25 + 24)');
      
      generatePDFSpy.mockRestore();
    });

    it('should handle Greek letters and mathematical symbols', async () => {
      const greekQuestions: Question[] = [
        {
          id: '1',
          stem: 'Which Greek letters are commonly used in mathematics? α, β, γ, δ, π, σ, Ω',
          answer: 'All of the above are commonly used',
          explanation: 'Greek letters like α (alpha), β (beta), γ (gamma), δ (delta), π (pi), σ (sigma), and Ω (omega) are frequently used in mathematical notation.',
          difficulty: 'Amateur',
          subject: 'Mathematics'
        },
        {
          id: '2',
          stem: 'What does the symbol ∀ mean in logic?',
          options: ['For all', 'There exists', 'If and only if', 'Therefore'],
          answer: 'For all',
          explanation: '∀ is the universal quantifier meaning "for all" or "for every"',
          difficulty: 'Ninja',
          subject: 'Logic'
        },
        {
          id: '3',
          stem: 'Mathematical operators: ∑, ∏, ∫, ∂, ∇, ∆',
          answer: 'Sum, Product, Integral, Partial derivative, Nabla, Delta',
          explanation: 'These are common mathematical operators used in calculus and analysis.',
          difficulty: 'Ninja',
          subject: 'Mathematics'
        }
      ];

      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={greekQuestions} outputFormat="solved-examples" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      
      // Verify special characters are preserved
      expect(document.content).toContain('α, β, γ, δ, π, σ, Ω');
      expect(document.content).toContain('∀');
      expect(document.content).toContain('∑, ∏, ∫, ∂, ∇, ∆');
      expect(document.content).toContain('α (alpha)');
      expect(document.content).toContain('Ω (omega)');
      
      generatePDFSpy.mockRestore();
    });

    it('should handle Unicode characters and emojis', async () => {
      const unicodeQuestions: Question[] = [
        {
          id: '1',
          stem: 'What is the chemical formula for water? H₂O 💧',
          answer: 'H₂O',
          explanation: 'Water consists of two hydrogen atoms and one oxygen atom: H₂O 🧪',
          difficulty: 'Beginner',
          subject: 'Chemistry'
        },
        {
          id: '2',
          stem: 'Temperature symbols: °C, °F, K ❄️🔥',
          answer: 'Celsius, Fahrenheit, Kelvin',
          explanation: 'These are the three main temperature scales used in science.',
          difficulty: 'Beginner',
          subject: 'Physics'
        }
      ];

      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={unicodeQuestions} outputFormat="solved-examples" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      
      // Verify Unicode characters and emojis are preserved
      expect(document.content).toContain('H₂O 💧');
      expect(document.content).toContain('H₂O 🧪');
      expect(document.content).toContain('°C, °F, K ❄️🔥');
      
      generatePDFSpy.mockRestore();
    });
  });

  describe('Output Format Validation Across All Formats', () => {
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

    it('should validate solved examples format structure and content', async () => {
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

    it('should validate assignment format structure and section ordering', async () => {
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
      
      // Verify content separation
      const separatorIndex = document.content.indexOf('---');
      expect(separatorIndex).toBeGreaterThan(questionsIndex);
      expect(separatorIndex).toBeLessThan(answersIndex);
      
      generatePDFSpy.mockRestore();
    });

    it('should validate separate documents format with proper content isolation', async () => {
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
      expect(document.content).toContain('A.');
      expect(document.content).toContain('B.');
      expect(document.content).toContain('C.');
      expect(document.content).toContain('D.');
      
      // Should NOT contain answers or explanations
      expect(document.content).not.toContain('Test answer');
      expect(document.content).not.toContain('Test explanation');
      expect(document.content).not.toContain('**Answer');
      expect(document.content).not.toContain('**Explanation');
      
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
      expect(document.content).toContain('**Answer');
      expect(document.content).toContain('**Explanation');
      
      // Should NOT contain question stems or options
      expect(document.content).not.toContain('Test question 1');
      expect(document.content).not.toContain('Test question 2');
      expect(document.content).not.toContain('A.');
      expect(document.content).not.toContain('B.');
      
      generatePDFSpy.mockRestore();
    });

    it('should handle format switching correctly', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      const { rerender } = render(<QuestionList questions={testQuestions} outputFormat="solved-examples" />);
      
      // Export as solved examples
      fireEvent.click(screen.getByText('Download PDF'));
      await waitFor(() => expect(generatePDFSpy).toHaveBeenCalledTimes(1));
      
      let document = generatePDFSpy.mock.calls[0][0];
      expect(document.title).toBe('Solved Examples');
      
      // Switch to assignment format
      rerender(<QuestionList questions={testQuestions} outputFormat="assignment-format" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      await waitFor(() => expect(generatePDFSpy).toHaveBeenCalledTimes(2));
      
      document = generatePDFSpy.mock.calls[1][0];
      expect(document.title).toBe('Assignment with Answer Key');
      
      // Switch to separate documents
      rerender(<QuestionList questions={testQuestions} outputFormat="separate-documents" />);
      
      fireEvent.click(screen.getByText('Download Questions PDF'));
      await waitFor(() => expect(generatePDFSpy).toHaveBeenCalledTimes(3));
      
      document = generatePDFSpy.mock.calls[2][0];
      expect(document.title).toBe('Questions');
      
      generatePDFSpy.mockRestore();
    });
  });

  describe('Edge Cases and Large Documents', () => {
    it('should handle large number of questions efficiently', async () => {
      // Generate 50 questions for testing
      const largeQuestionSet: Question[] = Array.from({ length: 50 }, (_, i) => ({
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
      
      expect(screen.getByText(/50 questions/i)).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      
      // Verify all questions are included
      expect(document.content).toContain('Question 1:');
      expect(document.content).toContain('Question 25:');
      expect(document.content).toContain('Question 50:');
      
      // Verify content length is substantial
      expect(document.content.length).toBeGreaterThan(5000);
      
      // Verify structure is maintained even with large content
      const questionMatches = document.content.match(/\*\*Question \d+:\*\*/g);
      expect(questionMatches).toHaveLength(50);
      
      const answerMatches = document.content.match(/\*\*Answer \d+:\*\*/g);
      expect(answerMatches).toHaveLength(50);
      
      generatePDFSpy.mockRestore();
    });

    it('should handle questions with very long content', async () => {
      const longContentQuestions: Question[] = [
        {
          id: '1',
          stem: 'This is a very long question stem that contains multiple sentences and detailed information about a complex scenario. ' +
                'It includes background context, specific details, and multiple clauses that make it quite lengthy. ' +
                'The question continues with even more information to test how the PDF export handles long text content. ' +
                'Additional sentences are added to ensure we test the text wrapping and formatting capabilities thoroughly.',
          options: [
            'This is option A with a very detailed explanation that spans multiple lines and contains comprehensive information',
            'This is option B with equally detailed content that tests the formatting of long option text in PDF exports',
            'Option C also contains extensive text to verify proper handling of lengthy multiple choice options',
            'Option D rounds out the choices with another long explanation that tests PDF text formatting capabilities'
          ],
          answer: 'This is option A with a very detailed explanation that spans multiple lines and contains comprehensive information',
          explanation: 'This is an extremely detailed explanation that provides comprehensive coverage of the topic. ' +
                      'It includes multiple paragraphs of information, detailed reasoning, step-by-step analysis, ' +
                      'and thorough justification for the correct answer. The explanation continues with additional ' +
                      'context and supporting information to ensure complete understanding of the concept.',
          difficulty: 'Ninja',
          subject: 'Complex Topics'
        }
      ];

      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={longContentQuestions} outputFormat="solved-examples" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      
      // Verify long content is preserved
      expect(document.content).toContain('very long question stem');
      expect(document.content).toContain('extremely detailed explanation');
      expect(document.content).toContain('comprehensive coverage');
      expect(document.content).toContain('multiple paragraphs');
      
      // Verify content length
      expect(document.content.length).toBeGreaterThan(1000);
      
      generatePDFSpy.mockRestore();
    });

    it('should handle questions with missing optional fields gracefully', async () => {
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
        },
        {
          id: '3',
          stem: 'Question with explanation but no options',
          answer: 'Answer with explanation',
          explanation: 'This is the explanation',
          difficulty: 'Ninja',
          subject: 'Test'
          // No options
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
      expect(document.content).toContain('Question with explanation');
      expect(document.content).toContain('This is the explanation');
      
      // Verify structure is maintained
      expect(document.content).toContain('**Question 1:**');
      expect(document.content).toContain('**Question 2:**');
      expect(document.content).toContain('**Question 3:**');
      
      generatePDFSpy.mockRestore();
    });

    it('should handle empty or minimal questions gracefully', async () => {
      const minimalQuestions: Question[] = [
        {
          id: '1',
          stem: 'Q?',
          answer: 'A',
          difficulty: 'Beginner',
          subject: 'Test'
        },
        {
          id: '2',
          stem: '',
          answer: '',
          difficulty: 'Beginner',
          subject: 'Test'
        }
      ];

      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={minimalQuestions} outputFormat="solved-examples" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      
      // Should handle minimal content without errors
      expect(document.content).toContain('**Question 1:**');
      expect(document.content).toContain('**Question 2:**');
      
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
        },
        {
          id: '2',
          stem: 'Question with \\n\\t special \\r characters and \\0 null bytes',
          answer: 'Answer with unicode null',
          explanation: 'Explanation with replacement character',
          difficulty: 'Amateur',
          subject: 'Encoding'
        }
      ];

      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={malformedQuestions} outputFormat="solved-examples" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      
      // Should handle malformed content without crashing
      expect(document.content).toContain('malicious content');
      expect(document.content).toContain('unclosed markdown');
      expect(document.content).toContain('special');
      expect(document.content).toContain('characters');
      
      // Note: The formatters preserve content as-is, so malformed HTML/markdown is preserved
      expect(document.content).toContain('<script>');
      expect(document.content).toContain('<div>');
      
      generatePDFSpy.mockRestore();
    });

    it('should handle questions with invalid JSON-like content', async () => {
      const invalidJsonQuestions: Question[] = [
        {
          id: '1',
          stem: 'Question with {invalid: json, missing: "quotes"} content',
          answer: 'Answer with [unclosed, array content',
          explanation: 'Explanation with {"nested": {"objects": without proper closing',
          difficulty: 'Beginner',
          subject: 'Data'
        }
      ];

      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={invalidJsonQuestions} outputFormat="solved-examples" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      
      // Should preserve the content as-is without trying to parse it
      expect(document.content).toContain('invalid: json');
      expect(document.content).toContain('unclosed, array');
      expect(document.content).toContain('nested');
      
      generatePDFSpy.mockRestore();
    });

    it('should handle questions with extreme whitespace and formatting', async () => {
      const whitespaceQuestions: Question[] = [
        {
          id: '1',
          stem: '   Question   with   excessive   whitespace   ',
          answer: '\n\n\nAnswer\nwith\nmultiple\nline\nbreaks\n\n\n',
          explanation: '\t\t\tExplanation\t\twith\t\ttabs\t\t\t',
          difficulty: 'Beginner',
          subject: 'Formatting'
        },
        {
          id: '2',
          stem: '',
          answer: '   ',
          explanation: '\n\t\r\n',
          difficulty: 'Amateur',
          subject: 'Edge Cases'
        }
      ];

      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
      render(<QuestionList questions={whitespaceQuestions} outputFormat="solved-examples" />);
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      const document = generatePDFSpy.mock.calls[0][0];
      
      // Should handle whitespace appropriately
      expect(document.content).toContain('excessive');
      expect(document.content).toContain('whitespace');
      expect(document.content).toContain('Answer');
      expect(document.content).toContain('line');
      expect(document.content).toContain('breaks');
      
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
        expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
      });
      
      // Should show error message and retry option
      expect(screen.getByText(/click "retry" to try again/i)).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
      
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

    it('should handle download failures with retry capability', async () => {
      const { PDFExportError } = require('@/lib/pdf-service');
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF')
        .mockRejectedValue(new PDFExportError('Download failed', 'DOWNLOAD_FAILED'));
      
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
        expect(screen.getByText(/failed to download/i)).toBeInTheDocument();
      });
      
      // Should show retry option for download failures
      expect(screen.getByText(/retry/i)).toBeInTheDocument();
      
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
        expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
      });
      
      // Dismiss error and try again
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);
      
      expect(screen.queryByText(/unexpected error occurred/i)).not.toBeInTheDocument();
      
      // Second attempt should succeed
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(2);
      });
      
      // Should not show error
      expect(screen.queryByText(/unexpected error occurred/i)).not.toBeInTheDocument();
      
      generatePDFSpy.mockRestore();
    });

    it('should maintain component stability after export operations', async () => {
      const generatePDFSpy = jest.spyOn(pdfService, 'generatePDF').mockResolvedValue();
      
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
      
      const exportButton = screen.getByText('Download PDF');
      
      // Export PDF to test component stability
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(generatePDFSpy).toHaveBeenCalledTimes(1);
      });
      
      // Verify document was generated correctly
      const document = generatePDFSpy.mock.calls[0][0];
      expect(document.title).toBe('Solved Examples');
      expect(document.type).toBe('combined');
      expect(document.content).toContain('Test question');
      expect(document.content).toContain('Test answer');
      
      generatePDFSpy.mockRestore();
    });
  });
});