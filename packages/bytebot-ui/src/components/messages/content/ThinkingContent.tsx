import React from "react";
import { ThinkingContentBlock } from "@bytebot/shared";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements";

interface ThinkingContentProps {
  block: ThinkingContentBlock;
}

export function ThinkingContent({ block }: ThinkingContentProps) {
  const thinkingText = block.thinking || "";

  if (!thinkingText.trim()) {
    return null;
  }

  return (
    <Reasoning defaultOpen={true}>
      <ReasoningTrigger />
      <ReasoningContent>{thinkingText}</ReasoningContent>
    </Reasoning>
  );
}
