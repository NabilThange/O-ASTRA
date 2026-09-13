import React from 'react';
import { Loader } from '@/components/ui/loader';

interface AgentStatusBadgeProps {
  activeAgent: string | null;
  status: string;
}

const AGENT_COLORS: Record<string, string> = {
  CLARIFIER: 'bg-bytebot-bronze-light-9/10 text-bytebot-bronze-light-11 border-bytebot-bronze-light-7',
  ORCHESTRATOR: 'bg-bytebot-bronze-light-9/10 text-bytebot-bronze-light-11 border-bytebot-bronze-light-7',
  WEB: 'bg-bytebot-bronze-light-9/10 text-bytebot-bronze-light-11 border-bytebot-bronze-light-7',
  DESKTOP: 'bg-bytebot-bronze-light-9/10 text-bytebot-bronze-light-11 border-bytebot-bronze-light-7',
  PERCEPTION: 'bg-bytebot-bronze-light-9/10 text-bytebot-bronze-light-11 border-bytebot-bronze-light-7',
  VERIFIER: 'bg-bytebot-bronze-light-9/10 text-bytebot-bronze-light-11 border-bytebot-bronze-light-7',
  RECOVERY: 'bg-bytebot-bronze-light-9/10 text-bytebot-bronze-light-11 border-bytebot-bronze-light-7',
  REPORTER: 'bg-bytebot-bronze-light-9/10 text-bytebot-bronze-light-11 border-bytebot-bronze-light-7',
};

const AGENT_LABELS: Record<string, string> = {
  CLARIFIER: 'Clarifying',
  ORCHESTRATOR: 'Planning',
  WEB: 'Web Action',
  DESKTOP: 'Desktop Action',
  PERCEPTION: 'Analyzing Screen',
  VERIFIER: 'Verifying',
  RECOVERY: 'Recovering',
  REPORTER: 'Reporting',
};

export const AgentStatusBadge: React.FC<AgentStatusBadgeProps> = ({
  activeAgent,
}) => {
  if (!activeAgent) {
    return null;
  }

  const colorClass = AGENT_COLORS[activeAgent] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  const label = AGENT_LABELS[activeAgent] || activeAgent;

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${colorClass}`}>
      <Loader size={12} />
      <span>{label}</span>
    </div>
  );
};
