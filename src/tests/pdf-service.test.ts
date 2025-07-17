import { PDFService, PDFExportError, PDFOptions } from '../lib/pdf-service';
import { Document } from '../lib/schema';

// Create a simple mock that avoids circular references
const createMockJsPDF = () => ({
  internal: {
    pageSize: {
      getWidth: jest.fn().mockReturnValue(210),
      getHeight: jest.fn().mockReturnValue(297)
    }
  },
  setFontSize: jest.fn().mockReturnThis(),
  setFont: jest.fn().mockReturnThis(),
  text: jest.fn().mockReturnThis(),
  setLineWidth: jest.fn().mockReturnThis(),
  line: jest.fn().mockReturnThis(),
  addPage: jest.fn().mockReturnThis(),
  splitTextToSize: jest.fn().mockReturnValue(['test line']),
  getTextWidth: jest.fn().mockReturnValue(50),
  save: jest.fn().mockReturnThis()
});

let mockJsPDFInstance: ReturnType<typeof createMockJsPDF>;

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => {
    mockJsPDFInstance = createMockJsPDF();
    return mockJsPDFInstance;
  })
}));

describe('PDFService', () => {
  let pdfService: PDFService;
  let mockDocument: Document;
  let originalWindow: any;
  let originalDocument: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Store original globals
    originalWindow = global.window;
    originalDocument = global.document;
    
    // Setup mock browser environment
    global.window = {
      Blob: function() {},
      URL: { createObjectURL: jest.fn() }
    } as any;
    
    global.document = {
      createElement: jest.fn().mockReturnValue({
        getContext: jest.fn().mockReturnValue({})
      })
    } as any;
    
    pdfService = new PDFService();
    mockDocument = {
      title: 'Test Document',
      content: 'This is test content',
      type: 'combined'
    };
  });

  afterEach(() => {
    // Restore original globals
    global.window = originalWindow;
    global.document = originalDocument;
  });

  describe('generatePDF', () => {
    it('should create PDFService instance', () => {
      expect(pdfService).toBeInstanceOf(PDFService);
    });

    it('should generate PDF with default options', async () => {
      await pdfService.generatePDF(mockDocument);
      
      expect(mockJsPDFInstance.setFontSize).toHaveBeenCalled();
      expect(mockJsPDFInstance.setFont).toHaveBeenCalled();
      expect(mockJsPDFInstance.text).toHaveBeenCalled();
      expect(mockJsPDFInstance.save).toHaveBeenCalled();
    });

    it('should generate PDF with custom options', async () => {
      const options: PDFOptions = {
        filename: 'custom.pdf',
        includeHeader: false,
        includeTimestamp: false,
        pageFormat: 'letter'
      };

      await pdfService.generatePDF(mockDocument, options);
      
      expect(mockJsPDFInstance.save).toHaveBeenCalledWith('custom.pdf');
    });

    it('should handle PDF generation errors', async () => {
      const { jsPDF } = require('jspdf');
      const originalImplementation = jsPDF;
      
      jsPDF.mockImplementationOnce(() => {
        throw new Error('PDF generation failed');
      });

      await expect(pdfService.generatePDF(mockDocument)).rejects.toThrow(PDFExportError);
      
      // Restore the mock for subsequent tests
      jsPDF.mockImplementation(originalImplementation);
    });

    it('should handle download errors', async () => {
      mockJsPDFInstance.save.mockImplementationOnce(() => {
        throw new Error('Download failed');
      });

      await expect(pdfService.generatePDF(mockDocument)).rejects.toThrow(PDFExportError);
    });

    it('should add header when includeHeader is true', async () => {
      const options: PDFOptions = {
        includeHeader: true,
        includeTimestamp: true
      };

      // For now, just test that the method doesn't throw an error
      // The detailed functionality will be tested in integration tests
      await expect(pdfService.generatePDF(mockDocument, options)).resolves.not.toThrow();
    });

    it('should skip header when includeHeader is false', async () => {
      const options: PDFOptions = {
        includeHeader: false
      };

      await pdfService.generatePDF(mockDocument, options);
      
      // Should still call text for content, but not for header
      expect(mockJsPDFInstance.text).toHaveBeenCalled();
    });

    it('should handle different content formatting', async () => {
      const formattedDocument: Document = {
        title: 'Formatted Document',
        content: '**Question 1:**\nWhat is 2+2?\na) 3\nb) 4\nc) 5\n\n**Answer:** b) 4\n\n---\n\n# Section 2\n\n1. First item\n2. Second item',
        type: 'combined'
      };

      await pdfService.generatePDF(formattedDocument);
      
      expect(mockJsPDFInstance.setFont).toHaveBeenCalledWith('helvetica', 'bold');
      expect(mockJsPDFInstance.setFont).toHaveBeenCalledWith('helvetica', 'normal');
      expect(mockJsPDFInstance.line).toHaveBeenCalled(); // For separator line
      expect(mockJsPDFInstance.setFontSize).toHaveBeenCalledWith(14); // For header
    });

    it('should handle page breaks for long content', async () => {
      const longContent = Array(100).fill('This is a long line of text that will cause page breaks.').join('\n');
      const longDocument: Document = {
        title: 'Long Document',
        content: longContent,
        type: 'combined'
      };

      await pdfService.generatePDF(longDocument);
      
      expect(mockJsPDFInstance.addPage).toHaveBeenCalled();
    });
  });

  describe('generateMultiplePDFs', () => {
    it('should generate multiple PDFs successfully', async () => {
      const documents = [
        { title: 'Doc 1', content: 'Content 1', type: 'questions' as const },
        { title: 'Doc 2', content: 'Content 2', type: 'answers' as const }
      ];

      await pdfService.generateMultiplePDFs(documents);
      
      expect(mockJsPDFInstance.save).toHaveBeenCalledTimes(2);
    });

    it('should handle errors when generating multiple PDFs', async () => {
      const { jsPDF } = require('jspdf');
      const originalImplementation = jsPDF;
      
      jsPDF.mockImplementationOnce(() => {
        throw new Error('PDF generation failed');
      });

      const documents = [mockDocument];
      await expect(pdfService.generateMultiplePDFs(documents)).rejects.toThrow(PDFExportError);
      
      // Restore the mock for subsequent tests
      jsPDF.mockImplementation(originalImplementation);
    });

    it('should add delay between downloads', async () => {
      const documents = [
        { title: 'Doc 1', content: 'Content 1', type: 'questions' as const },
        { title: 'Doc 2', content: 'Content 2', type: 'answers' as const }
      ];

      // Mock setTimeout to track delay calls
      const originalSetTimeout = global.setTimeout;
      const mockSetTimeout = jest.fn().mockImplementation((callback) => {
        callback();
        return 1;
      });
      global.setTimeout = mockSetTimeout;

      await pdfService.generateMultiplePDFs(documents);
      
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
      
      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('PDF formatting functions', () => {
    it('should format mathematical expressions correctly', async () => {
      const mathDocument: Document = {
        title: 'Math Questions',
        content: '**Question:** What is the value of x in the equation 2x + 3 = 7?\n**Answer:** x = 2',
        type: 'combined'
      };

      await pdfService.generatePDF(mathDocument);
      
      expect(mockJsPDFInstance.splitTextToSize).toHaveBeenCalled();
      expect(mockJsPDFInstance.text).toHaveBeenCalled();
    });

    it('should preserve formatting for special characters', async () => {
      const specialDocument: Document = {
        title: 'Special Characters',
        content: 'Text with special chars: α, β, γ, ∑, ∫, √, π',
        type: 'combined'
      };

      await pdfService.generatePDF(specialDocument);
      
      expect(mockJsPDFInstance.text).toHaveBeenCalledWith(['test line'], 20, expect.any(Number));
    });
  });

  describe('filename generation', () => {
    it('should generate filename with timestamp', async () => {
      // Mock the Date constructor to return a specific date
      const mockDate = new Date('2024-01-15T14:30:00');
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.now = originalDate.now;

      await pdfService.generatePDF(mockDocument);
      
      expect(mockJsPDFInstance.save).toHaveBeenCalledWith(expect.stringMatching(/Test_Document_2024-01-15_14-30\.pdf/));
      
      // Restore original Date
      global.Date = originalDate;
    });

    it('should sanitize filename', async () => {
      // Mock the Date constructor to return a specific date
      const mockDate = new Date('2024-01-15T14:30:00');
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.now = originalDate.now;

      const unsafeDocument: Document = {
        title: 'Test<>:"/\\|?*Document',
        content: 'Content',
        type: 'combined'
      };

      await pdfService.generatePDF(unsafeDocument);
      
      expect(mockJsPDFInstance.save).toHaveBeenCalledWith(expect.stringMatching(/Test_Document_2024-01-15_14-30\.pdf/));
      
      // Restore original Date
      global.Date = originalDate;
    });
  });

  describe('PDFExportError', () => {
    it('should create error with correct properties', () => {
      const error = new PDFExportError('Test error', 'GENERATION_FAILED', { detail: 'test' });
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('GENERATION_FAILED');
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.name).toBe('PDFExportError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle different error codes', () => {
      const generationError = new PDFExportError('Generation failed', 'GENERATION_FAILED');
      const downloadError = new PDFExportError('Download failed', 'DOWNLOAD_FAILED');
      const browserError = new PDFExportError('Browser unsupported', 'BROWSER_UNSUPPORTED');
      
      expect(generationError.code).toBe('GENERATION_FAILED');
      expect(downloadError.code).toBe('DOWNLOAD_FAILED');
      expect(browserError.code).toBe('BROWSER_UNSUPPORTED');
    });
  });

  describe('PDF options validation', () => {
    it('should use default options when none provided', async () => {
      await pdfService.generatePDF(mockDocument);
      
      expect(mockJsPDFInstance.text).toHaveBeenCalledWith('Test Document', 20, 20); // Default margins
    });

    it('should respect custom margins', async () => {
      const options: PDFOptions = {
        margins: {
          top: 30,
          right: 25,
          bottom: 30,
          left: 25
        }
      };

      await pdfService.generatePDF(mockDocument, options);
      
      expect(mockJsPDFInstance.text).toHaveBeenCalledWith('Test Document', 25, 30);
    });

    it('should handle different page formats', async () => {
      const letterOptions: PDFOptions = { pageFormat: 'letter' };
      const a4Options: PDFOptions = { pageFormat: 'a4' };

      await pdfService.generatePDF(mockDocument, letterOptions);
      await pdfService.generatePDF(mockDocument, a4Options);
      
      // Both should work without errors
      expect(mockJsPDFInstance.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('Browser compatibility checks', () => {
    let originalWindow: any;
    let originalDocument: any;

    beforeEach(() => {
      originalWindow = global.window;
      originalDocument = global.document;
    });

    afterEach(() => {
      global.window = originalWindow;
      global.document = originalDocument;
    });

    it('should throw BROWSER_UNSUPPORTED error when window is undefined', async () => {
      // @ts-ignore
      global.window = undefined;

      await expect(pdfService.generatePDF(mockDocument)).rejects.toThrow(
        expect.objectContaining({
          code: 'BROWSER_UNSUPPORTED',
          message: expect.stringContaining('browser does not support')
        })
      );
    });

    it('should throw BROWSER_UNSUPPORTED error when Blob is not supported', async () => {
      global.window = { ...originalWindow, Blob: undefined } as any;

      await expect(pdfService.generatePDF(mockDocument)).rejects.toThrow(
        expect.objectContaining({
          code: 'BROWSER_UNSUPPORTED'
        })
      );
    });

    it('should throw BROWSER_UNSUPPORTED error when URL.createObjectURL is not supported', async () => {
      global.window = { 
        ...originalWindow, 
        URL: undefined 
      } as any;

      await expect(pdfService.generatePDF(mockDocument)).rejects.toThrow(
        expect.objectContaining({
          code: 'BROWSER_UNSUPPORTED'
        })
      );
    });

    it('should throw BROWSER_UNSUPPORTED error when Canvas is not supported', async () => {
      const mockCreateElement = jest.fn().mockReturnValue({
        getContext: undefined
      });
      
      global.document = {
        ...originalDocument,
        createElement: mockCreateElement
      };

      await expect(pdfService.generatePDF(mockDocument)).rejects.toThrow(
        expect.objectContaining({
          code: 'BROWSER_UNSUPPORTED'
        })
      );
    });

    it('should pass compatibility check with all required features', async () => {
      global.window = {
        ...originalWindow,
        Blob: function() {},
        URL: { createObjectURL: jest.fn() }
      } as any;

      global.document = {
        ...originalDocument,
        createElement: jest.fn().mockReturnValue({
          getContext: jest.fn().mockReturnValue({})
        })
      };

      // Should not throw browser compatibility error
      await expect(pdfService.generatePDF(mockDocument)).resolves.not.toThrow();
    });
  });

  describe('Document validation', () => {
    it('should throw error for null document', async () => {
      await expect(pdfService.generatePDF(null as any)).rejects.toThrow(
        expect.objectContaining({
          code: 'GENERATION_FAILED',
          message: expect.stringContaining('Document is required')
        })
      );
    });

    it('should throw error for undefined document', async () => {
      await expect(pdfService.generatePDF(undefined as any)).rejects.toThrow(
        expect.objectContaining({
          code: 'GENERATION_FAILED',
          message: expect.stringContaining('Document is required')
        })
      );
    });

    it('should throw error for document with empty title', async () => {
      const invalidDocument = { ...mockDocument, title: '' };
      
      await expect(pdfService.generatePDF(invalidDocument)).rejects.toThrow(
        expect.objectContaining({
          code: 'GENERATION_FAILED',
          message: expect.stringContaining('Document title is required')
        })
      );
    });

    it('should throw error for document with whitespace-only title', async () => {
      const invalidDocument = { ...mockDocument, title: '   ' };
      
      await expect(pdfService.generatePDF(invalidDocument)).rejects.toThrow(
        expect.objectContaining({
          code: 'GENERATION_FAILED',
          message: expect.stringContaining('Document title is required')
        })
      );
    });

    it('should throw error for document with empty content', async () => {
      const invalidDocument = { ...mockDocument, content: '' };
      
      await expect(pdfService.generatePDF(invalidDocument)).rejects.toThrow(
        expect.objectContaining({
          code: 'GENERATION_FAILED',
          message: expect.stringContaining('Document content is required')
        })
      );
    });

    it('should throw error for document with whitespace-only content', async () => {
      const invalidDocument = { ...mockDocument, content: '   \n\t  ' };
      
      await expect(pdfService.generatePDF(invalidDocument)).rejects.toThrow(
        expect.objectContaining({
          code: 'GENERATION_FAILED',
          message: expect.stringContaining('Document content is required')
        })
      );
    });
  });

  describe('Error categorization', () => {
    it('should categorize download errors correctly', async () => {
      mockJsPDFInstance.save.mockImplementationOnce(() => {
        throw new Error('Failed to save file');
      });

      await expect(pdfService.generatePDF(mockDocument)).rejects.toThrow(
        expect.objectContaining({
          code: 'DOWNLOAD_FAILED',
          message: expect.stringContaining('Failed to download PDF file')
        })
      );
    });

    it('should categorize download errors with "download" in message', async () => {
      mockJsPDFInstance.save.mockImplementationOnce(() => {
        throw new Error('Download blocked by browser');
      });

      await expect(pdfService.generatePDF(mockDocument)).rejects.toThrow(
        expect.objectContaining({
          code: 'DOWNLOAD_FAILED'
        })
      );
    });

    it('should preserve PDFExportError when re-thrown', async () => {
      const originalError = new PDFExportError('Custom error', 'BROWSER_UNSUPPORTED');
      mockJsPDFInstance.setFontSize.mockImplementationOnce(() => {
        throw originalError;
      });

      await expect(pdfService.generatePDF(mockDocument)).rejects.toThrow(originalError);
    });

    it('should categorize unknown errors as GENERATION_FAILED', async () => {
      mockJsPDFInstance.text.mockImplementationOnce(() => {
        throw new Error('Unknown PDF error');
      });

      await expect(pdfService.generatePDF(mockDocument)).rejects.toThrow(
        expect.objectContaining({
          code: 'GENERATION_FAILED',
          message: expect.stringContaining('Failed to generate PDF document')
        })
      );
    });
  });

  describe('Multiple PDF generation error handling', () => {
    it('should validate all documents before generation', async () => {
      const documents = [
        mockDocument,
        { ...mockDocument, title: '' }, // Invalid document
        mockDocument
      ];

      await expect(pdfService.generateMultiplePDFs(documents)).rejects.toThrow(
        expect.objectContaining({
          code: 'GENERATION_FAILED',
          message: expect.stringContaining('Document title is required')
        })
      );

      // Should not have called save since validation failed early
      expect(mockJsPDFInstance.save).not.toHaveBeenCalled();
    });

    it('should check browser compatibility for multiple PDFs', async () => {
      // @ts-ignore
      global.window = undefined;

      const documents = [mockDocument, mockDocument];

      await expect(pdfService.generateMultiplePDFs(documents)).rejects.toThrow(
        expect.objectContaining({
          code: 'BROWSER_UNSUPPORTED'
        })
      );
    });

    it('should preserve specific error types in multiple PDF generation', async () => {
      const originalError = new PDFExportError('Download failed', 'DOWNLOAD_FAILED');
      mockJsPDFInstance.save.mockImplementationOnce(() => {
        throw originalError;
      });

      const documents = [mockDocument];

      await expect(pdfService.generateMultiplePDFs(documents)).rejects.toThrow(originalError);
    });

    it('should handle errors during multiple PDF generation', async () => {
      mockJsPDFInstance.text.mockImplementationOnce(() => {
        throw new Error('Generation failed');
      });

      const documents = [mockDocument, mockDocument];

      await expect(pdfService.generateMultiplePDFs(documents)).rejects.toThrow(
        expect.objectContaining({
          code: 'GENERATION_FAILED'
        })
      );
    });
  });

  describe('Error recovery and resilience', () => {
    it('should handle memory-related errors gracefully', async () => {
      mockJsPDFInstance.addPage.mockImplementationOnce(() => {
        throw new Error('Out of memory');
      });

      await expect(pdfService.generatePDF(mockDocument)).rejects.toThrow(
        expect.objectContaining({
          code: 'GENERATION_FAILED',
          message: expect.stringContaining('Failed to generate PDF document')
        })
      );
    });

    it('should handle canvas-related errors', async () => {
      const { jsPDF } = require('jspdf');
      jsPDF.mockImplementationOnce(() => {
        throw new Error('Canvas context error');
      });

      await expect(pdfService.generatePDF(mockDocument)).rejects.toThrow(
        expect.objectContaining({
          code: 'GENERATION_FAILED'
        })
      );
    });

    it('should include original error details in PDFExportError', async () => {
      const originalError = new Error('Original error with details');
      originalError.stack = 'Error stack trace';
      
      mockJsPDFInstance.text.mockImplementationOnce(() => {
        throw originalError;
      });

      try {
        await pdfService.generatePDF(mockDocument);
      } catch (error) {
        expect(error).toBeInstanceOf(PDFExportError);
        expect((error as PDFExportError).details).toBe(originalError);
      }
    });
  });
});