"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuraBot } from "@/components/aura/AuraBot";
import { AuraMascotBubble } from "@/components/aura/AuraMascotBubble";
import { useAssemblyVoiceAgent } from "@/hooks/useAssemblyVoiceAgent";
import { useOpenCodeSSE } from "@/hooks/useOpenCodeSSE";
import { useWebSocket } from "@/hooks/useWebSocket";
import { addMessage, fetchModels, fetchTaskById, startTask } from "@/utils/taskUtils";
import { FileWithBase64, Model, Task, TaskStatus } from "@/types";
import { extractSpokenSummary, transformToolToNarration } from "@/services/narrationTransformer";
import { NarrationBridge } from "@/voice/NarrationBridge";
import { conversationReducer, initialConversationState } from "@/voice/conversationState";
import { AUTO_SUBMIT_FALLBACK_TIMEOUT_MS, FOLLOW_UP_WINDOW_TIMEOUT_MS, PENDING_BUFFER_GRACE_TIMER_MS } from "@/voice/voiceAgentConfig";

type CreationOptions = { model?: Model; files?: FileWithBase64[] };
type VoiceAgentContextValue = {
  activeTaskId: string | null;
  taskStatus: TaskStatus | null;
  conversation: typeof initialConversationState;
  dispatchInstruction: (text: string, options?: CreationOptions) => Promise<void>;
  attachTask: (taskId: string, status: TaskStatus, sessionId?: string | null) => void;
  handleMascotClick: () => void;
  startNewTask: () => void;
  bubbleText: string;
  finalizeBuffer: () => void;
};

const VoiceAgentContext = createContext<VoiceAgentContextValue | null>(null);
const normalize = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");

