import { useEffect, useState, useRef } from "react";
import { useOpenCodeSSE } from "./useOpenCodeSSE";
import { TaskStatus } from "@/types";
import {
  transformToolToNarration,
  extractSpokenSummary,
} from "@/services/narrationTransformer";

interface UseMascotSpeechProps {
  openCodeSessionId?: string | null;
  taskStatus?: TaskStatus;
}

export function useMascotSpeech({
  openCodeSessionId,
  taskStatus,
}: UseMascotSpeechProps) {
  const { streamedText, streamedReasoning, activeTools, isStreaming } =
    useOpenCodeSSE({
      sessionId: openCodeSessionId,
      enabled: true,
    });

  const [mascotText, setMascotText] = useState("Standing by...");
  const [mascotEmotion, setMascotEmotion] = useState("03"); // Default Curious
  const lastSpokenMilestoneRef = useRef<string>("");

  useEffect(() => {
    // 1. Terminal / completion states
    if (taskStatus === TaskStatus.COMPLETED) {
      const summary = streamedText
        ? extractSpokenSummary(streamedText)
        : "Task completed successfully!";
      setMascotText(summary);
      setMascotEmotion("10"); // Happy / success
      return;
    }

    if (taskStatus === TaskStatus.FAILED) {
      setMascotText("Task failed or was interrupted.");
      setMascotEmotion("40"); // Error
      return;
    }

    if (taskStatus === TaskStatus.NEEDS_HELP) {
      setMascotText("I need your help with this step.");
      setMascotEmotion("14"); // Skeptical / Alert
      return;
    }

    // 2. Active tools milestone execution via transformer
    const runningTool = activeTools.find((t) => t.state === "running");
    if (runningTool) {
      const narration = transformToolToNarration({
        name: runningTool.name,
        args: runningTool.args as Record<string, unknown> | undefined,
        state: runningTool.state,
      });

      if (narration && narration.phrase !== lastSpokenMilestoneRef.current) {
        lastSpokenMilestoneRef.current = narration.phrase;
        setMascotText(narration.phrase);
        setMascotEmotion(narration.emotion);
      }
      return;
    }

    // 3. Thinking / reasoning phase
    if (isStreaming && streamedReasoning && !streamedText) {
      setMascotEmotion("11"); // Thinking
      setMascotText("Thinking through next steps...");
      return;
    }

    // 4. Responding / drafting
    if (isStreaming && streamedText) {
      setMascotEmotion("13"); // Attentive
      const snippet = streamedText.trim().split("\n")[0];
      setMascotText(snippet.length > 55 ? snippet.slice(0, 52) + "..." : snippet);
      return;
    }

    if (taskStatus === TaskStatus.RUNNING) {
      setMascotEmotion("30");
      setMascotText("Aria is working...");
    }
  }, [taskStatus, activeTools, isStreaming, streamedReasoning, streamedText]);

  return {
    mascotText,
    mascotEmotion,
  };
}
