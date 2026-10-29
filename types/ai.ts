export type AIProvider = 'gemini' | 'openai' | 'openrouter' | 'groq' | 'custom';

export interface AIClientConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  provider?: AIProvider;
}

export interface ProviderPreset {
  name: string;
  provider: AIProvider;
  defaultBaseURL: string;
  defaultModel: string;
  placeholderKey: string;
  keyUrl: string;
  description: string;
  recommendedModels: string[];
}
