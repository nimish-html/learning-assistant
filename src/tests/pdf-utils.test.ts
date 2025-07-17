import {
  generateCombinedPDFFilename,
  generateQuestionsPDFFilename,
  generateAnswersPDFFilename,
  formatTimestampForFilename,
  sanitizeFilename,
  generatePDFFilename,
  validateFilename
} from '../lib/pdf-utils';

describe('PDF Utils', () => {
  const testDate = new Date('2024-01-15T14:30:00');

  describe('formatTimestampForFilename', () => {
    it('should format timestamp in YYYY-MM-DD_HH-MM format', () => {
      const result = formatTimestampForFilename(testDate);
      expect(result).toBe('2024-01-15_14-30');
    });

    it('should pad single digits with zeros', () => {
      const testDate = new Date('2024-01-05T09:05:00');
      const result = formatTimestampForFilename(testDate);
      expect(result).toBe('2024-01-05_09-05');
    });
  });

  describe('generateCombinedPDFFilename', () => {
    it('should generate correct filename for combined PDF', () => {
      const result = generateCombinedPDFFilename(testDate);
      expect(result).toBe('Questions_and_Answers_2024-01-15_14-30.pdf');
    });

    it('should use current time when no timestamp provided', () => {
      const result = generateCombinedPDFFilename();
      expect(result).toMatch(/^Questions_and_Answers_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.pdf$/);
    });
  });

  describe('generateQuestionsPDFFilename', () => {
    it('should generate correct filename for questions PDF', () => {
      const result = generateQuestionsPDFFilename(testDate);
      expect(result).toBe('Questions_2024-01-15_14-30.pdf');
    });
  });

  describe('generateAnswersPDFFilename', () => {
    it('should generate correct filename for answers PDF', () => {
      const result = generateAnswersPDFFilename(testDate);
      expect(result).toBe('Answers_2024-01-15_14-30.pdf');
    });
  });

  describe('sanitizeFilename', () => {
    it('should replace invalid characters with underscores', () => {
      const result = sanitizeFilename('test<>:"/\\|?*file');
      expect(result).toBe('test_file');
    });

    it('should replace spaces with underscores', () => {
      const result = sanitizeFilename('test file name');
      expect(result).toBe('test_file_name');
    });

    it('should remove multiple consecutive underscores', () => {
      const result = sanitizeFilename('test___file');
      expect(result).toBe('test_file');
    });

    it('should remove leading and trailing underscores', () => {
      const result = sanitizeFilename('_test_file_');
      expect(result).toBe('test_file');
    });
  });

  describe('generatePDFFilename', () => {
    it('should generate questions filename', () => {
      const result = generatePDFFilename('questions', undefined, testDate);
      expect(result).toBe('Questions_2024-01-15_14-30.pdf');
    });

    it('should generate answers filename', () => {
      const result = generatePDFFilename('answers', undefined, testDate);
      expect(result).toBe('Answers_2024-01-15_14-30.pdf');
    });

    it('should generate combined filename', () => {
      const result = generatePDFFilename('combined', undefined, testDate);
      expect(result).toBe('Questions_and_Answers_2024-01-15_14-30.pdf');
    });

    it('should use custom title when provided', () => {
      const result = generatePDFFilename('questions', 'Custom Title', testDate);
      expect(result).toBe('Custom_Title_2024-01-15_14-30.pdf');
    });
  });

  describe('validateFilename', () => {
    it('should validate clean filename as valid', () => {
      const result = validateFilename('test_file.pdf');
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect invalid characters', () => {
      const result = validateFilename('test<file>.pdf');
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Contains invalid characters');
    });

    it('should detect reserved names', () => {
      const result = validateFilename('CON.pdf');
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Uses reserved filename');
    });

    it('should detect filename too long', () => {
      const longName = 'a'.repeat(260) + '.pdf';
      const result = validateFilename(longName);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Filename too long');
    });

    it('should provide sanitized version', () => {
      const result = validateFilename('test<>file.pdf');
      expect(result.sanitized).toBe('test_file.pdf');
    });
  });
});