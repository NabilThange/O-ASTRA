import React from "react";
import { Role, TaskStatus } from "@/types";
import { GroupedMessages } from "@/types";
import { AssistantMessage } from "./AssistantMessage";
import { UserMessage } from "./UserMessage";

interface MessageGroupProps {
  group: GroupedMessages;
  taskStatus: TaskStatus;
  messageIdToIndex: Record<string, number>;
  taskId?: string;
  isAwaitingPlanApproval?: boolean;
}

export function MessageGroup({ group, taskStatus, messageIdToIndex, taskId, isAwaitingPlanApproval }: MessageGroupProps) {
  if (group.role === Role.ASSISTANT) {
    return <AssistantMessage group={group} taskStatus={taskStatus} messageIdToIndex={messageIdToIndex} taskId={taskId} isAwaitingPlanApproval={isAwaitingPlanApproval} />;
  }

  return <UserMessage group={group} messageIdToIndex={messageIdToIndex} />;
}