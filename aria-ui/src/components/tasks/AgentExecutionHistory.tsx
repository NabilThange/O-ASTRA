import React from 'react';
import { AgentExecution } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface AgentExecutionHistoryProps {
  agentExecutions?: AgentExecution[];
}

const AGENT_COLORS: Record<string, string> = {
  CLARIFIER: 'bg-blue-500',
  ORCHESTRATOR: 'bg-purple-500',
  WEB: 'bg-green-500',
  DESKTOP: 'bg-orange-500',
  PERCEPTION: 'bg-cyan-500',
  VERIFIER: 'bg-yellow-500',
  RECOVERY: 'bg-red-500',
  REPORTER: 'bg-indigo-500',
};

const AGENT_LABELS: Record<string, string> = {
  CLARIFIER: 'Clarifier',
  ORCHESTRATOR: 'Orchestrator',
  WEB: 'Web Agent',
  DESKTOP: 'Desktop Agent',
  PERCEPTION: 'Perception',
  VERIFIER: 'Verifier',
  RECOVERY: 'Recovery',
  REPORTER: 'Reporter',
};

export const AgentExecutionHistory: React.FC<AgentExecutionHistoryProps> = ({
  agentExecutions = [],
}) => {
  if (!agentExecutions || agentExecutions.length === 0) {
    return (
      <div className="rounded-lg border border-bytebot-bronze-light-7 bg-bytebot-bronze-light-2 p-4">
        <h3 className="mb-2 text-sm font-semibold text-bytebot-bronze-dark-7">
          Agent Execution History
        </h3>
        <p className="text-xs text-bytebot-bronze-light-10">
          No agent executions yet
        </p>
      </div>
    );
  }

  // Sort by start time (most recent first)
  const sortedExecutions = [...agentExecutions].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    }
    if (durationMs < 60000) {
      return `${(durationMs / 1000).toFixed(1)}s`;
    }
    return `${(durationMs / 60000).toFixed(1)}m`;
  };

  return (
    <div className="rounded-lg border border-bytebot-bronze-light-7 bg-bytebot-bronze-light-2 p-4">
      <h3 className="mb-3 text-sm font-semibold text-bytebot-bronze-dark-7">
        Agent Execution History
      </h3>
      
      <div className="space-y-2">
        {sortedExecutions.map((execution, index) => {
          const colorClass = AGENT_COLORS[execution.agentName] || 'bg-gray-500';
          const label = AGENT_LABELS[execution.agentName] || execution.agentName;
          const isSuccess = execution.result === 'success';
          const duration = formatDuration(execution.startTime, execution.endTime);
          const timeAgo = formatDistanceToNow(new Date(execution.startTime), { addSuffix: true });

          return (
            <div
              key={`${execution.agentName}-${execution.startTime}-${index}`}
              className="rounded border border-bytebot-bronze-light-7 bg-bytebot-bronze-light-1 p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${colorClass}`} />
                  <span className="text-sm font-medium text-bytebot-bronze-dark-7">
                    {label}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      isSuccess
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isSuccess ? '✓ Success' : '✗ Failed'}
                  </span>
                </div>
                <span className="text-xs text-bytebot-bronze-light-10">
                  {timeAgo}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-4 text-xs text-bytebot-bronze-light-10">
                <div className="flex items-center gap-1">
                  <span>Duration:</span>
                  <span className="font-medium text-bytebot-bronze-dark-7">
                    {duration}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Tokens:</span>
                  <span className="font-medium text-bytebot-bronze-dark-7">
                    {execution.tokensUsed.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Cost:</span>
                  <span className="font-medium text-bytebot-bronze-dark-7">
                    ${execution.cost.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 border-t border-bytebot-bronze-light-7 pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-bytebot-bronze-light-10">
            Total Executions: {agentExecutions.length}
          </span>
          <span className="text-bytebot-bronze-light-10">
            Success Rate:{' '}
            <span className="font-medium text-bytebot-bronze-dark-7">
              {(
                (agentExecutions.filter((e) => e.result === 'success').length /
                  agentExecutions.length) *
                100
              ).toFixed(0)}
              %
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
