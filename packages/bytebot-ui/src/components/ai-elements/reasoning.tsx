"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { BrainIcon, ChevronDownIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Shimmer } from "./shimmer";

interface ReasoningContextValue {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  duration: number | undefined;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

export const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error("Reasoning components must be used within Reasoning");
  }
  return context;
};

export type ReasoningProps = ComponentProps<typeof Collapsible> & {
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
};

const MS_IN_S = 1000;

export const Reasoning = memo(
  ({
    className,
    isStreaming = false,
    open: controlledOpen,
    defaultOpen = true,
    onOpenChange,
    duration: explicitDuration,
    children,
    ...props
  }: ReasoningProps) => {
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setIsOpen = useCallback(
      (newOpen: boolean) => {
        if (controlledOpen === undefined) {
          setInternalOpen(newOpen);
        }
        onOpenChange?.(newOpen);
      },
      [controlledOpen, onOpenChange]
    );

    // Track duration while streaming
    const [duration, setDuration] = useState<number | undefined>(explicitDuration);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
      if (explicitDuration !== undefined) {
        setDuration(explicitDuration);
        return;
      }

      if (isStreaming) {
        if (startTimeRef.current === null) {
          startTimeRef.current = Date.now();
        }

        const interval = setInterval(() => {
          if (startTimeRef.current !== null) {
            setDuration(Math.round((Date.now() - startTimeRef.current) / MS_IN_S));
          }
        }, 1000);

        return () => clearInterval(interval);
      }

      if (startTimeRef.current !== null) {
        setDuration(Math.round((Date.now() - startTimeRef.current) / MS_IN_S));
        startTimeRef.current = null;
      }
    }, [isStreaming, explicitDuration]);

    const contextValue = useMemo(
      () => ({
        isStreaming,
        isOpen,
        setIsOpen,
        duration,
      }),
      [isStreaming, isOpen, setIsOpen, duration]
    );

    return (
      <ReasoningContext.Provider value={contextValue}>
        <Collapsible
          className={cn("not-prose my-2 w-full rounded-md border border-border/50 bg-muted/20 p-3", className)}
          open={isOpen}
          onOpenChange={setIsOpen}
          {...props}
        >
          {children}
        </Collapsible>
      </ReasoningContext.Provider>
    );
  }
);

export type ReasoningTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode;
};

const defaultGetThinkingMessage = (
  isStreaming: boolean,
  duration?: number
): ReactNode => {
  if (isStreaming) {
    return (
      <div className="flex items-center gap-2">
        <Shimmer>Thinking...</Shimmer>
        {duration !== undefined && (
          <span className="text-muted-foreground/60 text-xs">({duration}s)</span>
        )}
      </div>
    );
  }

  if (duration !== undefined && duration > 0) {
    return `Thought for ${duration} second${duration === 1 ? "" : "s"}`;
  }

  return "Thought process";
};

export const ReasoningTrigger = memo(
  ({
    className,
    children,
    getThinkingMessage = defaultGetThinkingMessage,
    ...props
  }: ReasoningTriggerProps) => {
    const { isStreaming, isOpen, duration } = useReasoning();

    return (
      <CollapsibleTrigger
        className={cn(
          "flex w-full cursor-pointer items-center justify-between text-muted-foreground text-xs font-medium transition-colors hover:text-foreground",
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            <div className="flex items-center gap-2">
              <BrainIcon className="h-4 w-4 text-amber-600" />
              <span>{getThinkingMessage(isStreaming, duration)}</span>
            </div>
            <ChevronDownIcon
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                isOpen ? "rotate-180" : "rotate-0"
              )}
            />
          </>
        )}
      </CollapsibleTrigger>
    );
  }
);

export type ReasoningContentProps = ComponentProps<typeof CollapsibleContent> & {
  children: string;
};

export const ReasoningContent = memo(
  ({ className, children, ...props }: ReasoningContentProps) => (
    <CollapsibleContent
      className={cn(
        "mt-2 text-xs text-muted-foreground leading-relaxed",
        className
      )}
      {...props}
    >
      <div className="prose prose-xs dark:prose-invert max-w-none whitespace-pre-wrap font-sans border-l-2 border-border/60 pl-3">
        <ReactMarkdown>{children}</ReactMarkdown>
      </div>
    </CollapsibleContent>
  )
);

Reasoning.displayName = "Reasoning";
ReasoningTrigger.displayName = "ReasoningTrigger";
ReasoningContent.displayName = "ReasoningContent";
