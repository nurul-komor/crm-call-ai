/**
 * Provider-agnostic interface for LLM completion + summarization + structured
 * extraction. Implemented for OpenAI in Phase 1; Claude/Gemini/OpenRouter
 * implementations slot in behind the same interface in Phases 2+.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompleteStreamParams {
  systemPrompt: string;
  history: ChatMessage[];
  userInput: string;
  maxTokens?: number;
}

export interface ExtractionField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  description?: string;
  enumValues?: string[];
  required?: boolean;
}

export interface AIProvider {
  readonly name: 'openai' | 'claude' | 'gemini' | 'openrouter';
  readonly model: string;
  completeStream(params: CompleteStreamParams): AsyncIterable<string>;
  summarize(
    transcript: string,
  ): Promise<{ summary: string; sentiment: 'positive' | 'neutral' | 'negative' }>;
  extract<T extends Record<string, unknown>>(
    transcript: string,
    fields: ExtractionField[],
  ): Promise<T>;
}
