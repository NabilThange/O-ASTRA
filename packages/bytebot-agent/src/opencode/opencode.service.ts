import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  BytebotAgentResponse,
  BytebotAgentService,
} from '../agent/agent.types';
import { Message, Role } from '@prisma/client';
import {
  MessageContentBlock,
  MessageContentType,
  TextContentBlock,
  ImageContentBlock,
  ToolUseContentBlock,
  ThinkingContentBlock,
} from '@bytebot/shared';
import { OPENCODE_BASE_URL } from './opencode.constants';

/**
 * Extracts messages belonging to the current/newest turn.
 * In OpenCode's stateful session, prior turns are already preserved.
 * Slicing to only messages after the last assistant turn prevents message duplication.
 */
export function extractNewTurnMessages(messages: Message[]): Message[] {
  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === Role.ASSISTANT) {
      lastAssistantIndex = i;
      break;
    }
  }

  if (lastAssistantIndex === -1) {
    return messages;
  }

  return messages.slice(lastAssistantIndex + 1);
}

@Injectable()
export class OpenCodeService implements BytebotAgentService {
  private readonly logger = new Logger(OpenCodeService.name);
  private readonly baseUrl: string;
  private readonly sessions = new Map<string, string>();

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly prisma?: PrismaService,
  ) {
    this.baseUrl =
      this.configService.get<string>('OPENCODE_URL') ||
      this.configService.get<string>('OPENCODE_BASE_URL') ||
      OPENCODE_BASE_URL;

    this.logger.log(`OpenCodeService initialized with Base URL: ${this.baseUrl}`);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Creates or retrieves an existing OpenCode session for a given task ID.
   */
  async getOrCreateSession(taskId: string): Promise<string> {
    if (this.sessions.has(taskId)) {
      return this.sessions.get(taskId)!;
    }

    if (this.prisma) {
      try {
        const task = await this.prisma.task.findUnique({
          where: { id: taskId },
          select: { result: true },
        });
        const resultObj = task?.result as Record<string, any> | null;
        if (resultObj && typeof resultObj.openCodeSessionId === 'string') {
          this.sessions.set(taskId, resultObj.openCodeSessionId);
          return resultObj.openCodeSessionId;
        }
      } catch (err: any) {
        this.logger.warn(`Could not load openCodeSessionId from task: ${err.message}`);
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `bytebot-task-${taskId}` }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create OpenCode session: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      const sessionId = data.id || `session-${Date.now()}`;
      this.sessions.set(taskId, sessionId);

      if (this.prisma) {
        try {
          const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            select: { result: true },
          });
          const currentResult = (task?.result as Record<string, any>) || {};
          await this.prisma.task.update({
            where: { id: taskId },
            data: {
              result: {
                ...currentResult,
                openCodeSessionId: sessionId,
              },
            },
          });
        } catch (e: any) {
          this.logger.warn(`Could not save openCodeSessionId to task: ${e.message}`);
        }
      }

      return sessionId;
    } catch (error: any) {
      this.logger.warn(
        `Could not create remote OpenCode session on ${this.baseUrl}: ${error.message}. Using fallback session ID.`,
      );
      const fallbackId = `fallback-session-${taskId}`;
      this.sessions.set(taskId, fallbackId);
      return fallbackId;
    }
  }

  /**
   * Formats Bytebot database messages into OpenCode parts payload (supporting Multimodal Vision / Screenshots).
   */
  private formatMessagesToParts(messages: Message[]): Array<any> {
    const parts: Array<any> = [];

    for (const msg of messages) {
      const blocks = (msg.content as unknown as MessageContentBlock[]) || [];

      for (const block of blocks) {
        if (block.type === MessageContentType.Text) {
          parts.push({
            type: 'text',
            text: `[${msg.role}]: ${(block as TextContentBlock).text}`,
          });
        } else if (block.type === MessageContentType.Image) {
          const imgBlock = block as ImageContentBlock;
          parts.push({
            type: 'image',
            image: imgBlock.source.data,
            mimeType: imgBlock.source.media_type || 'image/png',
          });
        }
      }
    }

    return parts;
  }

  /**
   * Main entry point for generating responses from OpenCode with MIMO v2.
   */
  async generateMessage(
    systemPrompt: string,
    messages: Message[],
    model: string = 'mimo-v2',
    useTools: boolean = true,
    signal?: AbortSignal,
  ): Promise<BytebotAgentResponse> {
    const taskId = messages[0]?.taskId || 'default-task';
    const sessionId = await this.getOrCreateSession(taskId);
    
    // In OpenCode's stateful session, only send the new turn's messages if previous turns exist
    const hasPriorAssistantTurn = messages.some((m) => m.role === Role.ASSISTANT);
    const turnMessages = hasPriorAssistantTurn
      ? extractNewTurnMessages(messages)
      : messages;

    const parts = this.formatMessagesToParts(turnMessages.length > 0 ? turnMessages : messages);

    // Prepend concise, high-impact computer-use custom instructions to the prompt on each turn
    const customInstructions = [
      `[CRITICAL COMPUTER-USE DIRECTIVE]:`,
      `1. You operate exclusively on the Ubuntu desktop GUI (display :0). Never use external web search tools or APIs. If asked to search or find information, you MUST open Firefox on desktop and search on screen.`,
      `2. Think and execute in fundamental atomic steps: open/launch app -> verify window -> focus element -> verify focus -> type/press hotkey -> verify result. Never skip intermediate verification.`,
    ].join('\n');

    if (parts.length > 0 && parts[0].type === 'text') {
      parts[0].text = `${customInstructions}\n\n${parts[0].text || ''}`;
    }

    try {
      this.logger.debug(
        `Posting ${parts.length} parts to OpenCode session ${sessionId} using model ${model}`,
      );

      let modelPayload: { providerID: string; modelID: string } | undefined;
      if (model && model.includes('/')) {
        const slashIdx = model.indexOf('/');
        modelPayload = {
          providerID: model.substring(0, slashIdx),
          modelID: model.substring(slashIdx + 1),
        };
      } else if (model && model !== 'default') {
        modelPayload = {
          providerID: 'opencode',
          modelID: model,
        };
      }

      const response = await fetch(`${this.baseUrl}/session/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parts,
          ...(modelPayload ? { model: modelPayload } : {}),
        }),
        signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          `OpenCode error ${response.status}: ${errText || response.statusText}`,
        );
      }

      const result = await response.json();
      const contentBlocks: MessageContentBlock[] = [];

      if (result.parts && Array.isArray(result.parts)) {
        let openCodeFinished = false;

        for (const part of result.parts) {
          if (part.type === 'text' && part.text) {
            contentBlocks.push({
              type: MessageContentType.Text,
              text: part.text,
            });
          } else if (part.type === 'reasoning' || part.type === 'thought') {
            contentBlocks.push({
              type: MessageContentType.Thinking,
              thinking: part.text || part.reasoning || '',
            } as ThinkingContentBlock);
          } else if (part.type === 'tool' || part.tool) {
            contentBlocks.push({
              type: MessageContentType.ToolUse,
              id: part.id || `tool-${Date.now()}`,
              name: part.tool || part.name,
              input: part.args || part.input || {},
            } as ToolUseContentBlock);
          } else if (part.type === 'step-finish' && part.reason === 'stop') {
            // ponytail: OpenCode finished — inject set_task_status so the processor loop exits
            openCodeFinished = true;
          }
        }

        const hasTools = contentBlocks.some(
          (b) => b.type === MessageContentType.ToolUse,
        );

        if (openCodeFinished && !hasTools) {
          contentBlocks.push({
            type: MessageContentType.ToolUse,
            id: `opencode-done-${Date.now()}`,
            name: 'set_task_status',
            input: { status: 'completed', description: 'Task completed by OpenCode.' },
          } as ToolUseContentBlock);
        }
      }

      // If no specific blocks were extracted, fallback to raw text or result string
      if (contentBlocks.length === 0) {
        contentBlocks.push({
          type: MessageContentType.Text,
          text:
            typeof result === 'string'
              ? result
              : result.response || result.message || 'Task processed by OpenCode.',
        });
      }

      return {
        contentBlocks,
        tokenUsage: {
          inputTokens: result.usage?.input_tokens || 1000,
          outputTokens: result.usage?.output_tokens || 200,
          totalTokens: result.usage?.total_tokens || 1200,
        },
      };
    } catch (error: any) {
      this.logger.error(`OpenCode generateMessage failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
