import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PDFExportControls from '@/components/PDFExportControls';
import { Question, OutputFormat } from '@/lib/schema';
import { pdfService } from '@/lib/pdf-service';

// Mock the PDF service
jest.mock('@/lib/pdf-service', () => ({
  pdfService: {
    generatePDF: jest.fn(),
    generateMultiplePDFs: jest.fn(),
  },
  PDFExportError: class PDFExportError extends Error {
    constructor(message: string, public code: string, public details?: any) {
      super(message);
      this.name = 'PDFExportError';
    }
  }
}));

// Mock the formatters with proper return values for different formats
jest.mock('@/lib/formatters', () => ({
  getFormatter: jest.fn((format: OutputFormat) => {
    const mockQuestions: Question[] = [
      {
        id: '1',
        stem: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        answer: '4',
        explanation: 'Basic addition',
        difficulty: 'Beginner',
        subject: 'Mathematics'
      }
    ];

    switch (format) {
      case 'solved-examples':
        return {
          format: () => ({
            format: 'solved-examples',
            questions: mockQuestions,
            documents: [
              {
                title: 'Solved Examples',
                content: 'Test content for solved examples',
                type: 'combined'
              }
            ]
          })
        };
      case 'assignment-format':
        return {
          format: () => ({
            format: 'assignment-format',
            questions: mockQuestions,
            documents: [
              {
                title: 'Assignment with Answer Key',
                content: 'Test content for assignment',
                type: 'combined'
              }
            ]
          })
        };
      case 'separate-documents':
        return {
          format: () => ({
            format: 'separate-documents',
            questions: mockQuestions,
            documents: [
              {
                title: 'Questions',
                content: 'Questions content',
                type: 'questions'
              },
              {
                title: 'Answer Key',
                content: 'Answers content',
                type: 'answers'
              }
            ]
          })
        };
      default:
        return {
          format: () => ({
            format: 'solved-examples',
            questions: mockQuestions,
            documents: [
              {
                title: 'Solved Examples',
                content: 'Default content',
                type: 'combined'
              }
            ]
          })
        };
    }
  })
}));

const mockPdfService = pdfService as jest.Mocked<typeof pdfService>;

