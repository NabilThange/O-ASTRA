import React, { useState } from "react";
import { Brain, ChevronDown, ChevronRight } from "lucide-react";
import { ThinkingContentBlock } from "@bytebot/shared";

interface ThinkingContentProps {
  block: ThinkingContentBlock;
}

export function ThinkingContent({ block }: ThinkingContentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const thinkingText = block.thinking || "";

  if (!thinkingText.trim()) {
    return null;
  }

  return (
    <div className="mb-3 rounded-lg border border-bytebot-bronze-light-7 bg-bytebot-bronze-light-2/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-bytebot-bronze-dark-7 hover:bg-bytebot-bronze-light-4/50 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-bytebot-bronze-dark-6" />
          <span>Reasoning / Thought Process</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-bytebot-bronze-dark-6" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-bytebot-bronze-dark-6" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-bytebot-bronze-light-6 px-3 py-2 text-xs text-bytebot-bronze-dark-7 bg-bytebot-bronze-light-1/40 whitespace-pre-wrap font-mono leading-relaxed">
          {thinkingText}
        </div>
      )}
    </div>
  );
}
