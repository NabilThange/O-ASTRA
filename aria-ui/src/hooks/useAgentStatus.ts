import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { logger } from '@/lib/logger';

export interface AgentStatus {
  status: string;
  activeAgent: string | null;
  timestamp: string;
}

export function useAgentStatus(taskId: string | null) {
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!taskId) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL!, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      logger.info({ event: 'ws.connected', taskId }, 'WebSocket connected');
      newSocket.emit('join_task', taskId);
    });

    newSocket.on('agent_status', (data: AgentStatus) => {
      logger.debug({ event: 'agent.status_update', taskId, status: data.status, activeAgent: data.activeAgent }, 'Agent status update');
      setAgentStatus(data);
    });

    newSocket.on('disconnect', () => {
      logger.warn({ event: 'ws.disconnected', taskId }, 'WebSocket disconnected');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('leave_task', taskId);
        newSocket.disconnect();
      }
    };
  }, [taskId]);

  return { agentStatus, socket };
}