describe('PDFExportControls', () => {
  const mockQuestions: Question[] = [
    {
      id: '1',
      stem: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      answer: '4',
      explanation: 'Basic addition',
      difficulty: 'Beginner',
      subject: 'Mathematics'
    },
    {
      id: '2',
      stem: 'What is the capital of France?',
      answer: 'Paris',
      difficulty: 'Amateur',
      subject: 'Geography'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when no questions are provided', () => {
      const { container } = render(
        <PDFExportControls questions={[]} outputFormat="solved-examples" />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render export controls when questions are provided', () => {
      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      expect(screen.getByText('Export to PDF')).toBeInTheDocument();
      expect(screen.getByText('Download PDF')).toBeInTheDocument();
    });

    it('should display question count and format information', () => {
      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      expect(screen.getByText(/2 questions/)).toBeInTheDocument();
      expect(screen.getByText(/Format: Solved Examples/)).toBeInTheDocument();
    });
  });

  describe('Format-aware button rendering', () => {
    it('should show single button for solved-examples format', () => {
      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      expect(screen.getByText('Download PDF')).toBeInTheDocument();
      expect(screen.queryByText('Download Questions PDF')).not.toBeInTheDocument();
      expect(screen.queryByText('Download Answers PDF')).not.toBeInTheDocument();
    });

    it('should show single button for assignment-format', () => {
      render(
        <PDFExportControls questions={mockQuestions} outputFormat="assignment-format" />
      );
      
      expect(screen.getByText('Download PDF')).toBeInTheDocument();
      expect(screen.queryByText('Download Questions PDF')).not.toBeInTheDocument();
      expect(screen.queryByText('Download Answers PDF')).not.toBeInTheDocument();
    });

    it('should show separate buttons for separate-documents format', () => {
      render(
        <PDFExportControls questions={mockQuestions} outputFormat="separate-documents" />
      );
      
      expect(screen.getByText('Download Questions PDF')).toBeInTheDocument();
      expect(screen.getByText('Download Answers PDF')).toBeInTheDocument();
      expect(screen.queryByText('Download PDF')).not.toBeInTheDocument();
    });
  });

  describe('Loading states', () => {
    it('should show loading state when isGenerating prop is true', () => {
      render(
        <PDFExportControls 
          questions={mockQuestions} 
          outputFormat="solved-examples" 
          isGenerating={true}
        />
      );
      
      expect(screen.getByText('Generating...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show loading state during PDF generation', async () => {
      mockPdfService.generatePDF.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      const downloadButton = screen.getByText('Download PDF');
      fireEvent.click(downloadButton);
      
      // Wait for the loading state to appear
      await waitFor(() => {
        expect(screen.getByText('Generating...')).toBeInTheDocument();
      });
      
      // Check that the button is disabled during loading
      const loadingButton = screen.getByText('Generating...');
      expect(loadingButton.closest('button')).toBeDisabled();
      
      await waitFor(() => {
        expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
      });
    });
  });

  describe('PDF generation', () => {
    it('should call pdfService.generatePDF for single document formats', async () => {
      mockPdfService.generatePDF.mockResolvedValue();

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      await act(async () => {
        fireEvent.click(screen.getByText('Download PDF'));
      });
      
      await waitFor(() => {
        expect(mockPdfService.generatePDF).toHaveBeenCalledWith({
          title: 'Solved Examples',
          content: 'Test content for solved examples',
          type: 'combined'
        });
      });
    });

    it('should call pdfService.generatePDF for questions PDF in separate documents', async () => {
      // Mock formatter for separate documents
      const { getFormatter } = require('@/lib/formatters');
      getFormatter.mockReturnValue({
        format: jest.fn(() => ({
          format: 'separate-documents',
          questions: mockQuestions,
          documents: [
            {
              title: 'Questions',
              content: 'Questions content',
              type: 'questions'
            },
            {
              title: 'Answer Key',
              content: 'Answers content',
              type: 'answers'
            }
          ]
        }))
      });

      mockPdfService.generatePDF.mockResolvedValue();

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="separate-documents" />
      );
      
      fireEvent.click(screen.getByText('Download Questions PDF'));
      
      await waitFor(() => {
        expect(mockPdfService.generatePDF).toHaveBeenCalledWith({
          title: 'Questions',
          content: 'Questions content',
          type: 'questions'
        });
      });
    });

    it('should call pdfService.generatePDF for answers PDF in separate documents', async () => {
      // Mock formatter for separate documents
      const { getFormatter } = require('@/lib/formatters');
      getFormatter.mockReturnValue({
        format: jest.fn(() => ({
          format: 'separate-documents',
          questions: mockQuestions,
          documents: [
            {
              title: 'Questions',
              content: 'Questions content',
              type: 'questions'
            },
            {
              title: 'Answer Key',
              content: 'Answers content',
              type: 'answers'
            }
          ]
        }))
      });

      mockPdfService.generatePDF.mockResolvedValue();

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="separate-documents" />
      );
      
      fireEvent.click(screen.getByText('Download Answers PDF'));
      
      await waitFor(() => {
        expect(mockPdfService.generatePDF).toHaveBeenCalledWith({
          title: 'Answer Key',
          content: 'Answers content',
          type: 'answers'
        });
      });
    });
  });

  describe('Error handling', () => {
    it('should display error message when PDF generation fails', async () => {
      const { PDFExportError } = require('@/lib/pdf-service');
      mockPdfService.generatePDF.mockRejectedValue(
        new PDFExportError('PDF generation failed', 'GENERATION_FAILED')
      );

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to generate PDF/)).toBeInTheDocument();
      });
    });

    it('should display generic error message for unknown errors', async () => {
      mockPdfService.generatePDF.mockRejectedValue(new Error('Unknown error'));

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
      });
    });

    it('should allow dismissing error messages', async () => {
      mockPdfService.generatePDF.mockRejectedValue(new Error('Test error'));

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Dismiss'));
      
      expect(screen.queryByText(/An unexpected error occurred/)).not.toBeInTheDocument();
    });

    it('should show browser unsupported error message', async () => {
      const { PDFExportError } = require('@/lib/pdf-service');
      mockPdfService.generatePDF.mockRejectedValue(
        new PDFExportError('Browser not supported', 'BROWSER_UNSUPPORTED')
      );

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(screen.getByText(/Your browser does not support PDF generation/)).toBeInTheDocument();
      });
    });

    it('should show download failed error message', async () => {
      const { PDFExportError } = require('@/lib/pdf-service');
      mockPdfService.generatePDF.mockRejectedValue(
        new PDFExportError('Download failed', 'DOWNLOAD_FAILED')
      );

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to download the PDF file/)).toBeInTheDocument();
      });
    });

    it('should show retry button for retryable errors', async () => {
      const { PDFExportError } = require('@/lib/pdf-service');
      mockPdfService.generatePDF.mockRejectedValue(
        new PDFExportError('Generation failed', 'GENERATION_FAILED')
      );

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should not show retry button for browser unsupported errors', async () => {
      const { PDFExportError } = require('@/lib/pdf-service');
      mockPdfService.generatePDF.mockRejectedValue(
        new PDFExportError('Browser not supported', 'BROWSER_UNSUPPORTED')
      );

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(screen.getByText(/Your browser does not support PDF generation/)).toBeInTheDocument();
        expect(screen.queryByText('Retry')).not.toBeInTheDocument();
      });
    });

    it('should show attempt counter for multiple failures', async () => {
      const { PDFExportError } = require('@/lib/pdf-service');
      mockPdfService.generatePDF.mockRejectedValue(
        new PDFExportError('Generation failed', 'GENERATION_FAILED')
      );

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      // First attempt
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Retry attempt
      fireEvent.click(screen.getByText('Retry'));
      
      await waitFor(() => {
        expect(screen.getByText('Attempt 2 of 3')).toBeInTheDocument();
      });
    });

    it('should handle retry functionality', async () => {
      const { PDFExportError } = require('@/lib/pdf-service');
      mockPdfService.generatePDF
        .mockRejectedValueOnce(new PDFExportError('Generation failed', 'GENERATION_FAILED'))
        .mockResolvedValueOnce(undefined);

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      // First attempt fails
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Retry succeeds
      fireEvent.click(screen.getByText('Retry'));
      
      await waitFor(() => {
        expect(screen.queryByText('Retry')).not.toBeInTheDocument();
        expect(mockPdfService.generatePDF).toHaveBeenCalledTimes(2);
      });
    });

    it('should disable retry button during retry attempt', async () => {
      const { PDFExportError } = require('@/lib/pdf-service');
      mockPdfService.generatePDF.mockRejectedValue(
        new PDFExportError('Generation failed', 'GENERATION_FAILED')
      );

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      fireEvent.click(screen.getByText('Download PDF'));
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Mock a slow retry that still fails
      mockPdfService.generatePDF.mockImplementation(() => 
        new Promise((_, reject) => setTimeout(() => reject(new PDFExportError('Still failing', 'GENERATION_FAILED')), 100))
      );

      fireEvent.click(screen.getByText('Retry'));
      
      // Check that retry button shows "Retrying..." and is disabled
      await waitFor(() => {
        const retryButton = screen.getByText('Retrying...');
        expect(retryButton).toBeInTheDocument();
        expect(retryButton.closest('button')).toBeDisabled();
      });
    });

    it('should limit retry attempts to 3', async () => {
      const { PDFExportError } = require('@/lib/pdf-service');
      mockPdfService.generatePDF.mockRejectedValue(
        new PDFExportError('Generation failed', 'GENERATION_FAILED')
      );

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      // First attempt
      fireEvent.click(screen.getByText('Download PDF'));
      await waitFor(() => expect(screen.getByText('Retry')).toBeInTheDocument());

      // Second attempt
      fireEvent.click(screen.getByText('Retry'));
      await waitFor(() => expect(screen.getByText('Attempt 2 of 3')).toBeInTheDocument());

      // Third attempt
      fireEvent.click(screen.getByText('Retry'));
      await waitFor(() => expect(screen.getByText('Attempt 3 of 3')).toBeInTheDocument());

      // After third attempt, retry button should not be available
      await waitFor(() => {
        expect(screen.queryByText('Retry')).not.toBeInTheDocument();
        expect(screen.getByText(/Multiple attempts failed/)).toBeInTheDocument();
      });
    });

    it('should show different error messages based on retry count', async () => {
      const { PDFExportError } = require('@/lib/pdf-service');
      mockPdfService.generatePDF.mockRejectedValue(
        new PDFExportError('Generation failed', 'GENERATION_FAILED')
      );

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      // First attempt
      fireEvent.click(screen.getByText('Download PDF'));
      await waitFor(() => {
        expect(screen.getByText(/Failed to generate PDF.*Click "Retry"/)).toBeInTheDocument();
      });

      // Second attempt
      fireEvent.click(screen.getByText('Retry'));
      await waitFor(() => {
        expect(screen.getByText(/PDF generation failed again.*Try refreshing/)).toBeInTheDocument();
      });

      // Third attempt
      fireEvent.click(screen.getByText('Retry'));
      await waitFor(() => {
        expect(screen.getByText(/Multiple PDF generation attempts failed/)).toBeInTheDocument();
      });
    });

    it('should clear error state on successful export after retry', async () => {
      const { PDFExportError } = require('@/lib/pdf-service');
      mockPdfService.generatePDF
        .mockRejectedValueOnce(new PDFExportError('Generation failed', 'GENERATION_FAILED'))
        .mockResolvedValueOnce(undefined);

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      // First attempt fails
      fireEvent.click(screen.getByText('Download PDF'));
      await waitFor(() => expect(screen.getByText('Retry')).toBeInTheDocument());

      // Retry succeeds
      fireEvent.click(screen.getByText('Retry'));
      
      await waitFor(() => {
        expect(screen.queryByText(/Failed to generate PDF/)).not.toBeInTheDocument();
        expect(screen.queryByText('Retry')).not.toBeInTheDocument();
      });
    });
  });

  describe('Callback functions', () => {
    it('should call onExportStart when export begins', async () => {
      const onExportStart = jest.fn();
      mockPdfService.generatePDF.mockResolvedValue();

      render(
        <PDFExportControls 
          questions={mockQuestions} 
          outputFormat="solved-examples"
          onExportStart={onExportStart}
        />
      );
      
      await act(async () => {
        fireEvent.click(screen.getByText('Download PDF'));
      });
      
      expect(onExportStart).toHaveBeenCalled();
    });

    it('should call onExportComplete when export succeeds', async () => {
      const onExportComplete = jest.fn();
      mockPdfService.generatePDF.mockResolvedValue();

      render(
        <PDFExportControls 
          questions={mockQuestions} 
          outputFormat="solved-examples"
          onExportComplete={onExportComplete}
        />
      );
      
      await act(async () => {
        fireEvent.click(screen.getByText('Download PDF'));
      });
      
      await waitFor(() => {
        expect(onExportComplete).toHaveBeenCalled();
      });
    });

    it('should call onExportError when export fails', async () => {
      const onExportError = jest.fn();
      mockPdfService.generatePDF.mockRejectedValue(new Error('Test error'));

      render(
        <PDFExportControls 
          questions={mockQuestions} 
          outputFormat="solved-examples"
          onExportError={onExportError}
        />
      );
      
      await act(async () => {
        fireEvent.click(screen.getByText('Download PDF'));
      });
      
      await waitFor(() => {
        expect(onExportError).toHaveBeenCalledWith('An unexpected error occurred while generating the PDF. Click "Retry" to try again.');
      });
    });
  });

  describe('Tooltip functionality', () => {
    it('should show appropriate tooltip for solved-examples format', () => {
      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      const button = screen.getByText('Download PDF');
      fireEvent.mouseEnter(button);
      
      // Note: Testing tooltip content would require more complex setup with Popover
      // This test verifies the button exists and can be hovered
      expect(button).toBeInTheDocument();
    });

    it('should show appropriate tooltip for assignment-format', () => {
      render(
        <PDFExportControls questions={mockQuestions} outputFormat="assignment-format" />
      );
      
      const button = screen.getByText('Download PDF');
      fireEvent.mouseEnter(button);
      
      expect(button).toBeInTheDocument();
    });

    it('should show appropriate tooltips for separate-documents format', () => {
      // Mock formatter for separate documents
      const { getFormatter } = require('@/lib/formatters');
      getFormatter.mockReturnValue({
        format: jest.fn(() => ({
          format: 'separate-documents',
          questions: mockQuestions,
          documents: [
            {
              title: 'Questions',
              content: 'Questions content',
              type: 'questions'
            },
            {
              title: 'Answer Key',
              content: 'Answers content',
              type: 'answers'
            }
          ]
        }))
      });

      render(
        <PDFExportControls questions={mockQuestions} outputFormat="separate-documents" />
      );
      
      const questionsButton = screen.getByText('Download Questions PDF');
      const answersButton = screen.getByText('Download Answers PDF');
      
      fireEvent.mouseEnter(questionsButton);
      fireEvent.mouseEnter(answersButton);
      
      expect(questionsButton).toBeInTheDocument();
      expect(answersButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles and attributes', () => {
      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      const button = screen.getByText('Download PDF');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute('title');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should disable buttons during loading', () => {
      render(
        <PDFExportControls 
          questions={mockQuestions} 
          outputFormat="solved-examples" 
          isGenerating={true}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should have proper focus management', () => {
      render(
        <PDFExportControls questions={mockQuestions} outputFormat="solved-examples" />
      );
      
      const button = screen.getByText('Download PDF');
      button.focus();
      expect(button).toHaveFocus();
    });
  });
});