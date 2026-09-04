import { useEffect, useState, useRef, useCallback } from "react";

export interface OpenCodeToolExecution {
  id: string;
  name: string;
  state: "running" | "completed" | "error";
  args?: Record<string, unknown>;
  output?: unknown;
  error?: string;
}

export interface UseOpenCodeSSEProps {
  sessionId?: string | null;
  enabled?: boolean;
}

export function useOpenCodeSSE({ sessionId, enabled = true }: UseOpenCodeSSEProps = {}) {
  const [streamedText, setStreamedText] = useState("");
  const [streamedReasoning, setStreamedReasoning] = useState("");
  const [activeTools, setActiveTools] = useState<OpenCodeToolExecution[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const clearStream = useCallback(() => {
    setStreamedText("");
    setStreamedReasoning("");
    setActiveTools([]);
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Connect to Backend OpenCode SSE proxy
    const es = new EventSource("/api/opencode/events");
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log("[OpenCode SSE] Connected to live event stream");
    };

    es.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data);
        const eventSessionId = evt.properties?.sessionID;

        // If a specific sessionId is requested, filter out events from other sessions
        if (sessionId && eventSessionId && eventSessionId !== sessionId) {
          return;
        }

        // Live reasoning delta
        if (evt.type === "session.next.reasoning.delta" && evt.properties?.delta) {
          setIsStreaming(true);
          setStreamedReasoning((prev) => prev + evt.properties.delta);
        } else if (evt.type === "session.next.reasoning.started") {
          setIsStreaming(true);
        }

        // Live text delta
        if (evt.type === "session.next.text.delta" && evt.properties?.delta) {
          setIsStreaming(true);
          setStreamedText((prev) => prev + evt.properties.delta);
        } else if (evt.type === "session.next.text.started") {
          setIsStreaming(true);
        }

        // Message part delta (handles delta tokens for text and reasoning)
        if (evt.type === "message.part.delta" && evt.properties?.delta) {
          setIsStreaming(true);
          const delta = evt.properties.delta;
          const field = evt.properties.field;
          if (field === "reasoning") {
            setStreamedReasoning((prev) => prev + delta);
          } else {
            setStreamedText((prev) => prev + delta);
          }
        }

        // Tool execution starts
        if (
          evt.type === "session.next.tool.called" ||
          evt.type === "session.next.tool.input.started"
        ) {
          setIsStreaming(true);
          const callId = evt.properties?.callID || evt.id || `tool-${Date.now()}`;
          const toolName = evt.properties?.tool || evt.properties?.name || "Tool";
          const inputArgs = evt.properties?.input as Record<string, unknown> | undefined;

          setActiveTools((prev) => {
            const existingIdx = prev.findIndex((t) => t.id === callId);
            if (existingIdx >= 0) {
              const updated = [...prev];
              updated[existingIdx] = {
                ...updated[existingIdx],
                name: toolName,
                args: inputArgs ?? updated[existingIdx].args,
                state: "running",
              };
              return updated;
            }
            return [
              ...prev,
              {
                id: callId,
                name: toolName,
                args: inputArgs,
                state: "running",
              },
            ];
          });
        }

        // Tool execution success
        if (evt.type === "session.next.tool.success") {
          const callId = evt.properties?.callID;
          if (callId) {
            setActiveTools((prev) =>
              prev.map((t) =>
                t.id === callId
                  ? {
                      ...t,
                      state: "completed",
                      output: evt.properties?.result ?? evt.properties?.content,
                    }
                  : t,
              ),
            );
          }
        }

        // Tool execution failed
        if (evt.type === "session.next.tool.failed") {
          const callId = evt.properties?.callID;
          if (callId) {
            setActiveTools((prev) =>
              prev.map((t) =>
                t.id === callId
                  ? {
                      ...t,
                      state: "error",
                      error:
                        evt.properties?.error?.message ||
                        String(evt.properties?.error || "Execution failed"),
                    }
                  : t,
              ),
            );
          }
        }

        // Part updated (syncs tools, reasoning, or full text chunks)
        if (evt.type === "message.part.updated" && evt.properties?.part) {
          const part = evt.properties.part;
          if (part.type === "tool" || part.tool) {
            const toolId = part.id || part.callID || `tool-${Date.now()}`;
            const toolName = part.tool || part.name || "Tool";
            const state =
              part.state === "completed"
                ? "completed"
                : part.state === "error"
                  ? "error"
                  : "running";

            setActiveTools((prev) => {
              const existingIdx = prev.findIndex((t) => t.id === toolId);
              if (existingIdx >= 0) {
                const next = [...prev];
                next[existingIdx] = {
                  ...next[existingIdx],
                  name: toolName,
                  state,
                  args: part.args ?? next[existingIdx].args,
                  output: part.output ?? next[existingIdx].output,
                };
                return next;
              }
              return [
                ...prev,
                {
                  id: toolId,
                  name: toolName,
                  state,
                  args: part.args,
                  output: part.output,
                },
              ];
            });
          } else if (part.type === "reasoning" && part.text) {
            setStreamedReasoning(part.text);
          } else if (part.type === "text" && part.text) {
            setStreamedText(part.text);
          }
        }

        // Turn completion
        if (
          evt.type === "session.idle" ||
          (evt.type === "session.status" && evt.properties?.status === "idle")
        ) {
          setIsStreaming(false);
        }
      } catch (err) {
        console.debug("[OpenCode SSE] Parse event error:", err);
      }
    };

    es.onerror = (err) => {
      console.debug("[OpenCode SSE] Stream status update:", err);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [enabled, sessionId]);

  return {
    streamedText,
    streamedReasoning,
    activeTools,
    isStreaming,
    clearStream,
  };
}

