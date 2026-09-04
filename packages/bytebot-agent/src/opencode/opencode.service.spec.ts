import { isThinkingContentBlock, MessageContentType } from '@bytebot/shared';

describe('OpenCode & Thinking Content Seams', () => {
  describe('isThinkingContentBlock', () => {
    it('should validate OpenCode reasoning block without signature', () => {
      const openCodeReasoning = {
        type: MessageContentType.Thinking,
        thinking: 'The user said hi, I will greet them.',
      };

      expect(isThinkingContentBlock(openCodeReasoning)).toBe(true);
    });

    it('should validate Anthropic thinking block with signature', () => {
      const anthropicThinking = {
        type: MessageContentType.Thinking,
        thinking: 'Let me think about this step.',
        signature: 'sig_abc123',
      };

      expect(isThinkingContentBlock(anthropicThinking)).toBe(true);
    });

    it('should return false for invalid or non-thinking blocks', () => {
      expect(isThinkingContentBlock({ type: 'text', text: 'hello' })).toBe(false);
      expect(isThinkingContentBlock(null)).toBe(false);
      expect(isThinkingContentBlock({ type: MessageContentType.Thinking })).toBe(false);
    });
  });

  describe('extractNewTurnMessages', () => {
    it('should return all messages for turn 1 (no assistant message yet)', () => {
      const messages: any[] = [
        { id: '1', role: 'USER', content: [{ type: 'text', text: 'hi' }] },
      ];

      // extractNewTurnMessages will be exported from opencode.service.ts
      const { extractNewTurnMessages } = require('./opencode.service');
      const result = extractNewTurnMessages(messages);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should return only messages after the last assistant message on subsequent turns', () => {
      const messages: any[] = [
        { id: '1', role: 'USER', content: [{ type: 'text', text: 'hi' }] },
        { id: '2', role: 'ASSISTANT', content: [{ type: 'text', text: 'Hello! How can I help you today?' }] },
        { id: '3', role: 'USER', content: [{ type: 'text', text: 'open firefox' }] },
      ];

      const { extractNewTurnMessages } = require('./opencode.service');
      const result = extractNewTurnMessages(messages);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
      expect((result[0].content[0] as any).text).toBe('open firefox');
    });
  });

  describe('getOpenCodeModels', () => {
    it('should include newly launched Muse Spark 1.3 Free in the model list', async () => {
      const { getOpenCodeModels } = require('./opencode.constants');
      const models = await getOpenCodeModels();
      expect(models.length).toBeGreaterThanOrEqual(7);
      const museSpark13 = models.find((m: any) => m.name.includes('muse-spark-1.3'));
      expect(museSpark13).toBeDefined();
      expect(museSpark13?.provider).toBe('opencode');
    });

    it('should only include free models with cost 0 or free indicator', async () => {
      const { getOpenCodeModels } = require('./opencode.constants');
      const models = await getOpenCodeModels();
      for (const m of models) {
        expect(m.provider).toBe('opencode');
        expect(m.title).toMatch(/free/i);
      }
    });
  });
});
