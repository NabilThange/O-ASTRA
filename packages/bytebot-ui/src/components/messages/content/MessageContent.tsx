import React from "react";
import {
  MessageContentBlock,
  isTextContentBlock,
  isImageContentBlock,
  isComputerToolUseContentBlock,
  isToolUseContentBlock,
  isToolResultContentBlock,
  isThinkingContentBlock,
} from "@bytebot/shared";
import { TextContent } from "./TextContent";
import { ImageContent } from "./ImageContent";
import { ComputerToolContent } from "./ComputerToolContent";
import { ErrorContent } from "./ErrorContent";
import { ThinkingContent } from "./ThinkingContent";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
} from "@/components/ai-elements";

interface MessageContentProps {
  content: MessageContentBlock[];
  isTakeOver?: boolean;
}

export function MessageContent({
  content,
  isTakeOver = false,
}: MessageContentProps) {
  // Filter content blocks and check if any visible content remains
  const visibleBlocks = content.filter((block) => {
    // Filter logic from the original code
    if (
      isToolResultContentBlock(block) &&
      block.content &&
      block.content.some((contentBlock) => isImageContentBlock(contentBlock))
    ) {
      return true;
    }
    if (
      isToolResultContentBlock(block) &&
      block.tool_use_id !== "set_task_status" &&
      !block.is_error
    ) {
      return false;
    }
    return true;
  });

  // Skip rendering if no visible content
  if (visibleBlocks.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {visibleBlocks.map((block, index) => (
        <div key={index}>
          {isThinkingContentBlock(block) && <ThinkingContent block={block} />}
          {isTextContentBlock(block) && <TextContent block={block} />}

          {isToolResultContentBlock(block) &&
            !block.is_error &&
            block.content.map((contentBlock, contentBlockIndex) => {
              if (isImageContentBlock(contentBlock)) {
                return (
                  <ImageContent key={contentBlockIndex} block={contentBlock} />
                );
              }
              return null;
            })}

          {isComputerToolUseContentBlock(block) && (
            <ComputerToolContent block={block} isTakeOver={isTakeOver} />
          )}

          {isToolUseContentBlock(block) && !isComputerToolUseContentBlock(block) && (
            <Tool defaultOpen={false} className="border-bytebot-bronze-light-6 bg-bytebot-bronze-light-2/50 text-xs my-2">
              <ToolHeader
                type="dynamic-tool"
                toolName={block.name}
                title={block.name}
                state="output-available"
              />
              <ToolContent>
                {block.input && <ToolInput input={block.input} />}
              </ToolContent>
            </Tool>
          )}

          {isToolResultContentBlock(block) && block.is_error && (
            <ErrorContent block={block} />
          )}

          {isToolResultContentBlock(block) &&
            !block.is_error &&
            block.tool_use_id === "set_task_status" &&
            block.content?.[0].type === "text" && (
              <TextContent block={block.content?.[0]} />
            )}
        </div>
      ))}
    </div>
  );
}
