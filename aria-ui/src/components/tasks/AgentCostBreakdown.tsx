import React from 'react';

interface AgentExecution {
  agentName: string;
  startTime: string;
  endTime: string;
  tokensUsed: number;
  cost: number;
  result: 'success' | 'failure';
}

interface AgentCostBreakdownProps {
  agentExecutions?: AgentExecution[];
  totalCost?: number;
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

export const AgentCostBreakdown: React.FC<AgentCostBreakdownProps> = ({
  agentExecutions = [],
  totalCost = 0,
}) => {
  if (!agentExecutions || agentExecutions.length === 0) {
    return null;
  }

  // Aggregate costs by agent
  const agentCostMap = agentExecutions.reduce((acc, execution) => {
    const agentName = execution.agentName;
    if (!acc[agentName]) {
      acc[agentName] = {
        cost: 0,
        calls: 0,
        tokens: 0,
      };
    }
    acc[agentName].cost += execution.cost;
    acc[agentName].calls += 1;
    acc[agentName].tokens += execution.tokensUsed;
    return acc;
  }, {} as Record<string, { cost: number; calls: number; tokens: number }>);

  const agentBreakdown = Object.entries(agentCostMap)
    .map(([agentName, data]) => ({
      agentName,
      ...data,
      percentage: totalCost > 0 ? (data.cost / totalCost) * 100 : 0,
    }))
    .sort((a, b) => b.cost - a.cost);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-bytebot-bronze-dark-7">
          Agent Cost Breakdown
        </span>
        <span className="text-sm font-semibold text-bytebot-bronze-dark-7">
          ${totalCost.toFixed(4)}
        </span>
      </div>

      <div className="space-y-2">
        {agentBreakdown.map(({ agentName, cost, calls, tokens, percentage }) => {
          const colorClass = AGENT_COLORS[agentName] || 'bg-gray-500';
          const label = AGENT_LABELS[agentName] || agentName;

          return (
            <div key={agentName} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${colorClass}`} />
                  <span className="text-bytebot-bronze-dark-7">{label}</span>
                  <span className="text-bytebot-bronze-light-10">
                    ({calls} {calls === 1 ? 'call' : 'calls'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-bytebot-bronze-light-10">
                    {tokens.toLocaleString()} tokens
                  </span>
                  <span className="font-medium text-bytebot-bronze-dark-7">
                    ${cost.toFixed(4)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-bytebot-bronze-light-4">
                <div
                  className={`h-full ${colorClass}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
