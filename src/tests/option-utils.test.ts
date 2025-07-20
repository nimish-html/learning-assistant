import {
  hasOptionLabels,
  formatOption,
  formatOptions,
  hasAnyOptionLabels
} from '../lib/option-utils';

describe('option-utils', () => {
  describe('hasOptionLabels', () => {
    it('should return true for options with labels', () => {
      expect(hasOptionLabels('A. This is option A')).toBe(true);
      expect(hasOptionLabels('B. This is option B')).toBe(true);
      expect(hasOptionLabels('C. This is option C')).toBe(true);
      expect(hasOptionLabels('D. This is option D')).toBe(true);
      expect(hasOptionLabels('Z. This is option Z')).toBe(true);
    });

    it('should return false for options without labels', () => {
      expect(hasOptionLabels('This is option A')).toBe(false);
      expect(hasOptionLabels('Option without label')).toBe(false);
      expect(hasOptionLabels('A This is not labeled')).toBe(false);
      expect(hasOptionLabels('A.This has no space')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(hasOptionLabels('')).toBe(false);
      expect(hasOptionLabels('   ')).toBe(false);
      expect(hasOptionLabels('  A. Trimmed option  ')).toBe(true);
      expect(hasOptionLabels(null as any)).toBe(false);
      expect(hasOptionLabels(undefined as any)).toBe(false);
      expect(hasOptionLabels(123 as any)).toBe(false);
    });

    it('should handle lowercase letters', () => {
      expect(hasOptionLabels('a. lowercase option')).toBe(false);
      expect(hasOptionLabels('b. another lowercase')).toBe(false);
    });

    it('should handle numbers and special characters', () => {
      expect(hasOptionLabels('1. Numbered option')).toBe(false);
      expect(hasOptionLabels('!. Special character')).toBe(false);
      expect(hasOptionLabels('AA. Double letter')).toBe(false);
    });
  });

  describe('formatOption', () => {
    it('should add labels to options without them', () => {
      expect(formatOption('This is option A', 0)).toBe('A. This is option A');
      expect(formatOption('This is option B', 1)).toBe('B. This is option B');
      expect(formatOption('This is option C', 2)).toBe('C. This is option C');
      expect(formatOption('This is option D', 3)).toBe('D. This is option D');
    });

    it('should not add labels to options that already have them', () => {
      expect(formatOption('A. This is option A', 0)).toBe('A. This is option A');
      expect(formatOption('B. This is option B', 1)).toBe('B. This is option B');
      expect(formatOption('C. This is option C', 2)).toBe('C. This is option C');
      expect(formatOption('D. This is option D', 3)).toBe('D. This is option D');
    });

    it('should handle trimming whitespace', () => {
      expect(formatOption('  This needs trimming  ', 0)).toBe('A. This needs trimming');
      expect(formatOption('  A. Already labeled  ', 1)).toBe('A. Already labeled');
    });

    it('should handle edge cases', () => {
      expect(formatOption('', 0)).toBe('');
      expect(formatOption('   ', 0)).toBe('A. ');
      expect(formatOption(null as any, 0)).toBe('');
      expect(formatOption(undefined as any, 0)).toBe('');
      expect(formatOption(123 as any, 0)).toBe('');
    });

    it('should generate correct labels for higher indices', () => {
      expect(formatOption('Option E', 4)).toBe('E. Option E');
      expect(formatOption('Option F', 5)).toBe('F. Option F');
      expect(formatOption('Option Z', 25)).toBe('Z. Option Z');
    });
  });

  describe('formatOptions', () => {
    it('should format an array of options without labels', () => {
      const options = ['First option', 'Second option', 'Third option', 'Fourth option'];
      const expected = ['A. First option', 'B. Second option', 'C. Third option', 'D. Fourth option'];
      expect(formatOptions(options)).toEqual(expected);
    });

    it('should preserve existing labels in mixed arrays', () => {
      const options = ['A. First option', 'Second option', 'C. Third option', 'Fourth option'];
      const expected = ['A. First option', 'B. Second option', 'C. Third option', 'D. Fourth option'];
      expect(formatOptions(options)).toEqual(expected);
    });

    it('should handle arrays with all labeled options', () => {
      const options = ['A. First option', 'B. Second option', 'C. Third option', 'D. Fourth option'];
      const expected = ['A. First option', 'B. Second option', 'C. Third option', 'D. Fourth option'];
      expect(formatOptions(options)).toEqual(expected);
    });

    it('should handle empty arrays and edge cases', () => {
      expect(formatOptions([])).toEqual([]);
      expect(formatOptions(null as any)).toEqual([]);
      expect(formatOptions(undefined as any)).toEqual([]);
      expect(formatOptions('not an array' as any)).toEqual([]);
    });

    it('should handle arrays with empty or invalid options', () => {
      const options = ['Valid option', '', null as any, 'Another valid option'];
      const expected = ['A. Valid option', '', '', 'D. Another valid option'];
      expect(formatOptions(options)).toEqual(expected);
    });
  });

  describe('hasAnyOptionLabels', () => {
    it('should return true if any option has labels', () => {
      const options1 = ['A. Labeled option', 'Unlabeled option', 'Another unlabeled'];
      const options2 = ['Unlabeled', 'B. Labeled option', 'Another unlabeled'];
      const options3 = ['Unlabeled', 'Another unlabeled', 'C. Labeled option'];
      
      expect(hasAnyOptionLabels(options1)).toBe(true);
      expect(hasAnyOptionLabels(options2)).toBe(true);
      expect(hasAnyOptionLabels(options3)).toBe(true);
    });

    it('should return false if no options have labels', () => {
      const options = ['Unlabeled option', 'Another unlabeled', 'Third unlabeled'];
      expect(hasAnyOptionLabels(options)).toBe(false);
    });

    it('should return true if all options have labels', () => {
      const options = ['A. First option', 'B. Second option', 'C. Third option'];
      expect(hasAnyOptionLabels(options)).toBe(true);
    });

    it('should handle edge cases', () => {
      expect(hasAnyOptionLabels([])).toBe(false);
      expect(hasAnyOptionLabels(null as any)).toBe(false);
      expect(hasAnyOptionLabels(undefined as any)).toBe(false);
      expect(hasAnyOptionLabels('not an array' as any)).toBe(false);
    });

    it('should handle arrays with empty or invalid options', () => {
      const options1 = ['', null as any, undefined as any];
      const options2 = ['A. Valid option', '', null as any];
      
      expect(hasAnyOptionLabels(options1)).toBe(false);
      expect(hasAnyOptionLabels(options2)).toBe(true);
    });
  });
});