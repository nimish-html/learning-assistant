'use client';

import React, { useState } from 'react';
import { Question, OutputFormat } from '@/lib/schema';
import { getFormatter } from '@/lib/formatters';
import { pdfService, PDFExportError } from '@/lib/pdf-service';


interface PDFExportControlsProps {
  questions: Question[];
  outputFormat: OutputFormat;
  isGenerating?: boolean;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: string) => void;
}

interface PDFExportState {
  isGenerating: boolean;
  progress?: number;
  error?: string;
  errorCode?: 'GENERATION_FAILED' | 'DOWNLOAD_FAILED' | 'BROWSER_UNSUPPORTED';
  retryCount: number;
  lastExportTimestamp?: string;
  lastFailedAction?: () => Promise<void>;
}

const PDFExportControls: React.FC<PDFExportControlsProps> = ({
  questions,
  outputFormat,
  isGenerating: externalIsGenerating = false,
  onExportStart,
  onExportComplete,
  onExportError,
}) => {
  const [exportState, setExportState] = useState<PDFExportState>({
    isGenerating: false,
    retryCount: 0,
  });

  const isGenerating = externalIsGenerating || exportState.isGenerating;

  // Get formatted documents based on output format
  const formatter = getFormatter(outputFormat);
  const formattedOutput = formatter.format(questions);

  const handleExportStart = () => {
    setExportState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      error: undefined, 
      errorCode: undefined 
    }));
    onExportStart?.();
  };

  const handleExportComplete = () => {
    setExportState(prev => ({ 
      ...prev, 
      isGenerating: false, 
      retryCount: 0,
      error: undefined,
      errorCode: undefined,
      lastFailedAction: undefined,
      lastExportTimestamp: new Date().toISOString() 
    }));
    onExportComplete?.();
  };

  const handleExportError = (error: Error | PDFExportError, failedAction: () => Promise<void>) => {
    const errorCode = error instanceof PDFExportError ? error.code : 'GENERATION_FAILED';
    const newRetryCount = exportState.retryCount + 1;
    const errorMessage = getErrorMessage(error, newRetryCount - 1);
    
    setExportState(prev => ({ 
      ...prev, 
      isGenerating: false, 
      error: errorMessage,
      errorCode,
      retryCount: newRetryCount,
      lastFailedAction: failedAction
    }));
    onExportError?.(errorMessage);
  };

  const getErrorMessage = (error: Error | PDFExportError, retryCount: number): string => {
    if (error instanceof PDFExportError) {
      switch (error.code) {
        case 'BROWSER_UNSUPPORTED':
          return 'Your browser does not support PDF generation. Please try using a modern browser like Chrome, Firefox, or Safari.';
        case 'DOWNLOAD_FAILED':
          return 'Failed to download the PDF file. Please check your browser\'s download settings and try again.';
        case 'GENERATION_FAILED':
        default:
          if (retryCount === 0) {
            return 'Failed to generate PDF. This might be due to complex content or browser limitations. Click "Retry" to try again.';
          } else if (retryCount === 1) {
            return 'PDF generation failed again. Try refreshing the page or using a different browser.';
          } else {
            return 'Multiple PDF generation attempts failed. Please refresh the page and try again, or contact support if the issue persists.';
          }
      }
    }
    
    // Generic error handling
    if (retryCount === 0) {
      return 'An unexpected error occurred while generating the PDF. Click "Retry" to try again.';
    } else if (retryCount === 1) {
      return 'PDF generation failed again. Please refresh the page and try again.';
    } else {
      return 'Multiple attempts failed. Please refresh the page or try a different browser.';
    }
  };

  const handleRetry = async () => {
    if (exportState.lastFailedAction && exportState.retryCount < 3) {
      // Clear the current error state before retrying
      setExportState(prev => ({ 
        ...prev, 
        error: undefined, 
        errorCode: undefined 
      }));
      
      try {
        await exportState.lastFailedAction();
      } catch (error) {
        // Error will be handled by the individual export functions
      }
    }
  };

  const canRetry = (): boolean => {
    return !!(exportState.lastFailedAction && exportState.retryCount < 3 && exportState.errorCode !== 'BROWSER_UNSUPPORTED');
  };

  const exportSinglePDF = async () => {
    if (formattedOutput.documents.length === 0) return;

    handleExportStart();
    
    try {
      const document = formattedOutput.documents[0];
      await pdfService.generatePDF(document);
      handleExportComplete();
    } catch (error) {
      handleExportError(error as Error | PDFExportError, exportSinglePDF);
    }
  };

  const exportQuestionsPDF = async () => {
    const questionsDoc = formattedOutput.documents.find(doc => doc.type === 'questions');
    if (!questionsDoc) return;

    handleExportStart();
    
    try {
      await pdfService.generatePDF(questionsDoc);
      handleExportComplete();
    } catch (error) {
      handleExportError(error as Error | PDFExportError, exportQuestionsPDF);
    }
  };

  const exportAnswersPDF = async () => {
    const answersDoc = formattedOutput.documents.find(doc => doc.type === 'answers');
    if (!answersDoc) return;

    handleExportStart();
    
    try {
      await pdfService.generatePDF(answersDoc);
      handleExportComplete();
    } catch (error) {
      handleExportError(error as Error | PDFExportError, exportAnswersPDF);
    }
  };

  // Don't render if no questions
  if (questions.length === 0) {
    return null;
  }

  // Render loading indicator
  const LoadingSpinner = () => (
    <div className="inline-flex items-center">
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Generating...
    </div>
  );

  // Tooltip content based on format
  const getTooltipContent = (type: 'single' | 'questions' | 'answers') => {
    switch (type) {
      case 'single':
        if (outputFormat === 'solved-examples') {
          return 'Download a PDF with questions and answers shown together as solved examples';
        } else if (outputFormat === 'assignment-format') {
          return 'Download a PDF with questions followed by an answer key section';
        }
        return 'Download a combined PDF document';
      case 'questions':
        return 'Download a PDF containing only the questions without answers';
      case 'answers':
        return 'Download a PDF containing only the answer key with explanations';
      default:
        return '';
    }
  };

  // Render tooltip button
  const TooltipButton: React.FC<{
    onClick: () => void;
    disabled: boolean;
    children: React.ReactNode;
    tooltipContent: string;
    variant?: 'primary' | 'secondary';
  }> = ({ onClick, disabled, children, tooltipContent, variant = 'primary' }) => {
    const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variantClasses = variant === 'primary' 
      ? "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
      : "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500";

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses}`}
        title={tooltipContent}
        aria-label={tooltipContent}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Export to PDF</h3>
      
      {/* Error display */}
      {exportState.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-red-700">{exportState.error}</p>
              {exportState.retryCount > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Attempt {exportState.retryCount} of 3
                </p>
              )}
            </div>
            {exportState.errorCode === 'BROWSER_UNSUPPORTED' && (
              <div className="ml-2">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            {canRetry() && (
              <button
                onClick={handleRetry}
                disabled={isGenerating}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              >
                {isGenerating ? 'Retrying...' : 'Retry'}
              </button>
            )}
            <button
              onClick={() => setExportState(prev => ({ 
                ...prev, 
                error: undefined, 
                errorCode: undefined,
                lastFailedAction: undefined 
              }))}
              className="px-3 py-1 text-xs text-red-600 hover:text-red-800 underline focus:outline-none"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Format-aware button rendering */}
      <div className="flex flex-wrap gap-3">
        {outputFormat === 'separate-documents' ? (
          // Separate Documents: Show two buttons
          <>
            <TooltipButton
              onClick={exportQuestionsPDF}
              disabled={isGenerating}
              tooltipContent={getTooltipContent('questions')}
              variant="primary"
            >
              {isGenerating ? <LoadingSpinner /> : 'Download Questions PDF'}
            </TooltipButton>
            
            <TooltipButton
              onClick={exportAnswersPDF}
              disabled={isGenerating}
              tooltipContent={getTooltipContent('answers')}
              variant="secondary"
            >
              {isGenerating ? <LoadingSpinner /> : 'Download Answers PDF'}
            </TooltipButton>
          </>
        ) : (
          // Solved Examples or Assignment Format: Show single button
          <TooltipButton
            onClick={exportSinglePDF}
            disabled={isGenerating}
            tooltipContent={getTooltipContent('single')}
            variant="primary"
          >
            {isGenerating ? <LoadingSpinner /> : 'Download PDF'}
          </TooltipButton>
        )}
      </div>

      {/* Additional info */}
      <div className="mt-3 text-xs text-gray-600">
        <p>
          {questions.length} question{questions.length !== 1 ? 's' : ''} • 
          Format: {outputFormat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </p>
        {exportState.lastExportTimestamp && (
          <p className="mt-1">
            Last exported: {new Date(exportState.lastExportTimestamp).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default PDFExportControls;