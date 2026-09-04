import { BytebotAgentModel } from '../agent/agent.types';

export const OPENCODE_BASE_URL =
  process.env.OPENCODE_URL ||
  process.env.OPENCODE_BASE_URL ||
  'http://opencode:4096';

export const OPENCODE_MODELS: BytebotAgentModel[] = [
  {
    provider: 'opencode' as const,
    name: 'opencode/muse-spark-1.3-contributor-free',
    title: 'Muse Spark 1.3 Free (Multimodal, 1M Context)',
    contextWindow: 1048576,
  },
  {
    provider: 'opencode' as const,
    name: 'opencode/nemotron-3-ultra-free',
    title: 'Nemotron 3 Ultra Free (1M Context)',
    contextWindow: 1000000,
  },
  {
    provider: 'opencode' as const,
    name: 'opencode/nemotron-3.5-lightning-free',
    title: 'Nemotron 3.5 Lightning Free (262k Context)',
    contextWindow: 262144,
  },
  {
    provider: 'opencode' as const,
    name: 'opencode/mimo-v2.5-free',
    title: 'MiMo V2.5 Free (Multimodal, 200k Context)',
    contextWindow: 200000,
  },
  {
    provider: 'opencode' as const,
    name: 'opencode/ling-3.0-flash-fin-free',
    title: 'Ling 3.0 Flash Fin Free (262k Context)',
    contextWindow: 262144,
  },
  {
    provider: 'opencode' as const,
    name: 'opencode/big-pickle',
    title: 'Big Pickle (200k Context)',
    contextWindow: 200000,
  },
  {
    provider: 'opencode' as const,
    name: 'opencode/muse-spark-1.2-contributor-free',
    title: 'Muse Spark 1.2 Free (1M Context)',
    contextWindow: 1048576,
  },
];

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
let _cachedModels: { models: BytebotAgentModel[]; timestamp: number } | null = null;

/**
 * Dynamically fetches all free models from OpenCode /provider API with fallback to static constants.
 */
export async function getOpenCodeModels(): Promise<BytebotAgentModel[]> {
  if (_cachedModels && Date.now() - _cachedModels.timestamp < CACHE_TTL_MS) {
    return _cachedModels.models;
  }

  // 1. Query OpenCode server provider endpoint for authoritative live model list
  try {
    const res = await fetch(`${OPENCODE_BASE_URL}/provider`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = (await res.json()) as any;
      const providers: any[] = data.all || [];
      const discoveredModels: BytebotAgentModel[] = [];

      for (const provider of providers) {
        if (provider.id === 'opencode' || provider.id === 'opencode-go') {
          const modelsObj = provider.models || {};
          for (const model of Object.values(modelsObj) as any[]) {
            const isFree =
              (model.cost?.input === 0 && model.cost?.output === 0) ||
              (model.id && model.id.includes('free'));
            if (isFree && model.status !== 'deprecated') {
              const ctx = model.limit?.context;
              const ctxLabel = ctx
                ? ctx >= 1000000
                  ? `${Math.round(ctx / 1000000)}M`
                  : `${Math.round(ctx / 1000)}k`
                : '';
              const title = `${model.name || model.id} (Free${ctxLabel ? `, ${ctxLabel}` : ''})`;

              discoveredModels.push({
                provider: 'opencode' as const,
                name: `${provider.id}/${model.id}`,
                title,
                contextWindow: ctx || 128000,
              });
            }
          }
        }
      }

      if (discoveredModels.length > 0) {
        // Sort so the newest Muse Spark 1.3 and Nemotron 3 Ultra appear at the top
        discoveredModels.sort((a, b) => {
          if (a.name.includes('muse-spark-1.3')) return -1;
          if (b.name.includes('muse-spark-1.3')) return 1;
          if (a.name.includes('nemotron-3-ultra')) return -1;
          if (b.name.includes('nemotron-3-ultra')) return 1;
          return 0;
        });

        _cachedModels = { models: discoveredModels, timestamp: Date.now() };
        return discoveredModels;
      }
    }
  } catch {
    // Continue to fallback
  }

  return OPENCODE_MODELS;
}
