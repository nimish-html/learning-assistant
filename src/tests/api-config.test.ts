// Mock the process.env
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co'
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('API Configuration Service', () => {
  
  it('should validate environment variables', async () => {
    const apiConfig = await import('../lib/api-config');
    // Should not throw when NEXT_PUBLIC_SUPABASE_URL is set
    expect(() => apiConfig.validateEnvironment()).not.toThrow();
  });
  
  it('should generate correct Edge Function URLs', async () => {
    const apiConfig = await import('../lib/api-config');
    const config = apiConfig.getApiConfig();
    
    expect(config.generateQuestionsUrl).toBe('https://example.supabase.co/functions/v1/generate-questions');
    expect(config.verifyQuestionsUrl).toBe('https://example.supabase.co/functions/v1/verify-questions');
    expect(config.chatStreamUrl).toBe('https://example.supabase.co/functions/v1/chat-stream');
  });
  
  it('should have a default export with the API configuration', async () => {
    const apiConfig = await import('../lib/api-config');
    expect(apiConfig.default).toEqual({
      generateQuestionsUrl: 'https://example.supabase.co/functions/v1/generate-questions',
      verifyQuestionsUrl: 'https://example.supabase.co/functions/v1/verify-questions',
      chatStreamUrl: 'https://example.supabase.co/functions/v1/chat-stream',
    });
  });
});