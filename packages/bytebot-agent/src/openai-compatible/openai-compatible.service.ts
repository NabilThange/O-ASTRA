import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { APIUserAbortError } from 'openai';
import {
  ChatCompletionMessageParam,
  ChatCompletionContentPart,
} from 'openai/resources/chat/completions';
import {
  MessageContentBlock,
  MessageContentType,
  TextContentBlock,
  ToolUseContentBlock,
  ToolResultContentBlock,
  ImageContentBlock,
  isUserActionContentBlock,
  isComputerToolUseContentBlock,
  isImageContentBlock,
  ThinkingContentBlock,
} from '@bytebot/shared';
import { Message, Role } from '@prisma/client';
import { proxyTools } from '../proxy/proxy.tools';
import {
  BytebotAgentService,
  BytebotAgentInterrupt,
  BytebotAgentResponse,
} from '../agent/agent.types';

/**
 * OpenAICompatibleService supports any provider that exposes an OpenAI-compatible
 * Chat Completions API, including:
 *   - GroqCloud    (https://api.groq.com/openai/v1)
 *   - OpenRouter   (https://openrouter.ai/api/v1)
 *   - Ollama       (http://localhost:11434/v1)
 *   - DeepSeek     (https://api.deepseek.com/v1)
 *   - vLLM / LM Studio / LocalAI / Mistral / Together / etc.
 *
 * Required environment variables:
 *   OPENAI_COMPATIBLE_BASE_URL  — e.g. https://api.groq.com/openai/v1
 *   OPENAI_COMPATIBLE_API_KEY   — API key (use 'ollama' for local Ollama)
 *
 * Optional:
 *   OPENAI_COMPATIBLE_MODELS    — comma-separated model IDs to expose in the UI
 */
