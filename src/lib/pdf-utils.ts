/**
 * Utility functions for PDF filename generation and formatting
 * Supports requirements 4.1, 4.2, 4.3, 4.4
 */

/**
 * Generate filename for combined PDF (questions and answers together)
 * @param timestamp Optional timestamp, defaults to current time
 * @returns Filename in format "Questions_and_Answers_[timestamp].pdf"
 */
export function generateCombinedPDFFilename(timestamp?: Date): string {
  const formattedTimestamp = formatTimestampForFilename(timestamp || new Date());
  return `Questions_and_Answers_${formattedTimestamp}.pdf`;
}

/**
 * Generate filename for questions-only PDF
 * @param timestamp Optional timestamp, defaults to current time
 * @returns Filename in format "Questions_[timestamp].pdf"
 */
export function generateQuestionsPDFFilename(timestamp?: Date): string {
  const formattedTimestamp = formatTimestampForFilename(timestamp || new Date());
  return `Questions_${formattedTimestamp}.pdf`;
}

/**
 * Generate filename for answers-only PDF
 * @param timestamp Optional timestamp, defaults to current time
 * @returns Filename in format "Answers_[timestamp].pdf"
 */
export function generateAnswersPDFFilename(timestamp?: Date): string {
  const formattedTimestamp = formatTimestampForFilename(timestamp || new Date());
  return `Answers_${formattedTimestamp}.pdf`;
}

/**
 * Format timestamp for filename in YYYY-MM-DD_HH-MM format
 * @param date Date object to format
 * @returns Formatted timestamp string
 */
export function formatTimestampForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}-${minutes}`;
}

/**
 * Sanitize filename to ensure cross-platform compatibility
 * Removes or replaces characters that are invalid in filenames
 * @param filename Original filename
 * @returns Sanitized filename safe for all operating systems
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

/**
 * Generate filename based on document type and content
 * @param documentType Type of document ('questions', 'answers', 'combined')
 * @param customTitle Optional custom title for the document
 * @param timestamp Optional timestamp, defaults to current time
 * @returns Generated filename with proper formatting
 */
export function generatePDFFilename(
  documentType: 'questions' | 'answers' | 'combined',
  customTitle?: string,
  timestamp?: Date
): string {
  const formattedTimestamp = formatTimestampForFilename(timestamp || new Date());
  
  if (customTitle) {
    const sanitizedTitle = sanitizeFilename(customTitle);
    return `${sanitizedTitle}_${formattedTimestamp}.pdf`;
  }
  
  switch (documentType) {
    case 'questions':
      return generateQuestionsPDFFilename(timestamp);
    case 'answers':
      return generateAnswersPDFFilename(timestamp);
    case 'combined':
      return generateCombinedPDFFilename(timestamp);
    default:
      return `Document_${formattedTimestamp}.pdf`;
  }
}

/**
 * Validate filename for cross-platform compatibility
 * @param filename Filename to validate
 * @returns Object with validation result and sanitized filename
 */
export function validateFilename(filename: string): {
  isValid: boolean;
  sanitized: string;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check for invalid characters
  if (/[<>:"/\\|?*]/.test(filename)) {
    issues.push('Contains invalid characters');
  }
  
  // Check for reserved names (Windows)
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '').toUpperCase();
  if (reservedNames.includes(nameWithoutExt)) {
    issues.push('Uses reserved filename');
  }
  
  // Check length (most filesystems support 255 characters)
  if (filename.length > 255) {
    issues.push('Filename too long');
  }
  
  // Check for leading/trailing spaces or dots
  if (filename.startsWith(' ') || filename.endsWith(' ') || filename.startsWith('.') || filename.endsWith('.')) {
    issues.push('Invalid leading or trailing characters');
  }
  
  return {
    isValid: issues.length === 0,
    sanitized: sanitizeFilename(filename),
    issues
  };
}