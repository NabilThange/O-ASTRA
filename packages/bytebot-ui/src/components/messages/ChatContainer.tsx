import React, { useRef, useEffect, useCallback, useState, Fragment } from "react";
import { Role, TaskStatus, GroupedMessages } from "@/types";
import { MessageGroup } from "./MessageGroup";
import { Loader } from "../ui/loader";
import { ChatInput } from "./ChatInput";
import { LiveOpenCodeStream } from "./content/LiveOpenCodeStream";
import { ArrowDown } from "lucide-react";

interface ChatContainerProps {
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  messageIdToIndex: Record<string, number>;
  taskId: string;
  openCodeSessionId?: string | null;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  handleAddMessage: () => Promise<void>;
  groupedMessages: GroupedMessages[];
  taskStatus: TaskStatus;
  control: Role;
  isLoadingSession: boolean;
  isLoadingMoreMessages: boolean;
  hasMoreMessages: boolean;
  loadMoreMessages: () => Promise<void>;
}

export function ChatContainer({
  scrollRef,
  messageIdToIndex,
  openCodeSessionId,
  input,
  setInput,
  isLoading,
  handleAddMessage,
  groupedMessages,
  taskStatus,
  control,
  isLoadingSession,
  isLoadingMoreMessages,
  hasMoreMessages,
  loadMoreMessages,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewActivity, setHasNewActivity] = useState(false);
  const isAtBottomRef = useRef(true);
  const userScrolledUpRef = useRef(false);

  // Infinite scroll & sticky bottom handler
  const handleScroll = useCallback(() => {
    if (!scrollRef?.current) {
      return;
    }

    const container = scrollRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    const atBottom = distanceFromBottom <= 45;
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);

    if (taskStatus === TaskStatus.RUNNING) {
      userScrolledUpRef.current = !atBottom;
    }

    if (atBottom) {
      setHasNewActivity(false);
    }

    if (distanceFromBottom <= 20 && hasMoreMessages && !isLoadingMoreMessages && loadMoreMessages) {
      loadMoreMessages();
    }
  }, [scrollRef, loadMoreMessages, hasMoreMessages, isLoadingMoreMessages]);

  // Add scroll event listener
  useEffect(() => {
    const container = scrollRef?.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll, scrollRef]);

  // Function to scroll to the bottom of the messages
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setHasNewActivity(false);
    setIsAtBottom(true);
    isAtBottomRef.current = true;
  }, []);

  // When grouped messages update, auto-scroll if user is at bottom, else show badge
  useEffect(() => {
    if (
      taskStatus === TaskStatus.RUNNING ||
      taskStatus === TaskStatus.NEEDS_HELP
    ) {
      if (isAtBottomRef.current && !userScrolledUpRef.current) {
        scrollToBottom("auto");
      } else {
        setHasNewActivity(true);
      }
    }
  }, [taskStatus, groupedMessages, scrollToBottom]);

  // Tool cards can change height after the message list renders. Keep an active
  // run pinned unless the user explicitly scrolled away from the bottom.
  useEffect(() => {
    const container = scrollRef?.current;
    if (!container || taskStatus !== TaskStatus.RUNNING) return;
    const observer = new ResizeObserver(() => {
      if (!userScrolledUpRef.current) scrollToBottom("auto");
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [scrollRef, scrollToBottom, taskStatus]);

  return (
    <div className="relative bg-bytebot-bronze-light-3 flex h-full flex-col">
      {hasNewActivity && !isAtBottom && (
        <button
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full bg-neutral-900 text-white px-3 py-1.5 text-xs font-medium shadow-xl hover:bg-neutral-800 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2"
        >
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          <span>Latest activity</span>
        </button>
      )}
      {isLoadingSession ? (
        <div className="bg-bytebot-bronze-light-3 border-bytebot-bronze-light-7 flex h-full min-h-80 items-center justify-center overflow-hidden rounded-lg border">
          <Loader size={32} />
        </div>
      ) : groupedMessages.length > 0 ? (
        <>
          {/* Content area - scrolling handled by parent */}
          <div className="flex-1">
            {groupedMessages.map((group, groupIndex) => (
              <Fragment key={groupIndex}>
                <MessageGroup
                  group={group}
                  messageIdToIndex={messageIdToIndex}
                  taskStatus={taskStatus}
                />
              </Fragment>
            ))}

            {taskStatus === TaskStatus.RUNNING &&
              control === Role.ASSISTANT && (
                <LiveOpenCodeStream sessionId={openCodeSessionId} />
              )}

            {/* Loading indicator for infinite scroll at bottom */}
            {isLoadingMoreMessages && (
              <div className="flex justify-center py-4">
                <Loader size={24} />
              </div>
            )}

            {/* This empty div is the target for scrolling */}
            <div ref={messagesEndRef} />
          </div>

          {/* Fixed chat input at bottom */}
          {[TaskStatus.RUNNING, TaskStatus.NEEDS_HELP, TaskStatus.COMPLETED].includes(taskStatus) && (
            <div className="bg-bytebot-bronze-light-3 z-10 flex-shrink-0">
              <div className="border-bytebot-bronze-light-7 rounded-b-lg border-x border-b p-2">
                <div className="bg-bytebot-bronze-light-2 border-bytebot-bronze-light-7 rounded-lg border p-2">
                  <ChatInput
                    input={input}
                    isLoading={isLoading}
                    onInputChange={setInput}
                    onSend={handleAddMessage}
                    minLines={1}
                    placeholder="Send a message or continue the task..."
                  />
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="">No messages yet...</p>
        </div>
      )}
    </div>
  );
}
