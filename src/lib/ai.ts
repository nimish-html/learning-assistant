import { xai } from '@ai-sdk/xai';

// Export xai instance for direct use
export { xai };

// Export configured grok model
export const grokModel = xai('grok-4-0709'); 