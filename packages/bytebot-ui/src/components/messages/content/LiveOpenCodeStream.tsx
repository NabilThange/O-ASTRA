import React, { useRef, useEffect } from "react";
import {
  Wrench,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Role } from "@/types";
import { MessageAvatar } from "../MessageAvatar";
import { Loader } from "../../ui/loader";
import { TextShimmer } from "../../ui/text-shimmer";
import { useOpenCodeSSE } from "@/hooks/useOpenCodeSSE";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements";

interface LiveOpenCodeStreamProps {
  sessionId?: string | null;
}

function formatToolName(name: string): string {
  if (!name) return "Tool Action";
  // Strip bytebot_desktop_ or mcp prefix if present
  const clean = name.replace(/^(bytebot_desktop_|mcp_bytebot_desktop_|mcp_)/i, "");
  // Replace underscores with spaces and title-case
  return clean
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function mapToolState(state: "pending" | "running" | "completed" | "error") {
  switch (state) {
    case "running":
      return "input-available";
    case "completed":
      return "output-available";
    case "error":
      return "output-error";
    case "pending":
    default:
      return "input-streaming";
  }
}

export function LiveOpenCodeStream({ sessionId }: LiveOpenCodeStreamProps) {
  const { streamedText, streamedReasoning, activeTools, isStreaming } =
    useOpenCodeSSE({ sessionId, enabled: true });

  const reasoningEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll reasoning as new tokens stream in
  useEffect(() => {
    if (streamedReasoning) {
      reasoningEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamedReasoning]);

  const hasActivity =
    isStreaming ||
    Boolean(streamedReasoning.trim()) ||
    Boolean(streamedText.trim()) ||
    activeTools.length > 0;

  if (!hasActivity) {
    return null;
  }

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
                  ? "Aria is executing desktop actions..."
                  : streamedReasoning && !streamedText
                    ? "Aria is thinking..."
                    : "Aria is responding..."
                : "Aria is working..."}
            </TextShimmer>
          </div>

          {/* Reasoning Element */}
          {Boolean(streamedReasoning.trim()) && (
            <Reasoning isStreaming={isStreaming} defaultOpen={true}>
              <ReasoningTrigger />
              <ReasoningContent>
                {streamedReasoning}
              </ReasoningContent>
            </Reasoning>
          )}

          {/* Active Tools Live Elements */}
          {activeTools.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-bytebot-bronze-dark-7">
                <Wrench className="h-3.5 w-3.5" />
                <span>Tool Operations</span>
              </div>
              <div className="flex flex-col gap-2">
                {activeTools.map((tool) => (
                  <Tool
                    key={tool.id}
                    defaultOpen={tool.state === "running" || tool.state === "error"}
                    className="border-bytebot-bronze-light-6 bg-bytebot-bronze-light-2/70 text-xs"
                  >
                    <ToolHeader
                      type="dynamic-tool"
                      toolName={tool.name}
                      title={formatToolName(tool.name)}
                      state={mapToolState(tool.state)}
                    />
                    <ToolContent>
                      {tool.args && Object.keys(tool.args).length > 0 && (
                        <ToolInput input={tool.args} />
                      )}
                      {(tool.output || tool.error) && (
                        <ToolOutput
                          output={tool.output}
                          errorText={tool.error}
                        />
                      )}
                    </ToolContent>
                  </Tool>
                ))}
              </div>
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
