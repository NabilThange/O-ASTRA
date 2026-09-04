import { BytebotAgentModel } from '../agent/agent.types';

/**
 * Parse the OPENAI_COMPATIBLE_MODELS env var (comma-separated list of model names)
 * and build the model list at startup.
 *
 * Example env var:
 *   OPENAI_COMPATIBLE_MODELS=llama-3.3-70b-versatile,gemma2-9b-it
 *
 * If not set, falls back to a sensible default for Groq.
 */
function buildCompatibleModels(): BytebotAgentModel[] {
  const raw = process.env.OPENAI_COMPATIBLE_MODELS || '';
  const names = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (names.length === 0) {
    // Default: well-known free Groq model with vision support
    return [
      {
        provider: 'openai-compatible',
        name: 'meta-llama/llama-4-scout-17b-16e-instruct',
        title: 'Llama 4 Scout (Compatible)',
        contextWindow: 128000,
      },
    ];
  }

  return names.map((name) => ({
    provider: 'openai-compatible' as const,
    name,
    // Use the part after last '/' as human-readable title if it's a slash-path model name
    title: name.includes('/') ? name.split('/').pop()! : name,
    contextWindow: 128000, // Conservative default; override per-model if needed
  }));
}

export const OPENAI_COMPATIBLE_MODELS: BytebotAgentModel[] = buildCompatibleModels();
