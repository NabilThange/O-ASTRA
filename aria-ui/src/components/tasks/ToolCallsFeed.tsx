import React from "react";
import { ToolCallContent } from "../messages/content/ToolCallContent";

interface ToolCallsFeedProps {
  toolCalls: Map<string, any>;
}

export function ToolCallsFeed({ toolCalls }: ToolCallsFeedProps) {
  const toolCallsArray = Array.from(toolCalls.values()).reverse(); // Show newest first

  if (toolCallsArray.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {toolCallsArray.map((toolCall, index) => (
        <ToolCallContent
          key={`${toolCall.agentName}-${toolCall.toolName}-${toolCall.timestamp}-${index}`}
          agentName={toolCall.agentName}
          toolName={toolCall.toolName}
          toolInput={toolCall.toolInput}
          success={toolCall.success}
          output={toolCall.output}
          error={toolCall.error}
          duration={toolCall.duration}
        />
      ))}
    </div>
  );
}