export function VoiceAgentProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [conversation, setConversation] = useState(initialConversationState);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [defaultModel, setDefaultModel] = useState<Model | null>(null);
  const [bubbleText, setBubbleText] = useState("Click me to speak.");
  const bufferRef = useRef("");
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const followUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dispatchedRef = useRef(new Map<string, number>());
  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;

  useEffect(() => { void fetchModels().then((models) => setDefaultModel(models[0] ?? null)); }, []);

  const applyTask = useCallback((task: Task) => {
    if (task.id !== activeTaskId) return;
    setTaskStatus(task.status);
    const result = task.result as Record<string, unknown> | undefined;
    if (typeof result?.openCodeSessionId === "string") setSessionId(result.openCodeSessionId);
  }, [activeTaskId]);
  const { joinTask } = useWebSocket({ onTaskUpdate: applyTask });

  useEffect(() => {
    if (!activeTaskId) return;
    joinTask(activeTaskId);
    void fetchTaskById(activeTaskId).then((task) => task && applyTask(task));
  }, [activeTaskId, applyTask, joinTask]);

  const { streamedText, activeTools, clearStream } = useOpenCodeSSE({ sessionId, enabled: Boolean(sessionId) });

  const dispatchEvent = useCallback((event: Parameters<typeof conversationReducer>[1]) => {
    setConversation((current) => conversationReducer(current, event));
  }, []);

  const dispatchInstruction = useCallback(async (rawText: string, options?: CreationOptions) => {
    const text = rawText.trim();
    if (!text) return;
    const key = normalize(text);
    const previous = dispatchedRef.current.get(key);
    if (previous && Date.now() - previous < 10000) return;
    dispatchedRef.current.set(key, Date.now());
    clearStream();

    if (!activeTaskId) {
      const model = options?.model ?? defaultModel;
      if (!model) {
        setBubbleText("I couldn't load an agent model. Please try again.");
        return;
      }
      const task = await startTask({ description: text, model, files: options?.files });
      if (!task) return;
      setActiveTaskId(task.id);
      setTaskStatus(task.status);
      setBubbleText("I’m on it.");
      dispatchEvent("COMMAND_DISPATCHED");
      router.push(`/tasks/${task.id}`);
      return;
    }

    if (taskStatus === TaskStatus.COMPLETED || taskStatus === TaskStatus.FAILED) {
      const task = await addMessage(activeTaskId, text);
      if (!task) return;
      setTaskStatus(task.status);
      setBubbleText("Continuing the same task.");
      dispatchEvent("COMMAND_DISPATCHED");
    }
  }, [activeTaskId, clearStream, defaultModel, dispatchEvent, router, taskStatus]);
  const dispatchInstructionRef = useRef(dispatchInstruction);
  dispatchInstructionRef.current = dispatchInstruction;

  const finalizeBuffer = useCallback(() => {
    const text = bufferRef.current.trim();
    bufferRef.current = "";
    if (!text) return;
    setBubbleText(`“${text}”`);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = setTimeout(() => void dispatchInstructionRef.current(text), AUTO_SUBMIT_FALLBACK_TIMEOUT_MS);
  }, []);

  const voice = useAssemblyVoiceAgent({
    onVoiceActivity: () => {
      if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
      if (conversationRef.current.state === "SUMMARY") dispatchEvent("VOICE_ACTIVITY");
    },
    onFinalTranscript: (text) => {
      bufferRef.current = `${bufferRef.current} ${text}`.trim();
      setBubbleText(`“${bufferRef.current}”`);
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
      graceTimerRef.current = setTimeout(finalizeBuffer, PENDING_BUFFER_GRACE_TIMER_MS);
    },
    onToolCall: async (name, args) => {
      if (name !== "create_computer_task") return;
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      await dispatchInstructionRef.current(String(args.description ?? ""));
    },
    onReplyDone: () => {
      narrationBridgeRef.current?.replyDone();
      if (conversationRef.current.state === "SUMMARY") dispatchEvent("SUMMARY_FINISHED");
    },
  });

  const narrationBridgeRef = useRef<NarrationBridge | null>(null);
  if (!narrationBridgeRef.current) narrationBridgeRef.current = new NarrationBridge(voice.narrate);

  useEffect(() => {
    if (!conversation.micEnabled) {
      voice.stopListening();
      return;
    }
    if (voice.state.isGreetingPending) return;
    void (voice.state.isConnected ? voice.startListening() : voice.connect());
  }, [conversation.micEnabled, voice.state.isConnected, voice.state.isGreetingPending, voice.startListening, voice.connect, voice.stopListening]);

  useEffect(() => {
    if (conversation.state !== "FOLLOW_UP") return;
    setBubbleText("Anything else?");
    followUpTimerRef.current = setTimeout(() => dispatchEvent("FOLLOW_UP_TIMEOUT"), FOLLOW_UP_WINDOW_TIMEOUT_MS);
    return () => { if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current); };
  }, [conversation.state, dispatchEvent]);

  const lastMilestoneRef = useRef("");
  useEffect(() => {
    if (conversation.state !== "DISPATCHED") return;
    const tool = activeTools.find((item) => item.state === "running");
    if (!tool) return;
    const narration = transformToolToNarration(tool);
    if (!narration || narration.phrase === lastMilestoneRef.current) return;
    lastMilestoneRef.current = narration.phrase;
    setBubbleText(narration.phrase);
    narrationBridgeRef.current?.narrate({ kind: "milestone", text: narration.phrase });
  }, [activeTools, conversation.state]);

  useEffect(() => {
    if (conversation.state !== "DISPATCHED") return;
    if (taskStatus === TaskStatus.COMPLETED) {
      const summary = extractSpokenSummary(streamedText);
      setBubbleText(summary);
      dispatchEvent("TASK_COMPLETED");
      narrationBridgeRef.current?.narrate({ kind: "summary", text: summary });
    } else if (taskStatus === TaskStatus.FAILED) {
      const message = "The task did not complete successfully";
      setBubbleText(message);
      dispatchEvent("TASK_FAILED");
      narrationBridgeRef.current?.narrate({ kind: "error", text: message });
    }
  }, [conversation.state, dispatchEvent, streamedText, taskStatus]);

  const handleMascotClick = useCallback(() => {
    void voice.primeAudio();
    if (conversationRef.current.state === "LISTENING") return finalizeBuffer();
    if (conversationRef.current.state === "DISPATCHED") return voice.interruptAudio();
    if (conversationRef.current.state === "SUMMARY") return dispatchEvent("MASCOT_CLICKED");
    if (conversationRef.current.state === "IDLE" || conversationRef.current.state === "FOLLOW_UP") dispatchEvent("MASCOT_CLICKED");
  }, [dispatchEvent, finalizeBuffer, voice.interruptAudio, voice.primeAudio]);
  const startNewTask = useCallback(() => { setActiveTaskId(null); setTaskStatus(null); setSessionId(null); dispatchEvent("CANCELLED"); }, [dispatchEvent]);
  const attachTask = useCallback((taskId: string, status: TaskStatus, existingSessionId?: string | null) => {
    setActiveTaskId(taskId);
    setTaskStatus(status);
    if (existingSessionId) setSessionId(existingSessionId);
    if (status === TaskStatus.RUNNING) {
      setConversation({ state: "DISPATCHED", emotion: "30", micEnabled: false });
    }
  }, []);

  const pathname = usePathname();
  const isTaskPage = Boolean(pathname?.startsWith("/tasks/"));

  const value = useMemo(
    () => ({
      activeTaskId,
      taskStatus,
      conversation,
      dispatchInstruction,
      attachTask,
      handleMascotClick,
      startNewTask,
      bubbleText,
      finalizeBuffer,
    }),
    [
      activeTaskId,
      taskStatus,
      conversation,
      dispatchInstruction,
      attachTask,
      handleMascotClick,
      startNewTask,
      bubbleText,
      finalizeBuffer,
    ]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
      event.preventDefault();
      handleMascotClick();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleMascotClick]);

  return (
    <VoiceAgentContext.Provider value={value}>
      {children}
      {isTaskPage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-end gap-3">
          <AuraBot
            size="sm"
            emotion={conversation.emotion}
            onClick={handleMascotClick}
            className="w-24 h-24 drop-shadow-md"
          />
          <AuraMascotBubble
            text={bubbleText}
            isListening={conversation.state === "LISTENING" || conversation.state === "FOLLOW_UP"}
            isThinking={conversation.state === "DISPATCHED"}
            onActionClick={conversation.state === "LISTENING" ? finalizeBuffer : undefined}
            actionText="Done"
            position="right"
          />
        </div>
      )}
    </VoiceAgentContext.Provider>
  );
}

export function useVoiceAgentContext() {
  const context = useContext(VoiceAgentContext);
  if (!context) throw new Error("useVoiceAgentContext must be used inside VoiceAgentProvider");
  return context;
}
