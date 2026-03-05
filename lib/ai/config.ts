import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

export const aiModel = openai('gpt-4o-mini');

export const AI_CONFIG = {
    temperature: 0.7,
    maxTokens: 500,
};