@Injectable()
export class OpenAICompatibleService implements BytebotAgentService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(OpenAICompatibleService.name);

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('OPENAI_COMPATIBLE_BASE_URL');
    const apiKey =
      this.configService.get<string>('OPENAI_COMPATIBLE_API_KEY') ||
      'no-key-needed'; // Ollama and some local servers don't need a key

    if (!baseURL) {
      this.logger.warn(
        'OPENAI_COMPATIBLE_BASE_URL is not set. OpenAICompatibleService will not work properly.',
      );
    }

    this.openai = new OpenAI({
      apiKey,
      baseURL: baseURL || 'http://localhost:11434/v1',
      // Some providers (e.g. OpenRouter) require extra headers
      defaultHeaders: this.buildDefaultHeaders(),
    });
  }

  /**
   * Build extra headers required by certain providers.
   * OpenRouter expects HTTP-Referer and X-Title for ranking/attribution.
   */
  private buildDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    const baseURL = process.env.OPENAI_COMPATIBLE_BASE_URL || '';

    if (baseURL.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = 'https://bytebot.ai';
      headers['X-Title'] = 'Aria';
    }

    return headers;
  }

  async generateMessage(
    systemPrompt: string,
    messages: Message[],
    model: string,
    useTools: boolean = true,
    signal?: AbortSignal,
  ): Promise<BytebotAgentResponse> {
    const chatMessages = this.formatMessagesForChatCompletion(
      systemPrompt,
      messages,
    );

    try {
      const completionRequest: OpenAI.Chat.ChatCompletionCreateParams = {
        model,
        messages: chatMessages,
        max_tokens: 8192,
        ...(useTools && { tools: proxyTools }),
      };

      const completion = await this.openai.chat.completions.create(
        completionRequest,
        { signal },
      );

      const choice = completion.choices[0];
      if (!choice || !choice.message) {
        throw new Error('No valid response from OpenAI-compatible API');
      }

      const contentBlocks = this.formatChatCompletionResponse(choice.message);

      return {
        contentBlocks,
        tokenUsage: {
          inputTokens: completion.usage?.prompt_tokens || 0,
          outputTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
      };
    } catch (error: any) {
      if (error instanceof APIUserAbortError) {
        this.logger.log('OpenAI-compatible API call aborted');
        throw new BytebotAgentInterrupt();
      }
      this.logger.error(
        `Error sending message to OpenAI-compatible endpoint: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Convert internal messages to ChatCompletionMessageParam format.
   * Images are inlined as base64 data URLs when the provider supports vision.
   */
  private formatMessagesForChatCompletion(
    systemPrompt: string,
    messages: Message[],
  ): ChatCompletionMessageParam[] {
    const chatMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (const message of messages) {
      const messageContentBlocks = message.content as MessageContentBlock[];
      const role = message.role === Role.ASSISTANT ? 'assistant' : 'user';

      if (role === 'assistant') {
        const toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[] = [];
        const textContent: string[] = [];

        for (const block of messageContentBlocks) {
          if (block.type === MessageContentType.Text) {
            textContent.push((block as TextContentBlock).text);
          } else if (
            block.type === MessageContentType.ToolUse &&
            isComputerToolUseContentBlock(block)
          ) {
            toolCalls.push({
              id: (block as ToolUseContentBlock).id,
              type: 'function',
              function: {
                name: (block as ToolUseContentBlock).name,
                arguments: JSON.stringify((block as ToolUseContentBlock).input),
              },
            });
          } else if (block.type === MessageContentType.Thinking) {
            // Skip thinking blocks (not natively supported in chat completions)
          }
        }

        if (toolCalls.length > 0) {
          chatMessages.push({
            role: 'assistant',
            content: textContent.join('\n') || null,
            tool_calls: toolCalls,
          });
        } else {
          chatMessages.push({
            role: 'assistant',
            content: textContent.join('\n'),
          });
        }
      } else {
        // USER message — may contain tool results and images
        const hasToolResults = messageContentBlocks.some(
          (b) => b.type === MessageContentType.ToolResult,
        );

        if (hasToolResults) {
          // Each tool result becomes its own 'tool' role message
          for (const block of messageContentBlocks) {
            if (block.type === MessageContentType.ToolResult) {
              const toolResult = block as ToolResultContentBlock;
              const resultParts: ChatCompletionContentPart[] = [];

              for (const contentBlock of toolResult.content) {
                if (contentBlock.type === MessageContentType.Text) {
                  resultParts.push({
                    type: 'text',
                    text: (contentBlock as TextContentBlock).text,
                  });
                } else if (
                  contentBlock.type === MessageContentType.Image &&
                  isImageContentBlock(contentBlock)
                ) {
                  const imgBlock = contentBlock as ImageContentBlock;
                  if (imgBlock.source.type === 'base64') {
                    resultParts.push({
                      type: 'image_url',
                      image_url: {
                        url: `data:${imgBlock.source.media_type};base64,${imgBlock.source.data}`,
                        detail: 'auto',
                      },
                    });
                  }
                }
              }

              chatMessages.push({
                role: 'tool',
                tool_call_id: toolResult.tool_use_id,
                content: resultParts.length === 1 && resultParts[0].type === 'text'
                  ? (resultParts[0] as OpenAI.Chat.ChatCompletionContentPartText).text
                  : resultParts,
              } as ChatCompletionMessageParam);
            }
          }
        } else if (isUserActionContentBlock(messageContentBlocks[0])) {
          // Skip pure user-action blocks (not meaningful for LLM)
        } else {
          const contentParts: ChatCompletionContentPart[] = [];
          for (const block of messageContentBlocks) {
            if (block.type === MessageContentType.Text) {
              contentParts.push({
                type: 'text',
                text: (block as TextContentBlock).text,
              });
            } else if (
              block.type === MessageContentType.Image &&
              isImageContentBlock(block)
            ) {
              const imgBlock = block as ImageContentBlock;
              if (imgBlock.source.type === 'base64') {
                contentParts.push({
                  type: 'image_url',
                  image_url: {
                    url: `data:${imgBlock.source.media_type};base64,${imgBlock.source.data}`,
                    detail: 'auto',
                  },
                });
              }
            }
          }
          if (contentParts.length > 0) {
            chatMessages.push({ role: 'user', content: contentParts });
          }
        }
      }
    }

    return chatMessages;
  }

  /**
   * Convert the Chat Completion response message to internal MessageContentBlock format.
   */
  private formatChatCompletionResponse(
    message: OpenAI.Chat.ChatCompletionMessage,
  ): MessageContentBlock[] {
    const blocks: MessageContentBlock[] = [];

    if (message.content) {
      blocks.push({
        type: MessageContentType.Text,
        text: message.content,
      } as TextContentBlock);
    }

    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        let parsedInput: Record<string, unknown> = {};
        try {
          parsedInput = JSON.parse(toolCall.function.arguments);
        } catch {
          this.logger.warn(
            `Failed to parse tool arguments for ${toolCall.function.name}`,
          );
        }

        blocks.push({
          type: MessageContentType.ToolUse,
          id: toolCall.id,
          name: toolCall.function.name,
          input: parsedInput,
        } as ToolUseContentBlock);
      }
    }

    return blocks;
  }
}
