import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Message, Task } from "@/types";
import { logger } from "@/lib/logger";

interface BrowserLogEvent {
  taskId: string;
  type: 'agent.start' | 'agent.response' | 'tool.call' | 'tool.result' | 'agent.complete' | 'agent.error';
  timestamp: string;
  data: any;
}

interface AgentActivityEvent {
  type: 'screenshot' | 'action' | 'reasoning' | 'perception';
  data: any;
  timestamp: string;
}

interface ToolExecutionEvent {
  toolName: string;
  result: any;
  timestamp: string;
}

interface UseWebSocketProps {
  onTaskUpdate?: (task: Task) => void;
  onNewMessage?: (message: Message) => void;
  onTaskCreated?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
  onBrowserLog?: (log: BrowserLogEvent) => void;
  onAgentStatus?: (status: { status: string; activeAgent: string | null; timestamp: string }) => void;
  onAgentActivity?: (activity: AgentActivityEvent) => void;
  onToolExecution?: (tool: ToolExecutionEvent) => void;
  onTaskStatusChanged?: (status: { status: string; activeAgent: string | null }) => void;
}

export function useWebSocket({
  onTaskUpdate,
  onNewMessage,
  onTaskCreated,
  onTaskDeleted,
  onBrowserLog,
  onAgentStatus,
  onAgentActivity,
  onToolExecution,
  onTaskStatusChanged,
}: UseWebSocketProps = {}) {
  const socketRef = useRef<Socket | null>(null);
  const currentTaskIdRef = useRef<string | null>(null);

  // Keep latest handlers in refs — assigned inline each render.
  // This means the socket listeners NEVER need to be re-registered when
  // a parent re-renders (e.g. because the user is typing in an input field).
  const onTaskUpdateRef = useRef(onTaskUpdate);
  const onNewMessageRef = useRef(onNewMessage);
  const onTaskCreatedRef = useRef(onTaskCreated);
  const onTaskDeletedRef = useRef(onTaskDeleted);
  const onBrowserLogRef = useRef(onBrowserLog);
  const onAgentStatusRef = useRef(onAgentStatus);
  const onAgentActivityRef = useRef(onAgentActivity);
  const onToolExecutionRef = useRef(onToolExecution);
  const onTaskStatusChangedRef = useRef(onTaskStatusChanged);
  
  onTaskUpdateRef.current = onTaskUpdate;
  onNewMessageRef.current = onNewMessage;
  onTaskCreatedRef.current = onTaskCreated;
  onTaskDeletedRef.current = onTaskDeleted;
  onBrowserLogRef.current = onBrowserLog;
  onAgentStatusRef.current = onAgentStatus;
  onAgentActivityRef.current = onAgentActivity;
  onToolExecutionRef.current = onToolExecution;
  onTaskStatusChangedRef.current = onTaskStatusChanged;

  // Create the socket exactly ONCE on mount — empty dep array guarantees this.
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      logger.info({ event: "ws.connected" }, "Connected to WebSocket server");
    });

    socket.on("disconnect", () => {
      logger.warn({ event: "ws.disconnected" }, "Disconnected from WebSocket server");
    });

    socket.on("task_updated", (task: Task) => {
      logger.debug({ event: "ws.task_updated", taskId: task.id, status: task.status }, "Task updated");
      onTaskUpdateRef.current?.(task);
    });

    socket.on("new_message", (message: Message) => {
      logger.debug({ event: "ws.new_message", taskId: message.taskId, messageId: message.id }, "New message received");
      onNewMessageRef.current?.(message);
    });

    socket.on("task_created", (task: Task) => {
      logger.info({ event: "ws.task_created", taskId: task.id }, "Task created");
      onTaskCreatedRef.current?.(task);
    });

    socket.on("task_deleted", (taskId: string) => {
      logger.info({ event: "ws.task_deleted", taskId }, "Task deleted");
      onTaskDeletedRef.current?.(taskId);
    });

    socket.on("browser_log", (log: BrowserLogEvent) => {
      logger.debug({ event: "ws.browser_log", type: log.type, taskId: log.taskId }, "Browser log received");
      onBrowserLogRef.current?.(log);
    });

    socket.on("agent_status", (status: { status: string; activeAgent: string | null; timestamp: string }) => {
      logger.debug({ event: "ws.agent_status", status: status.status, activeAgent: status.activeAgent }, "Agent status update");
      onAgentStatusRef.current?.(status);
    });

    socket.on("agent_activity", (activity: AgentActivityEvent) => {
      logger.debug({ event: "ws.agent_activity", type: activity.type }, "Agent activity received");
      onAgentActivityRef.current?.(activity);
    });

    socket.on("tool_execution_result", (tool: ToolExecutionEvent) => {
      logger.debug({ event: "ws.tool_execution", toolName: tool.toolName }, "Tool execution result received");
      onToolExecutionRef.current?.(tool);
    });

    socket.on("task_status_changed", (status: { status: string; activeAgent: string | null }) => {
      logger.debug({ event: "ws.task_status_changed", status: status.status }, "Task status changed");
      onTaskStatusChangedRef.current?.(status);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      currentTaskIdRef.current = null;
    };
  }, []); // ← empty: socket created once, never reconnected due to re-renders

  const joinTask = useCallback((taskId: string, role?: 'JUDGE' | 'OPERATOR') => {
    const socket = socketRef.current;
    if (!socket) return;
    if (currentTaskIdRef.current) {
      socket.emit("leave_task", currentTaskIdRef.current);
    }
    
    // Send role if provided (for control center)
    if (role) {
      socket.emit("join_task", { taskId, role });
      logger.debug({ event: "ws.join_task", taskId, role }, `Joined task room with role`);
    } else {
      socket.emit("join_task", taskId);
      logger.debug({ event: "ws.join_task", taskId }, `Joined task room`);
    }
    
    currentTaskIdRef.current = taskId;
  }, []);

  const leaveTask = useCallback(() => {
    const socket = socketRef.current;
    if (socket && currentTaskIdRef.current) {
      socket.emit("leave_task", currentTaskIdRef.current);
      logger.debug({ event: "ws.leave_task", taskId: currentTaskIdRef.current }, `Left task room`);
      currentTaskIdRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      currentTaskIdRef.current = null;
    }
  }, []);

  return {
    socket: socketRef.current,
    joinTask,
    leaveTask,
    disconnect,
    isConnected: socketRef.current?.connected || false,
  };
}
