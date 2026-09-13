import { Injectable, Logger, Optional, Inject, forwardRef } from '@nestjs/common';
import { TasksGateway } from '../tasks/tasks.gateway';
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

export const ARIA_FIRST_PROMPT_PREAMBLE = `You are Aria, an autonomous computer-use agent.
Please read and follow all instructions in AGENTS.md.

Before your first action, take a screenshot to orient yourself to current screen state.

Available skills in .opencode/skills/ (<tool_name>/SKILL.md), grouped by purpose:

Desktop control:
- desktop, open_application, take_screenshot
- mouse_click, move_cursor, mouse_down, mouse_up, mouse_drag, mouse_scroll
- type_text, press_hotkey

Browser (use for ANY web content instead of desktop clicks or external APIs):
- browser_navigate, browser_snapshot, browser_click, browser_type
- browser_extract_text, browser_close, browser_tabs

Communication:
- send_email

3D modeling & CAD:
- 3d_model (Partwright Studio CAD at https://www.partwrightstudio.com/editor, JS & OpenSCAD, non-generic geometry, 3MF export)

Before using any tool for the first time this session, call skill({ name: "<tool_name>" }) to confirm exact parameter syntax — do not guess coordinates, selectors, or argument formats.

Window Management:
Try to use most applications in full screen or maximized state for clear visibility and accurate targeting.
To make any active window full screen or maximized, use press_hotkey:
- Fullscreen: press_hotkey({ keys: ["F11"] }) (works in Firefox, Terminal, Document Viewer, etc.)
- Maximize window: press_hotkey({ keys: ["Alt_L", "F10"] }) (XFCE toggle maximize shortcut)

For any task requiring more than 2 distinct actions: first output a short numbered plan, then execute one step at a time, verifying each with a screenshot before moving to the next.

If a task involves sending, deleting, submitting, or purchasing anything irreversible, state your intended action and wait for confirmation before executing.

User Prompt:
`;

@Injectable()
export class OpenCodeService implements BytebotAgentService {
  private readonly logger = new Logger(OpenCodeService.name);
  private readonly baseUrl: string;
  private readonly sessions = new Map<string, string>();
  private readonly initializedSessions = new Set<string>();

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly prisma?: PrismaService,
    @Optional() @Inject(forwardRef(() => TasksGateway)) private readonly tasksGateway?: TasksGateway,
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
          const updatedTask = await this.prisma.task.update({
            where: { id: taskId },
            data: {
              result: {
                ...currentResult,
                openCodeSessionId: sessionId,
              },
            },
            include: {
              messages: {
                orderBy: { createdAt: 'asc' },
              },
            },
          });
          if (this.tasksGateway) {
            this.tasksGateway.emitTaskUpdate(taskId, updatedTask);
          }
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

    // Inject initialization preamble for Aria on the user's first prompt ONLY
    const isFirstPrompt = !hasPriorAssistantTurn && !this.initializedSessions.has(sessionId);
    if (isFirstPrompt) {
      this.initializedSessions.add(sessionId);
      const firstTextPart = parts.find((p) => p.type === 'text');
      if (firstTextPart) {
        const userContent = firstTextPart.text.startsWith('[USER]: ')
          ? firstTextPart.text.replace('[USER]: ', '')
          : firstTextPart.text;
        firstTextPart.text = `${ARIA_FIRST_PROMPT_PREAMBLE}${userContent}`;
      } else {
        parts.unshift({
          type: 'text',
          text: ARIA_FIRST_PROMPT_PREAMBLE.trim(),
        });
      }
    }

    // Keep computer-use guidance in OpenCode's system channel so it is not shown as user content.
    const customInstructions = [
      `[CRITICAL COMPUTER-USE DIRECTIVE]:`,
      `1. Desktop & Web Browsing: You operate on the Ubuntu desktop (display :0). Never use external web search tools or answer from memory without browsing. For all web searches and browsing tasks, use the headed browser tools: browser_navigate({ url }), browser_snapshot(), browser_click({ selector }), browser_type({ selector, text, pressEnter, waitNav }), browser_extract_text().`,
      `2. Fundamental Atomic Steps: Always execute in atomic steps: navigate -> snapshot -> inspect element keys ([e1], [e2]) -> click/type -> verify new state. Never guess coordinates or element keys without verification.`,
    ].join('\n');

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

      let streamedReasoning = '';
      let activeReasoningId: string | null = null;
      const sseAbortController = new AbortController();

      // Start listening to OpenCode /event stream to capture reasoning tokens
      const ssePromise = (async () => {
        try {
          const sseRes = await fetch(`${this.baseUrl}/event`, {
            headers: { Accept: 'text/event-stream' },
            signal: sseAbortController.signal,
          });
          if (!sseRes.body) return;
          const reader = sseRes.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            for (const line of chunk.split('\n')) {
              if (line.startsWith('data: ')) {
                try {
                  const ev = JSON.parse(line.slice(6));
                  if (ev.properties?.sessionID === sessionId) {
                    if (ev.type === 'message.part.updated' && ev.properties?.part?.type === 'reasoning') {
                      activeReasoningId = ev.properties.part.id;
                      if (ev.properties.part.text && !streamedReasoning) {
                        streamedReasoning = ev.properties.part.text;
                      }
                    }
                    if (
                      ev.type === 'message.part.delta' &&
                      ev.properties?.partID === activeReasoningId &&
                      typeof ev.properties?.delta === 'string'
                    ) {
                      streamedReasoning += ev.properties.delta;
                    }
                  }
                } catch {}
              }
            }
          }
        } catch {}
      })();

      let response: Response;
      try {
        response = await fetch(`${this.baseUrl}/session/${sessionId}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parts,
            system: `${systemPrompt}\n\n${customInstructions}`,
            ...(modelPayload ? { model: modelPayload } : {}),
          }),
          signal,
        });
      } finally {
        sseAbortController.abort();
        await ssePromise.catch(() => {});
      }

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
            const thinkingText = part.text || part.reasoning || streamedReasoning;
            if (thinkingText.trim()) {
              contentBlocks.push({
                type: MessageContentType.Thinking,
                thinking: thinkingText,
              } as ThinkingContentBlock);
            }
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

        // If OpenCode emitted streaming reasoning deltas but part.text was blank, ensure it is preserved
        if (
          !contentBlocks.some((b) => b.type === MessageContentType.Thinking) &&
          streamedReasoning.trim()
        ) {
          contentBlocks.unshift({
            type: MessageContentType.Thinking,
            thinking: streamedReasoning,
          } as ThinkingContentBlock);
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
