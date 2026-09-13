import { useState, useEffect, useCallback } from "react";
import { logger } from "@/lib/logger";

interface OperatorState {
  isManualControl: boolean;
  operatorActive: boolean;
  currentStep: number;
  totalSteps: number;
  lastAction: any | null;
  pendingActions: any[];
}

interface UseControlCenterReturn {
  isManualControl: boolean;
  operatorActive: boolean;
  operatorState: OperatorState | null;
  stopAgent: () => Promise<void>;
  resumeAgent: () => Promise<void>;
  executeTool: (toolName: string, parameters: Record<string, any>, agentName: string) => Promise<any>;
  isExecuting: boolean;
  lastResult: any | null;
  isLoading: boolean;
  error: string | null;
}

export function useControlCenter(taskId: string): UseControlCenterReturn {
  const [operatorState, setOperatorState] = useState<OperatorState | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch operator state
  const fetchOperatorState = useCallback(async () => {
    try {
      const response = await fetch(`/api/proxy/control/tasks/${taskId}/operator-state`);
      if (response.ok) {
        const data = await response.json();
        setOperatorState(data);
      }
    } catch (err) {
      logger.error(
        { event: "control.fetch_state_error", taskId, error: err },
        "Failed to fetch operator state"
      );
    }
  }, [taskId]);

  // Poll operator state every 5 seconds
  useEffect(() => {
    fetchOperatorState();
    const interval = setInterval(fetchOperatorState, 5000);
    return () => clearInterval(interval);
  }, [fetchOperatorState]);

  // Stop agent
  const stopAgent = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      logger.info({ event: "control.stop_agent", taskId }, "Stopping agent");

      const response = await fetch(`/api/proxy/control/tasks/${taskId}/stop-agent`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to stop agent");
      }

      await fetchOperatorState();
      logger.info({ event: "control.stop_agent_success", taskId }, "Agent stopped successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      logger.error(
        { event: "control.stop_agent_error", taskId, error: errorMessage },
        "Failed to stop agent"
      );
    } finally {
      setIsLoading(false);
    }
  }, [taskId, fetchOperatorState]);

  // Resume agent
  const resumeAgent = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      logger.info({ event: "control.resume_agent", taskId }, "Resuming agent");

      const response = await fetch(`/api/proxy/control/tasks/${taskId}/resume-agent`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to resume agent");
      }

      await fetchOperatorState();
      logger.info({ event: "control.resume_agent_success", taskId }, "Agent resumed successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      logger.error(
        { event: "control.resume_agent_error", taskId, error: errorMessage },
        "Failed to resume agent"
      );
    } finally {
      setIsLoading(false);
    }
  }, [taskId, fetchOperatorState]);

  // Execute tool
  const executeTool = useCallback(
    async (toolName: string, parameters: Record<string, any>, agentName: string) => {
      setIsExecuting(true);
      setError(null);
      setLastResult(null);

      try {
        logger.info(
          { event: "control.execute_tool", taskId, toolName, agentName },
          "Executing tool"
        );

        const response = await fetch(`/api/proxy/control/tasks/${taskId}/execute-tool`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            toolName,
            parameters,
            agentName,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Tool execution failed");
        }

        const result = await response.json();
        setLastResult(result);

        logger.info(
          { event: "control.execute_tool_success", taskId, toolName },
          "Tool executed successfully"
        );

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        logger.error(
          { event: "control.execute_tool_error", taskId, toolName, error: errorMessage },
          "Tool execution failed"
        );
        throw err;
      } finally {
        setIsExecuting(false);
      }
    },
    [taskId]
  );

  return {
    isManualControl: operatorState?.isManualControl || false,
    operatorActive: operatorState?.operatorActive || false,
    operatorState,
    stopAgent,
    resumeAgent,
    executeTool,
    isExecuting,
    lastResult,
    isLoading,
    error,
  };
}
