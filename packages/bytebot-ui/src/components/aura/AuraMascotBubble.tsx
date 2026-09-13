import React from "react";
import { cn } from "@/lib/utils";
import { Loader2, Check } from "lucide-react";

interface AuraMascotBubbleProps {
  text: string;
  subText?: string;
  isListening?: boolean;
  isThinking?: boolean;
  position?: "top-right" | "right";
  onActionClick?: () => void;
  actionText?: string;
  className?: string;
}

export function AuraMascotBubble({
  text,
  subText,
  isListening = false,
  isThinking = false,
  position = "top-right",
  onActionClick,
  actionText,
  className,
}: AuraMascotBubbleProps) {
  return (
    <div
      className={cn(
        "relative z-30 inline-flex flex-col rounded-2xl bg-white px-4 py-2.5 shadow-lg shadow-black/5 ring-1 ring-black/5 transition-all duration-300",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {isListening && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
        )}
        {isThinking && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-500" />
        )}
        <span className="text-[13.5px] font-medium leading-snug text-neutral-800">
          {text}
        </span>

        {isListening && onActionClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onActionClick();
            }}
            className="ml-2 inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-white shadow hover:bg-neutral-800"
          >
            <Check className="h-3 w-3" />
            <span>{actionText || "Done"}</span>
          </button>
        )}
      </div>

      {subText && (
        <div className="mt-0.5 text-xs text-neutral-500">
          {subText}
        </div>
      )}

      {/* Speech bubble pointer / tail */}
      {position === "top-right" ? (
        <div
          className="absolute -bottom-2 -left-1 h-3 w-3 rotate-45 rounded-sm bg-white ring-b ring-l ring-black/5"
          style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }}
        />
      ) : (
        <div
          className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rotate-45 rounded-sm bg-white ring-b ring-l ring-black/5"
          style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }}
        />
      )}
    </div>
  );
}
