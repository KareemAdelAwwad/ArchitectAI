import { AIClientConfig, AIProvider, ProviderPreset } from '@/types/ai';

export const PROVIDER_PRESETS: Record<AIProvider, ProviderPreset> = {
  gemini: {
    name: 'Google Gemini',
    provider: 'gemini',
    defaultBaseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    defaultModel: 'gemini-2.5-pro',
    placeholderKey: 'AIzaSy...',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    description: 'Generous free tier with strong reasoning performance.',
    recommendedModels: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro']
  },
  openai: {
    name: 'OpenAI',
    provider: 'openai',
    defaultBaseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    placeholderKey: 'sk-proj-...',
    keyUrl: 'https://platform.openai.com/api-keys',
    description: 'Industry-standard GPT-4o models.',
    recommendedModels: ['gpt-4o', 'gpt-4o-mini', 'o1-mini']
  },
  openrouter: {
    name: 'OpenRouter',
    provider: 'openrouter',
    defaultBaseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    placeholderKey: 'sk-or-v1-...',
    keyUrl: 'https://openrouter.ai/keys',
    description: 'Unified router for Claude, GPT, DeepSeek, and Llama.',
    recommendedModels: [
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'deepseek/deepseek-chat',
      'meta-llama/llama-3.3-70b-instruct'
    ]
  },
  groq: {
    name: 'Groq',
    provider: 'groq',
    defaultBaseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    placeholderKey: 'gsk_...',
    keyUrl: 'https://console.groq.com/keys',
    description: 'Ultra-fast inference for open source models.',
    recommendedModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768']
  },
  custom: {
    name: 'Custom / Local (Ollama)',
    provider: 'custom',
    defaultBaseURL: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    placeholderKey: 'ollama (or API key if required)',
    keyUrl: '',
    description: 'Any OpenAI-compatible server (Ollama, vLLM, LM Studio, LiteLLM).',
    recommendedModels: ['llama3.2', 'mistral', 'qwen2.5-coder']
  }
};

const STORAGE_KEY = 'architect_ai_config';

export function getStoredAIConfig(): AIClientConfig {
  if (typeof window === 'undefined') {
    return {
      provider: 'gemini',
      baseURL: PROVIDER_PRESETS.gemini.defaultBaseURL,
      model: PROVIDER_PRESETS.gemini.defaultModel,
      apiKey: ''
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        provider: 'gemini',
        baseURL: PROVIDER_PRESETS.gemini.defaultBaseURL,
        model: PROVIDER_PRESETS.gemini.defaultModel,
        apiKey: ''
      };
    }
    const parsed = JSON.parse(raw);
    return {
      provider: parsed.provider || 'gemini',
      baseURL: parsed.baseURL || PROVIDER_PRESETS.gemini.defaultBaseURL,
      model: parsed.model || PROVIDER_PRESETS.gemini.defaultModel,
      apiKey: parsed.apiKey || ''
    };
  } catch {
    return {
      provider: 'gemini',
      baseURL: PROVIDER_PRESETS.gemini.defaultBaseURL,
      model: PROVIDER_PRESETS.gemini.defaultModel,
      apiKey: ''
    };
  }
}

export function setStoredAIConfig(config: AIClientConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('architect_ai_config_updated', { detail: config }));
  } catch {
    // ignore local storage errors
  }
}

export function hasValidAIKey(): boolean {
  const config = getStoredAIConfig();
  // For local custom endpoints (e.g. localhost), an apiKey is not always mandatory
  if (config.provider === 'custom' && config.baseURL?.includes('localhost')) {
    return true;
  }
  return Boolean(config.apiKey && config.apiKey.trim().length > 0);
}

export function getAIHeaders(): Record<string, string> {
  const config = getStoredAIConfig();
  const headers: Record<string, string> = {};
  if (config.apiKey) headers['x-ai-api-key'] = config.apiKey.trim();
  if (config.baseURL) headers['x-ai-base-url'] = config.baseURL.trim();
  if (config.model) headers['x-ai-model'] = config.model.trim();
  return headers;
}
