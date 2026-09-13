import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface AgentHandoffNotificationProps {
  activeAgent: string | null;
  status: string;
  previousAgent?: string | null;
}

const AGENT_COLORS: Record<string, string> = {
  CLARIFIER: 'bg-bytebot-bronze-light-9',
  ORCHESTRATOR: 'bg-bytebot-bronze-light-9',
  WEB: 'bg-bytebot-bronze-light-9',
  DESKTOP: 'bg-bytebot-bronze-light-9',
  PERCEPTION: 'bg-bytebot-bronze-light-9',
  VERIFIER: 'bg-bytebot-bronze-light-9',
  RECOVERY: 'bg-bytebot-bronze-light-9',
  REPORTER: 'bg-bytebot-bronze-light-9',
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

const STATUS_MESSAGES: Record<string, string> = {
  clarifying: 'Analyzing your request...',
  planning: 'Creating execution plan...',
  executing: 'Executing action...',
  verifying: 'Verifying result...',
  recovering: 'Generating recovery strategy...',
  replanning: 'Adjusting plan...',
  reporting: 'Generating summary...',
  completed: 'Task completed!',
  failed: 'Task failed',
  needs_help: 'Needs your help',
};

export const AgentHandoffNotification: React.FC<AgentHandoffNotificationProps> = ({
  activeAgent,
  status,
  previousAgent,
}) => {
  const [show, setShow] = useState(false);
  const [notification, setNotification] = useState<{
    agent: string;
    message: string;
    isHandoff: boolean;
  } | null>(null);

  useEffect(() => {
    if (!activeAgent) return;

    const isHandoff = previousAgent && previousAgent !== activeAgent;
    const agentLabel = AGENT_LABELS[activeAgent] || activeAgent;
    const statusMessage = STATUS_MESSAGES[status] || status;

    const message = isHandoff
      ? `Handing off to ${agentLabel}`
      : statusMessage;

    setNotification({
      agent: activeAgent,
      message,
      isHandoff: !!isHandoff,
    });
    setShow(true);

    // Auto-hide after 3 seconds
    const timer = setTimeout(() => {
      setShow(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [activeAgent, status, previousAgent]);

  if (!notification) return null;

  const colorClass = AGENT_COLORS[notification.agent] || 'bg-bytebot-bronze-light-9';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <div className="bg-bytebot-red-light-1 border-bytebot-bronze-light-7 rounded-lg border shadow-md">
            <div className="flex items-center gap-3 p-3">
              <div className={`h-2 w-2 rounded-full ${colorClass}`} />
              <div className="flex-1">
                <div className="text-sm font-medium text-bytebot-bronze-light-12">
                  {AGENT_LABELS[notification.agent] || notification.agent}
                </div>
                <div className="text-xs text-bytebot-bronze-light-12">
                  {notification.message}
                </div>
              </div>
              {notification.isHandoff && (
                <div className="text-xs font-semibold text-bytebot-bronze-light-12">
                  →
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
