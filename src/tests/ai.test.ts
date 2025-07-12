import { grok, o3, gpt41, pickModel } from '@/lib/ai';

describe('AI Module Tests', () => {
  describe('grok runtime', () => {
    it('should export configured grok runtime', () => {
      expect(grok).toBeDefined();
      expect(grok).toHaveProperty('modelId');
      expect(grok.modelId).toBe('grok-4-0709');
    });
  });

  describe('openai runtimes', () => {
    it('should export o3 and gpt-4.1 runtimes', () => {
      expect(o3.modelId).toBe('o3');
      expect(gpt41.modelId).toBe('gpt-4.1');
    });
  });

  describe('pickModel helper', () => {
    it('should return the correct runtime for each id', () => {
      expect(pickModel('grok-4-0709')).toBe(grok);
      expect(pickModel('o3')).toBe(o3);
      expect(pickModel('gpt-4.1')).toBe(gpt41);
    });
  });
});