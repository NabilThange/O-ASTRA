"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "@/components/layout/Header";
import { ChatContainer } from "@/components/messages/ChatContainer";
import { DesktopContainer } from "@/components/ui/desktop-container";
import { useChatSession } from "@/hooks/useChatSession";
import { useScrollScreenshot } from "@/hooks/useScrollScreenshot";
import { useParams, useRouter } from "next/navigation";
import { Role, TaskStatus } from "@/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreVerticalCircle01Icon,
  WavingHand01Icon,
} from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { VirtualDesktopStatus } from "@/components/VirtualDesktopStatusHeader";
import { MessageSquareText, X } from "lucide-react";
import { useVoiceAgentContext } from "@/providers/VoiceAgentProvider";

export default function TaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const { attachTask, dispatchInstruction } = useVoiceAgentContext();

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showLogsDrawer, setShowLogsDrawer] = useState(true);

  const {
    messages,
    groupedMessages,
    taskStatus,
    control,
    input,
    setInput,
    isLoading,
    isLoadingSession,
    isLoadingMoreMessages,
    hasMoreMessages,
    loadMoreMessages,
    handleTakeOverTask,
    handleResumeTask,
    handleCancelTask,
    currentTaskId,
    openCodeSessionId,
  } = useChatSession({ initialTaskId: taskId });

  useEffect(() => {
    if (currentTaskId) attachTask(currentTaskId, taskStatus, openCodeSessionId);
  }, [attachTask, currentTaskId, openCodeSessionId, taskStatus]);

  const handleSharedAddMessage = useCallback(async () => {
    const message = input.trim();
    if (!message) return;
    setInput("");
    await dispatchInstruction(message);
  }, [dispatchInstruction, input, setInput]);


  // Determine if task is inactive (show screenshot) or active (show VNC)
  function isTaskInactive(): boolean {
    return (
      taskStatus === TaskStatus.COMPLETED ||
      taskStatus === TaskStatus.FAILED ||
      taskStatus === TaskStatus.CANCELLED
    );
  }

  // Determine if user can take control
  function canTakeOver(): boolean {
    return control === Role.ASSISTANT && taskStatus === TaskStatus.RUNNING;
  }

  // Determine if user has control or is in takeover mode
  function hasUserControl(): boolean {
    return (
      control === Role.USER &&
      (taskStatus === TaskStatus.RUNNING ||
        taskStatus === TaskStatus.NEEDS_HELP)
    );
  }

  // Determine if task can be cancelled
  function canCancel(): boolean {
    return (
      taskStatus === TaskStatus.RUNNING || taskStatus === TaskStatus.NEEDS_HELP
    );
  }

  // Determine VNC mode - interactive when user has control, view-only otherwise
  function vncViewOnly(): boolean {
    return !hasUserControl();
  }

  // Use scroll screenshot hook for inactive tasks
  const { currentScreenshot } = useScrollScreenshot({
    messages,
    scrollContainerRef: chatContainerRef,
  });

  // For inactive tasks, auto-load all messages for proper screenshot navigation
  useEffect(() => {
    if (isTaskInactive() && hasMoreMessages && !isLoadingMoreMessages) {
      loadMoreMessages();
    }
  }, [
    isTaskInactive(),
    hasMoreMessages,
    isLoadingMoreMessages,
    loadMoreMessages,
  ]);

  // Map each message ID to its flat index for screenshot scroll logic
  const messageIdToIndex = React.useMemo(() => {
    const map: Record<string, number> = {};
    messages.forEach((msg, idx) => {
      map[msg.id] = idx;
    });
    return map;
  }, [messages]);

  // Redirect if task ID doesn't match current task
  useEffect(() => {
    if (currentTaskId && currentTaskId !== taskId) {
      router.push(`/tasks/${currentTaskId}`);
    }
  }, [currentTaskId, taskId, router]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9F9F8]">
      <Header />

      <main className="relative flex flex-1 flex-col lg:flex-row overflow-hidden p-2 sm:p-4 gap-3">
        {/* Main Desktop Container */}
        <div className="relative flex h-full w-full flex-1 flex-col items-center justify-center overflow-hidden">
          <div className="flex h-full w-full items-center justify-center">
            <DesktopContainer
              screenshot={isTaskInactive() ? currentScreenshot : null}
              viewOnly={vncViewOnly()}
              className="shadow-sm rounded-xl border border-neutral-200"
              status={
                (() => {
                  if (
                    taskStatus === TaskStatus.RUNNING &&
                    control === Role.USER
                  )
                    return "user_control";
                  if (taskStatus === TaskStatus.RUNNING) return "running";
                  if (taskStatus === TaskStatus.NEEDS_HELP)
                    return "needs_attention";
                  if (taskStatus === TaskStatus.FAILED) return "failed";
                  if (taskStatus === TaskStatus.CANCELLED) return "canceled";
                  if (taskStatus === TaskStatus.COMPLETED) return "completed";
                  return "pending";
                })() as VirtualDesktopStatus
              }
            >
              {canTakeOver() && (
                <Button
                  onClick={handleTakeOverTask}
                  variant="default"
                  size="sm"
                  icon={
                    <HugeiconsIcon
                      icon={WavingHand01Icon}
                      className="h-4 w-4"
                    />
                  }
                >
                  Take Over
                </Button>
              )}
              {hasUserControl() && (
                <Button onClick={handleResumeTask} variant="default" size="sm">
                  Proceed
                </Button>
              )}

              {/* Secondary Drawer Toggle for typing or logs */}
              <Button
                onClick={() => setShowLogsDrawer((prev) => !prev)}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-neutral-600"
              >
                <MessageSquareText className="h-3.5 w-3.5" />
                <span>{showLogsDrawer ? "Hide Log" : "Log / Type"}</span>
              </Button>

              {canCancel() && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <HugeiconsIcon
                        icon={MoreVerticalCircle01Icon}
                        className="text-neutral-500 h-4 w-4"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={handleCancelTask}
                      className="text-red-600 focus:bg-red-50"
                    >
                      Cancel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </DesktopContainer>
          </div>

        </div>

        {/* Side-by-side or Slide-out Panel for Detailed Message History & Keyboard Input */}
        {showLogsDrawer && (
          <div className="absolute lg:relative inset-y-0 right-0 z-40 flex w-full lg:w-[480px] xl:w-[520px] 2xl:w-[560px] flex-col border border-neutral-200 bg-white rounded-xl shadow-2xl lg:shadow-sm animate-in slide-in-from-right duration-300 flex-shrink-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <div className="text-sm font-semibold text-neutral-800">
                Task Activity & History
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => setShowLogsDrawer(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div
              ref={chatContainerRef}
              className="hide-scrollbar min-h-0 flex-1 overflow-scroll px-4 py-2"
            >
              <ChatContainer
                scrollRef={chatContainerRef}
                messageIdToIndex={messageIdToIndex}
                taskId={taskId}
                openCodeSessionId={openCodeSessionId}
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                handleAddMessage={handleSharedAddMessage}
                groupedMessages={groupedMessages}
                taskStatus={taskStatus}
                control={control}
                isLoadingSession={isLoadingSession}
                isLoadingMoreMessages={isLoadingMoreMessages}
                hasMoreMessages={hasMoreMessages}
                loadMoreMessages={loadMoreMessages}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
