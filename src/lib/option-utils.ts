/**
 * Utility functions for handling option labels (A., B., C., D.) in questions
 * Prevents duplicate labels when options already contain them
 */

/**
 * Checks if an option string already starts with a label like "A.", "B.", etc.
 * @param option - The option text to check
 * @returns true if the option already has a label, false otherwise
 */
export function hasOptionLabels(option: string): boolean {
  if (!option || typeof option !== 'string') {
    return false;
  }
  
  const trimmed = option.trim();
  // Check for pattern: Letter followed by period and space (A. , B. , etc.)
  return /^[A-Z]\.\s/.test(trimmed);
}

/**
 * Formats an option with appropriate labeling, avoiding duplication
 * @param option - The option text to format
 * @param index - The zero-based index for the option (0 = A, 1 = B, etc.)
 * @returns The formatted option string
 */
export function formatOption(option: string, index: number): string {
  if (!option || typeof option !== 'string') {
    return '';
  }
  
  const trimmed = option.trim();
  
  // If option already has labels, return as-is
  if (hasOptionLabels(trimmed)) {
    return trimmed;
  }
  
  // Generate label (A, B, C, D, etc.)
  const label = String.fromCharCode(65 + index);
  return `${label}. ${trimmed}`;
}

/**
 * Formats an array of options with appropriate labeling
 * @param options - Array of option strings
 * @returns Array of formatted option strings
 */
export function formatOptions(options: string[]): string[] {
  if (!Array.isArray(options)) {
    return [];
  }
  
  return options.map((option, index) => formatOption(option, index));
}

/**
 * Detects if any option in an array already has labels
 * @param options - Array of option strings to check
 * @returns true if any option has labels, false otherwise
 */
export function hasAnyOptionLabels(options: string[]): boolean {
  if (!Array.isArray(options)) {
    return false;
  }
  
  return options.some(option => hasOptionLabels(option));
}