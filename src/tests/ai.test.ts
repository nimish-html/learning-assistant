import { xai, grokModel } from '@/lib/ai';

describe('AI Module Tests', () => {
  describe('xai export', () => {
    it('should export xai function', () => {
      expect(xai).toBeDefined();
      expect(typeof xai).toBe('function');
    });
  });

  describe('grokModel export', () => {
    it('should export configured grok model', () => {
      expect(grokModel).toBeDefined();
      expect(grokModel).toHaveProperty('modelId');
      expect(grokModel.modelId).toBe('grok-4-0709');
    });

    it('should have correct model configuration', () => {
      expect(grokModel).toHaveProperty('provider');
      expect(grokModel.provider).toBeDefined();
    });
  });

  describe('model instantiation', () => {
    it('should create XAI provider with custom model', () => {
      const model1 = xai('grok-4-0709');
      const model2 = xai('grok-4-0709');
      expect(model1.modelId).toBe('grok-4-0709');
      expect(model2.modelId).toBe('grok-4-0709');
    });
  });
}); 