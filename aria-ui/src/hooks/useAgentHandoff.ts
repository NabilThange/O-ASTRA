import { useEffect, useState, useRef } from 'react';
import { useAgentStatus } from './useAgentStatus';

export interface AgentHandoffData {
  currentAgent: string | null;
  previousAgent: string | null;
  status: string;
  isHandoff: boolean;
}

export function useAgentHandoff(taskId: string | null) {
  const { agentStatus } = useAgentStatus(taskId);
  const [handoffData, setHandoffData] = useState<AgentHandoffData>({
    currentAgent: null,
    previousAgent: null,
    status: '',
    isHandoff: false,
  });
  const previousAgentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!agentStatus) return;

    const currentAgent = agentStatus.activeAgent;
    const previousAgent = previousAgentRef.current;
    const isHandoff = previousAgent !== null && previousAgent !== currentAgent && currentAgent !== null;

    setHandoffData({
      currentAgent,
      previousAgent,
      status: agentStatus.status,
      isHandoff,
    });

    // Update the ref for next comparison
    if (currentAgent !== null) {
      previousAgentRef.current = currentAgent;
    }
  }, [agentStatus]);

  return handoffData;
}
