import { useState, useEffect, useRef, useCallback } from "react";
import { Message, Role, TaskStatus, Task, GroupedMessages } from "@/types";
import {
  addMessage,
  fetchTaskMessages,
  fetchTaskProcessedMessages,
  fetchTaskById,
  takeOverTask,
  resumeTask,
  cancelTask,
} from "@/utils/taskUtils";
import { MessageContentType } from "@bytebot/shared";
import { useWebSocket } from "./useWebSocket";
import { logger } from "@/lib/logger";

interface UseChatSessionProps {
  initialTaskId?: string;
}

export function useChatSession({ initialTaskId }: UseChatSessionProps = {}) {
  const [taskStatus, setTaskStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [control, setControl] = useState<Role>(Role.ASSISTANT);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groupedMessages, setGroupedMessages] = useState<GroupedMessages[]>([]);
  const [input, setInput] = useState("");
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(
    initialTaskId || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [toolCalls, setToolCalls] = useState<Map<string, any>>(new Map());
  const [agentStatus, setAgentStatus] = useState<{ status: string; activeAgent: string | null } | null>(null);

  const processedMessageIds = useRef<Set<string>>(new Set());

  // WebSocket event handlers
  const handleTaskUpdate = useCallback(
    (task: Task) => {
      if (task.id === currentTaskId) {
        setTaskStatus(task.status);
        setControl(task.control);
      }
    },
    [currentTaskId],
  );

  // Function to reload grouped messages
  const reloadGroupedMessages = useCallback(async () => {
    if (!currentTaskId) return;

    try {
      const processedMessages = await fetchTaskProcessedMessages(
        currentTaskId,
        {
          limit: 1000, // Get more messages for grouped view
          page: 1,
        },
      );
      setGroupedMessages(processedMessages);
    } catch (error) {
      logger.error({ event: 'messages.reload_failed', taskId: currentTaskId }, 'Error reloading grouped messages', error instanceof Error ? error : undefined);
    }
  }, [currentTaskId]);

  const handleNewMessage = useCallback(
    (message: Message) => {
      if (
        !processedMessageIds.current.has(message.id) &&
        message.taskId === currentTaskId
      ) {
        logger.debug({ event: 'ws.message_added', taskId: currentTaskId, messageId: message.id }, 'Adding new message from WebSocket');
        processedMessageIds.current.add(message.id);
        setMessages((prev) => [...prev, message]);
        reloadGroupedMessages();
      }
    },
    [currentTaskId, reloadGroupedMessages],
  );

  const handleTaskCreated = useCallback((task: Task) => {
    logger.info({ event: 'task.created', taskId: task.id }, 'New task created');
  }, []);

  const handleTaskDeleted = useCallback(
    (taskId: string) => {
      if (taskId === currentTaskId) {
        logger.info({ event: 'task.deleted', taskId }, 'Current task was deleted');
        setCurrentTaskId(null);
        setMessages([]);
        processedMessageIds.current = new Set();
      }
    },
    [currentTaskId],
  );

  const handleBrowserLog = useCallback(
    (log: any) => {
      if (log.taskId !== currentTaskId) return;

      logger.debug({ event: 'browser_log.received', type: log.type }, 'Browser log event');

      const importantWorkflowTools = new Set([
        'list_workflows',
        'read_workflow',
        'use_workflow',
      ]);
      const toolName = log.data?.toolName as string | undefined;
      if (toolName && importantWorkflowTools.has(toolName)) {
        return;
      }

      if (log.type === 'tool.call') {
        // Store tool call with pending state
        const toolCallId = `${log.data.agentName}-${log.data.toolName}-${log.timestamp}`;
        setToolCalls((prev) => {
          const updated = new Map(prev);
          updated.set(toolCallId, {
            agentName: log.data.agentName,
            toolName: log.data.toolName,
            toolInput: log.data.toolInput,
            timestamp: log.timestamp,
            pending: true,
          });
          return updated;
        });
      } else if (log.type === 'tool.result') {
        // Update tool call with result
        const toolCallId = Array.from(toolCalls.keys()).find((key) =>
          key.includes(log.data.toolName) && key.includes(log.data.agentName)
        );
        
        if (toolCallId) {
          setToolCalls((prev) => {
            const updated = new Map(prev);
            const existing = updated.get(toolCallId);
            if (existing) {
              updated.set(toolCallId, {
                ...existing,
                success: log.data.success,
                output: log.data.output,
                error: log.data.error,
                duration: log.data.duration,
                pending: false,
              });
            }
            return updated;
          });
        }
      }
    },
    [currentTaskId, toolCalls],
  );

  // Initialize WebSocket connection
  const { joinTask, leaveTask } = useWebSocket({
    onTaskUpdate: handleTaskUpdate,
    onNewMessage: handleNewMessage,
    onTaskCreated: handleTaskCreated,
    onTaskDeleted: handleTaskDeleted,
    onBrowserLog: handleBrowserLog,
    onAgentStatus: (status) => {
      logger.debug({ event: 'agent_status.received', status: status.status, activeAgent: status.activeAgent }, 'Agent status update');
      setAgentStatus(status);
    },
  });

  // Load more messages function for infinite scroll
  const loadMoreMessages = useCallback(async () => {
    if (!currentTaskId || isLoadingMoreMessages || !hasMoreMessages) {
      logger.debug({ event: 'messages.load_more.skipped', taskId: currentTaskId, isLoadingMoreMessages, hasMoreMessages }, 'loadMoreMessages early return');
      return;
    }

    setIsLoadingMoreMessages(true);
    try {
      const nextPage = currentPage + 1;
      const newMessages = await fetchTaskMessages(currentTaskId, {
        limit: 10,
        page: nextPage,
      });

      if (newMessages.length === 0) {
        setHasMoreMessages(false);
      } else {
        // Append new messages to the end of the list (newer messages)
        const formattedMessages = newMessages.map((msg: Message) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          createdAt: msg.createdAt,
        }));

        // Filter out any messages we already have
        const uniqueMessages = formattedMessages.filter(
          (msg) => !processedMessageIds.current.has(msg.id),
        );

        if (uniqueMessages.length > 0) {
          // Add message IDs to processed set
          uniqueMessages.forEach((msg: Message) => {
            processedMessageIds.current.add(msg.id);
          });

          setMessages((prev) => [...prev, ...uniqueMessages]);
          setCurrentPage(nextPage);
        }

        // If we got fewer messages than requested, we've reached the end
        if (newMessages.length < 10) {
          setHasMoreMessages(false);
        }
      }
    } catch (error) {
      logger.error({ event: 'messages.load_more_failed', taskId: currentTaskId }, 'Error loading more messages', error instanceof Error ? error : undefined);
    } finally {
      setIsLoadingMoreMessages(false);
    }
  }, [currentTaskId, currentPage, isLoadingMoreMessages, hasMoreMessages]);

  // Load task ID from URL parameter or fetch the latest task on initial render
  useEffect(() => {
    const loadSession = async () => {
      setIsLoadingSession(true);
      try {
        if (initialTaskId) {
          logger.debug({ event: 'session.loading', taskId: initialTaskId }, `Fetching specific task`);
          const task = await fetchTaskById(initialTaskId);
          // Load raw messages for compatibility and processed messages for chat UI
          const messages = await fetchTaskMessages(initialTaskId, {
            limit: 10,
            page: 1,
          });
          const processedMessages = await fetchTaskProcessedMessages(
            initialTaskId,
            {
              limit: 1000, // Get more messages for grouped view
              page: 1,
            },
          );

          if (task) {
            logger.info({ event: 'session.task_found', taskId: task.id, status: task.status }, `Task loaded`);
            setCurrentTaskId(task.id);
            setTaskStatus(task.status); // Set the task status when loading
            setControl(task.control);

            // Set grouped messages for chat UI
            setGroupedMessages(processedMessages);

            // If the task has messages, add them to the messages state for compatibility
            if (messages && messages.length > 0) {
              // Process all messages
              const formattedMessages = messages.map((msg: Message) => ({
                id: msg.id,
                content: msg.content,
                role: msg.role,
                createdAt: msg.createdAt,
              }));

              // Add message IDs to processed set
              formattedMessages.forEach((msg: Message) => {
                processedMessageIds.current.add(msg.id);
              });

              setMessages(formattedMessages);
              setCurrentPage(1);

              // If we got fewer messages than requested, we've reached the end
              if (messages.length < 10) {
                setHasMoreMessages(false);
              } else {
                setHasMoreMessages(true);
              }
            } else {
              setCurrentPage(1);
              setHasMoreMessages(false);
            }
          } else {
            logger.warn({ event: 'session.task_not_found', taskId: initialTaskId }, `Task not found`);
          }
        }
      } catch (error) {
        logger.error({ event: 'session.load_failed', taskId: initialTaskId }, 'Error loading session', error instanceof Error ? error : undefined);
      } finally {
        setIsLoadingSession(false);
      }
    };

    loadSession();
  }, [initialTaskId]);

  useEffect(() => {
    if (currentTaskId) {
      logger.debug({ event: 'ws.join_task', taskId: currentTaskId }, `Joining WebSocket room`);
      joinTask(currentTaskId);
    } else {
      logger.debug({ event: 'ws.leave_task' }, 'Leaving WebSocket task room');
      leaveTask();
    }
  }, [currentTaskId, joinTask, leaveTask]);

  const handleAddMessage = async () => {
    if (!input.trim()) return;

    setIsLoading(true);

    try {
      const message = input;
      setInput("");

      // Send request to start a new task or continue existing task
      const response = await addMessage(currentTaskId!, message);

      if (!response) {
        // Add error message to chat
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: [
            {
              type: MessageContentType.Text,
              text: "Sorry, there was an error processing your request. Please try again.",
            },
          ],
          role: Role.ASSISTANT,
        };

        processedMessageIds.current.add(errorMessage.id);
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeOverTask = async () => {
    if (!currentTaskId) return;

    try {
      const updatedTask = await takeOverTask(currentTaskId);
      if (updatedTask) {
        setControl(updatedTask.control);
      }
    } catch (error) {
      logger.error({ event: 'task.takeover_failed', taskId: currentTaskId }, 'Error taking over task', error instanceof Error ? error : undefined);
    }
  };

  const handleResumeTask = async () => {
    if (!currentTaskId) return;

    try {
      const updatedTask = await resumeTask(currentTaskId);
      if (updatedTask) {
        setControl(updatedTask.control);
      }
    } catch (error) {
      logger.error({ event: 'task.resume_failed', taskId: currentTaskId }, 'Error resuming task', error instanceof Error ? error : undefined);
    }
  };

  const handleCancelTask = async () => {
    if (!currentTaskId) return;

    try {
      const updatedTask = await cancelTask(currentTaskId);
      if (updatedTask) {
        setTaskStatus(updatedTask.status);
        setControl(updatedTask.control);
      }
    } catch (error) {
      logger.error({ event: 'task.cancel_failed', taskId: currentTaskId }, 'Error cancelling task', error instanceof Error ? error : undefined);
    }
  };

  return {
    messages,
    groupedMessages,
    taskStatus,
    control,
    input,
    setInput,
    currentTaskId,
    isLoading,
    isLoadingSession,
    isLoadingMoreMessages,
    hasMoreMessages,
    toolCalls,
    agentStatus,
    loadMoreMessages,
    handleAddMessage,
    handleTakeOverTask,
    handleResumeTask,
    handleCancelTask,
  };
}
