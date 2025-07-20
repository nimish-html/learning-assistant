import { jsPDF } from 'jspdf';
import { Document } from './schema';

/**
 * PDF generation options interface
 */
export interface PDFOptions {
  filename?: string;
  includeHeader?: boolean;
  includeTimestamp?: boolean;
  pageFormat?: 'a4' | 'letter';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Default PDF options
 */
const DEFAULT_PDF_OPTIONS = {
  includeHeader: true,
  includeTimestamp: true,
  pageFormat: 'a4' as const,
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  }
};

type MergedPDFOptions = {
  filename?: string;
  includeHeader: boolean;
  includeTimestamp: boolean;
  pageFormat: 'a4' | 'letter';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

/**
 * Custom error class for PDF export operations
 */
export class PDFExportError extends Error {
  constructor(
    message: string,
    public code: 'GENERATION_FAILED' | 'DOWNLOAD_FAILED' | 'BROWSER_UNSUPPORTED',
    public details?: unknown
  ) {
    super(message);
    this.name = 'PDFExportError';
  }
}

/**
 * PDF Service class for generating and downloading PDF documents
 */
export class PDFService {
  /**
   * Check browser compatibility for PDF generation
   * @returns boolean indicating if browser supports PDF generation
   */
  private checkBrowserCompatibility(): boolean {
    // Check for required browser features
    if (typeof window === 'undefined') return false;
    
    // Check for Blob support
    if (!window.Blob) return false;
    
    // Check for URL.createObjectURL support
    if (!window.URL || !window.URL.createObjectURL) return false;
    
    // Check for basic Canvas support (used by jsPDF)
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext && canvas.getContext('2d'));
    } catch {
      return false;
    }
  }

  /**
   * Validate document content before PDF generation
   * @param document Document to validate
   */
  private validateDocument(document: Document): void {
    if (!document) {
      throw new PDFExportError(
        'Document is required for PDF generation',
        'GENERATION_FAILED'
      );
    }
    
    if (!document.title || document.title.trim() === '') {
      throw new PDFExportError(
        'Document title is required for PDF generation',
        'GENERATION_FAILED'
      );
    }
    
    if (!document.content || document.content.trim() === '') {
      throw new PDFExportError(
        'Document content is required for PDF generation',
        'GENERATION_FAILED'
      );
    }
  }

  /**
   * Generate and download a single PDF document
   * @param document Document to convert to PDF
   * @param options PDF generation options
   */
  async generatePDF(document: Document, options?: PDFOptions): Promise<void> {
    // Check browser compatibility first
    if (!this.checkBrowserCompatibility()) {
      throw new PDFExportError(
        'Your browser does not support PDF generation. Please use a modern browser.',
        'BROWSER_UNSUPPORTED'
      );
    }

    // Validate document
    this.validateDocument(document);

    try {
      const mergedOptions = { ...DEFAULT_PDF_OPTIONS, ...options };
      const pdf = this.createPDFInstance(mergedOptions);
      
      // Add header if enabled
      if (mergedOptions.includeHeader) {
        this.addHeader(pdf, document.title, mergedOptions);
      }
      
      // Add document content
      this.addContent(pdf, document.content, mergedOptions);
      
      // Generate filename and download
      const filename = mergedOptions.filename || this.generateFilename(document.title);
      this.downloadPDF(pdf, filename);
      
    } catch (error) {
      // Re-throw PDFExportError as-is
      if (error instanceof PDFExportError) {
        throw error;
      }
      
      // Categorize other errors
      if (error instanceof Error) {
        if (error.message.includes('download') || error.message.includes('save')) {
          throw new PDFExportError(
            'Failed to download PDF file. Please check your browser settings.',
            'DOWNLOAD_FAILED',
            error
          );
        }
      }
      
      throw new PDFExportError(
        'Failed to generate PDF document',
        'GENERATION_FAILED',
        error
      );
    }
  }

  /**
   * Generate and download multiple PDF documents
   * @param documents Array of documents to convert to PDFs
   * @param options PDF generation options
   */
  async generateMultiplePDFs(documents: Document[], options?: PDFOptions): Promise<void> {
    // Check browser compatibility first
    if (!this.checkBrowserCompatibility()) {
      throw new PDFExportError(
        'Your browser does not support PDF generation. Please use a modern browser.',
        'BROWSER_UNSUPPORTED'
      );
    }

    // Validate all documents first
    for (const document of documents) {
      this.validateDocument(document);
    }

    try {
      for (const document of documents) {
        const filename = this.generateFilename(document.title);
        await this.generatePDF(document, { ...options, filename });
        
        // Add small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      // Re-throw PDFExportError as-is
      if (error instanceof PDFExportError) {
        throw error;
      }
      
      throw new PDFExportError(
        'Failed to generate multiple PDF documents',
        'GENERATION_FAILED',
        error
      );
    }
  }

  /**
   * Create a new jsPDF instance with specified options
   * @param options PDF options
   * @returns jsPDF instance
   */
  private createPDFInstance(options: MergedPDFOptions): jsPDF {
    const orientation = 'portrait';
    const unit = 'mm';
    const format = options.pageFormat === 'a4' ? 'a4' : 'letter';
    
    return new jsPDF({
      orientation,
      unit,
      format
    });
  }

  /**
   * Add header to PDF document
   * @param pdf jsPDF instance
   * @param title Document title
   * @param options PDF options
   */
  private addHeader(pdf: jsPDF, title: string, options: MergedPDFOptions): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Set header font
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    
    // Add title
    pdf.text(title, options.margins.left, options.margins.top);
    
    // Add timestamp if enabled
    if (options.includeTimestamp) {
      const timestamp = this.formatTimestamp(new Date());
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const timestampText = `Generated on: ${timestamp}`;
      const textWidth = pdf.getTextWidth(timestampText);
      pdf.text(
        timestampText,
        pageWidth - options.margins.right - textWidth,
        options.margins.top
      );
    }
    
    // Add separator line
    const lineY = options.margins.top + 10;
    pdf.setLineWidth(0.5);
    pdf.line(
      options.margins.left,
      lineY,
      pageWidth - options.margins.right,
      lineY
    );
  }

  /**
   * Add content to PDF document with proper formatting
   * @param pdf jsPDF instance
   * @param content Document content
   * @param options PDF options
   */
  private addContent(pdf: jsPDF, content: string, options: MergedPDFOptions): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pageWidth - options.margins.left - options.margins.right;
    
    // Starting Y position (after header)
    let currentY = options.margins.top + (options.includeHeader ? 20 : 0);
    
    // Set content font
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    // Split content into lines and process
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Check if we need a new page before processing the line
      currentY = this.checkPageBreak(pdf, currentY, pageHeight, options);
      
      // Handle different line types
      if (line.trim() === '') {
        // Empty line - add spacing
        currentY += 5;
      } else if (line.startsWith('**') && line.endsWith('**')) {
        // Bold text (questions, answers, etc.) with text wrapping
        currentY = this.addBoldText(pdf, line, currentY, maxWidth, options);
      } else if (line.startsWith('# ')) {
        // Header text
        currentY = this.addHeaderText(pdf, line, currentY, options);
      } else if (line === '---') {
        // Separator line
        currentY = this.addSeparatorLine(pdf, currentY, pageWidth, options);
      } else if (/^\d+\./.test(line.trim())) {
        // Numbered list item (questions)
        currentY = this.addNumberedListItem(pdf, line, currentY, maxWidth, options);
      } else if (/^[A-Z]\./.test(line.trim())) {
        // Multiple choice option
        currentY = this.addMultipleChoiceOption(pdf, line, currentY, maxWidth, options);
      } else {
        // Regular text with wrapping
        currentY = this.addRegularText(pdf, line, currentY, maxWidth, options);
      }
      
      currentY += 2; // Add small spacing between lines
    }
  }

  /**
   * Check if a page break is needed and add new page if necessary
   * @param pdf jsPDF instance
   * @param currentY Current Y position
   * @param pageHeight Page height
   * @param options PDF options
   * @returns Updated Y position
   */
  private checkPageBreak(pdf: jsPDF, currentY: number, pageHeight: number, options: MergedPDFOptions): number {
    if (currentY > pageHeight - options.margins.bottom - 15) {
      pdf.addPage();
      return options.margins.top;
    }
    return currentY;
  }

  /**
   * Add bold text to PDF
   * @param pdf jsPDF instance
   * @param line Text line
   * @param currentY Current Y position
   * @param maxWidth Maximum width
   * @param options PDF options
   * @returns Updated Y position
   */
  private addBoldText(pdf: jsPDF, line: string, currentY: number, maxWidth: number, options: MergedPDFOptions): number {
    const boldText = line.replace(/\*\*/g, '');
    pdf.setFont('helvetica', 'bold');
    const wrappedLines = pdf.splitTextToSize(boldText, maxWidth);
    pdf.text(wrappedLines, options.margins.left, currentY);
    pdf.setFont('helvetica', 'normal');
    return currentY + wrappedLines.length * 6;
  }

  /**
   * Add header text to PDF
   * @param pdf jsPDF instance
   * @param line Text line
   * @param currentY Current Y position
   * @param options PDF options
   * @returns Updated Y position
   */
  private addHeaderText(pdf: jsPDF, line: string, currentY: number, options: MergedPDFOptions): number {
    const headerText = line.replace('# ', '');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(headerText, options.margins.left, currentY);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    return currentY + 10;
  }

  /**
   * Add separator line to PDF
   * @param pdf jsPDF instance
   * @param currentY Current Y position
   * @param pageWidth Page width
   * @param options PDF options
   * @returns Updated Y position
   */
  private addSeparatorLine(pdf: jsPDF, currentY: number, pageWidth: number, options: MergedPDFOptions): number {
    currentY += 5;
    pdf.setLineWidth(0.3);
    pdf.line(
      options.margins.left,
      currentY,
      pageWidth - options.margins.right,
      currentY
    );
    return currentY + 5;
  }

  /**
   * Add numbered list item to PDF
   * @param pdf jsPDF instance
   * @param line Text line
   * @param currentY Current Y position
   * @param maxWidth Maximum width
   * @param options PDF options
   * @returns Updated Y position
   */
  private addNumberedListItem(pdf: jsPDF, line: string, currentY: number, maxWidth: number, options: MergedPDFOptions): number {
    pdf.setFont('helvetica', 'bold');
    const wrappedLines = pdf.splitTextToSize(line, maxWidth);
    pdf.text(wrappedLines, options.margins.left, currentY);
    pdf.setFont('helvetica', 'normal');
    return currentY + wrappedLines.length * 6;
  }

  /**
   * Add multiple choice option to PDF
   * @param pdf jsPDF instance
   * @param line Text line
   * @param currentY Current Y position
   * @param maxWidth Maximum width
   * @param options PDF options
   * @returns Updated Y position
   */
  private addMultipleChoiceOption(pdf: jsPDF, line: string, currentY: number, maxWidth: number, options: MergedPDFOptions): number {
    const wrappedLines = pdf.splitTextToSize(line, maxWidth - 10);
    pdf.text(wrappedLines, options.margins.left + 10, currentY);
    return currentY + wrappedLines.length * 5;
  }

  /**
   * Add regular text to PDF
   * @param pdf jsPDF instance
   * @param line Text line
   * @param currentY Current Y position
   * @param maxWidth Maximum width
   * @param options PDF options
   * @returns Updated Y position
   */
  private addRegularText(pdf: jsPDF, line: string, currentY: number, maxWidth: number, options: MergedPDFOptions): number {
    const wrappedLines = pdf.splitTextToSize(line, maxWidth);
    pdf.text(wrappedLines, options.margins.left, currentY);
    return currentY + wrappedLines.length * 5;
  }

  /**
   * Download PDF file
   * @param pdf jsPDF instance
   * @param filename Filename for download
   */
  private downloadPDF(pdf: jsPDF, filename: string): void {
    try {
      pdf.save(filename);
    } catch (error) {
      throw new PDFExportError(
        'Failed to download PDF file',
        'DOWNLOAD_FAILED',
        error
      );
    }
  }

  /**
   * Generate filename based on document title
   * @param title Document title
   * @returns Generated filename
   */
  private generateFilename(title: string): string {
    const timestamp = this.formatTimestampForFilename(new Date());
    const sanitizedTitle = this.sanitizeFilename(title);
    return `${sanitizedTitle}_${timestamp}.pdf`;
  }

  /**
   * Format timestamp for display
   * @param date Date object
   * @returns Formatted timestamp string
   */
  private formatTimestamp(date: Date): string {
    return date.toLocaleString();
  }

  /**
   * Format timestamp for filename (YYYY-MM-DD_HH-MM format)
   * @param date Date object
   * @returns Formatted timestamp string for filename
   */
  private formatTimestampForFilename(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}_${hours}-${minutes}`;
  }

  /**
   * Sanitize filename to ensure cross-platform compatibility
   * @param filename Original filename
   * @returns Sanitized filename
   */
  private sanitizeFilename(filename: string): string {
    // Remove or replace invalid characters for filenames
    return filename
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters with underscore
      .replace(/\s+/g, '_') // Replace spaces with underscore
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  }
}

/**
 * Default PDF service instance
 */
export const pdfService = new PDFService();