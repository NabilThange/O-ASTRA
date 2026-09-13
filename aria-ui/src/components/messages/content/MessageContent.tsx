import React from "react";
import {
  MessageContentBlock,
  isTextContentBlock,
  isImageContentBlock,
  isComputerToolUseContentBlock,
  isToolResultContentBlock,
  isAgentThinkingContentBlock,
  isAgentPlanContentBlock,
  isAgentVerifyContentBlock,
  isAgentRecoveryContentBlock,
  isAgentReportContentBlock,
  isAgentQuestionContentBlock,
} from "@bytebot/shared";
import { TextContent } from "./TextContent";
import { ImageContent } from "./ImageContent";
import { ComputerToolContent } from "./ComputerToolContent";
import { ErrorContent } from "./ErrorContent";
import {
  AgentThinkingContent,
  AgentPlanContent,
  AgentVerifyContent,
  AgentRecoveryContent,
  AgentReportContent,
  AgentQuestionContent,
} from "./AgentActionContent";
import { EditablePlanContent } from "./EditablePlanContent";

interface MessageContentProps {
  content: MessageContentBlock[];
  isTakeOver?: boolean;
  taskId?: string;
  isAwaitingPlanApproval?: boolean;
}

export function MessageContent({
  content,
  isTakeOver = false,
  taskId,
  isAwaitingPlanApproval = false,
}: MessageContentProps) {
  // Filter content blocks and check if any visible content remains
  const visibleBlocks = content.filter((block) => {
    // Always show tool results with images
    if (
      isToolResultContentBlock(block) &&
      block.content &&
      block.content.some((contentBlock) => isImageContentBlock(contentBlock))
    ) {
      return true;
    }
    // Show tool results that are errors
    if (isToolResultContentBlock(block) && block.is_error) {
      return true;
    }
    // Show set_task_status tool results
    if (isToolResultContentBlock(block) && block.tool_use_id === "set_task_status") {
      return true;
    }
    // REMOVED: No longer show list_workflows, read_workflow, use_workflow tool results as text
    // They are already shown in the nice collapsible browser log components
    // Hide all other successful tool results (they're shown in browser_log events)
    if (isToolResultContentBlock(block) && !block.is_error) {
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
          {isTextContentBlock(block) && <TextContent block={block} />}

          {isToolResultContentBlock(block) &&
            !block.is_error &&
            block.content.map((contentBlock, contentBlockIndex) => {
              if (isImageContentBlock(contentBlock)) {
                return (
                  <ImageContent key={contentBlockIndex} block={contentBlock} />
                );
              }
              // REMOVED: No longer show text content for tool results
              // They are already shown in the nice collapsible browser log components
              return null;
            })}

          {isComputerToolUseContentBlock(block) && (
            <ComputerToolContent block={block} isTakeOver={isTakeOver} />
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

          {/* Multi-agent action blocks */}
          {isAgentThinkingContentBlock(block) && (
            <AgentThinkingContent
              agent={block.agent}
              thinking={block.thinking}
            />
          )}

          {isAgentPlanContentBlock(block) && (
            <>
              {isAwaitingPlanApproval && taskId ? (
                <EditablePlanContent
                  agent={block.agent}
                  taskId={taskId}
                  plan={block.plan}
                  onApprovePlan={async (approvedPlan) => {
                    const response = await fetch(`/api/proxy/tasks/${taskId}/approve-plan`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ approvedPlan }),
                    });
                    if (!response.ok) {
                      let errorMessage = "Failed to approve plan.";
                      try {
                        const errorPayload = await response.json();
                        errorMessage = errorPayload?.message || errorPayload?.error || errorMessage;
                      } catch {
                        const errorText = await response.text();
                        errorMessage = errorText || errorMessage;
                      }
                      console.error('Backend returned error:', errorMessage);
                      throw new Error(errorMessage);
                    }
                    // Reload page to show execution
                    window.location.reload();
                  }}
                />
              ) : (
                <AgentPlanContent
                  agent={block.agent}
                  plan={block.plan}
                />
              )}
            </>
          )}

          {isAgentVerifyContentBlock(block) && (
            <AgentVerifyContent
              agent={block.agent}
              verification={block.verification}
            />
          )}

          {isAgentQuestionContentBlock(block) && (
            <AgentQuestionContent
              agent={block.agent}
              question={block.question}
            />
          )}

          {isAgentRecoveryContentBlock(block) && (
            <AgentRecoveryContent
              agent={block.agent}
              strategy={block.strategy}
            />
          )}

          {isAgentReportContentBlock(block) && (
            <AgentReportContent
              agent={block.agent}
              report={block.report}
            />
          )}
        </div>
      ))}
    </div>
  );
}
