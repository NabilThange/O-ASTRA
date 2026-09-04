import React, { useState, useRef, useEffect } from "react";
import {
  Brain,
  ChevronDown,
  ChevronRight,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Role } from "@/types";
import { MessageAvatar } from "../MessageAvatar";
import { Loader } from "../../ui/loader";
import { TextShimmer } from "../../ui/text-shimmer";
import { useOpenCodeSSE } from "@/hooks/useOpenCodeSSE";

interface LiveOpenCodeStreamProps {
  sessionId?: string | null;
}

function formatToolName(name: string): string {
  if (!name) return "Tool Action";
  // Strip bytebot_desktop_ or mcp prefix if present
  let clean = name.replace(/^(bytebot_desktop_|mcp_bytebot_desktop_|mcp_)/i, "");
  // Replace underscores with spaces and title-case
  return clean
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function LiveOpenCodeStream({ sessionId }: LiveOpenCodeStreamProps) {
  const { streamedText, streamedReasoning, activeTools, isStreaming } =
    useOpenCodeSSE({ sessionId, enabled: true });

  const [isReasoningOpen, setIsReasoningOpen] = useState(true);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const reasoningEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll reasoning as new tokens stream in
  useEffect(() => {
    if (streamedReasoning && isReasoningOpen) {
      reasoningEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamedReasoning, isReasoningOpen]);

  const toggleToolExpanded = (id: string) => {
    setExpandedTools((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const hasActivity =
    isStreaming ||
    Boolean(streamedReasoning.trim()) ||
    Boolean(streamedText.trim()) ||
    activeTools.length > 0;

  return (
    <div className="bg-bytebot-bronze-light-3 border-bytebot-bronze-light-7 border-x px-4 py-3 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          <MessageAvatar role={Role.ASSISTANT} />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          {/* Header indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center">
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin text-bytebot-bronze-dark-7" />
              ) : (
                <Loader size={18} />
              )}
            </div>
            <TextShimmer className="text-sm font-medium text-bytebot-bronze-dark-8" duration={2}>
              {isStreaming
                ? activeTools.some((t) => t.state === "running")
                  ? "Bytebot is executing desktop actions..."
                  : streamedReasoning && !streamedText
                    ? "Bytebot is thinking..."
                    : "Bytebot is responding..."
                : "Bytebot is working..."}
            </TextShimmer>
          </div>

          {/* Active Tools Live Badges */}
          {activeTools.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-bytebot-bronze-dark-7">
                <Wrench className="h-3.5 w-3.5" />
                <span>Active Tools & Operations</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {activeTools.map((tool) => {
                  const isExpanded = !!expandedTools[tool.id];
                  const hasDetails =
                    (tool.args && Object.keys(tool.args).length > 0) ||
                    Boolean(tool.output) ||
                    Boolean(tool.error);

                  return (
                    <div
                      key={tool.id}
                      className="border-bytebot-bronze-light-6 bg-bytebot-bronze-light-2/70 overflow-hidden rounded-md border text-xs"
                    >
                      <div
                        onClick={() => hasDetails && toggleToolExpanded(tool.id)}
                        className={`flex items-center justify-between px-2.5 py-1.5 ${
                          hasDetails ? "cursor-pointer hover:bg-bytebot-bronze-light-4/50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {tool.state === "running" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                          ) : tool.state === "completed" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                          )}
                          <span className="font-semibold text-bytebot-bronze-dark-9">
                            {formatToolName(tool.name)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                              tool.state === "running"
                                ? "bg-amber-100 text-amber-800"
                                : tool.state === "completed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {tool.state}
                          </span>
                          {hasDetails &&
                            (isExpanded ? (
                              <ChevronDown className="h-3 w-3 text-bytebot-bronze-dark-6" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-bytebot-bronze-dark-6" />
                            ))}
                        </div>
                      </div>

                      {isExpanded && hasDetails && (
                        <div className="border-bytebot-bronze-light-6 bg-bytebot-bronze-light-1/40 space-y-1 border-t px-2.5 py-1.5 font-mono text-[11px] text-bytebot-bronze-dark-7">
                          {tool.args && Object.keys(tool.args).length > 0 && (
                            <div>
                              <span className="text-[10px] font-semibold uppercase text-bytebot-bronze-dark-5">
                                Input:
                              </span>
                              <pre className="overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(tool.args, null, 2)}
                              </pre>
                            </div>
                          )}
                          {tool.error && (
                            <div className="text-rose-600">
                              <span className="text-[10px] font-semibold uppercase">Error:</span>
                              <p>{tool.error}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Reasoning Process Accordion */}
          {Boolean(streamedReasoning.trim()) && (
            <div className="border-bytebot-bronze-light-6 bg-bytebot-bronze-light-2/50 overflow-hidden rounded-lg border">
              <button
                type="button"
                onClick={() => setIsReasoningOpen(!isReasoningOpen)}
                className="hover:bg-bytebot-bronze-light-4/50 flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-bytebot-bronze-dark-7 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Brain className="text-bytebot-bronze-dark-6 h-3.5 w-3.5" />
                  <span>Reasoning / Thought Process</span>
                  {isStreaming && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  )}
                </div>
                {isReasoningOpen ? (
                  <ChevronDown className="text-bytebot-bronze-dark-6 h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="text-bytebot-bronze-dark-6 h-3.5 w-3.5" />
                )}
              </button>

              {isReasoningOpen && (
                <div className="border-bytebot-bronze-light-6 bg-bytebot-bronze-light-1/40 max-h-56 overflow-y-auto border-t px-3 py-2 font-mono text-xs leading-relaxed text-bytebot-bronze-dark-7 whitespace-pre-wrap">
                  {streamedReasoning}
                  <div ref={reasoningEndRef} />
                </div>
              )}
            </div>
          )}

          {/* Live Streamed Text Content */}
          {Boolean(streamedText.trim()) && (
            <div className="border-bytebot-bronze-light-6 bg-bytebot-bronze-light-2/30 rounded-lg border p-3">
              <div className="prose prose-sm text-bytebot-bronze-dark-8 max-w-none text-sm">
                <ReactMarkdown>{streamedText}</ReactMarkdown>
                {isStreaming && (
                  <span className="inline-block h-4 w-1.5 animate-pulse bg-bytebot-bronze-dark-7 align-middle ml-0.5" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
