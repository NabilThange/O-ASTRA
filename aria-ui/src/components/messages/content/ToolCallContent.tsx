import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { WrenchIcon } from "@hugeicons/core-free-icons";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ToolCallContentProps {
  agentName: string;
  toolName: string;
  toolInput: any;
  success?: boolean;
  output?: any;
  error?: string;
  duration?: number;
}

export function ToolCallContent({
  agentName,
  toolName,
  toolInput,
  success,
  output,
  error,
  duration,
}: ToolCallContentProps) {
  const isComplete = success !== undefined;
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="mb-2 rounded-md border border-bytebot-bronze-light-7 bg-bytebot-red-light-1 p-3">
      <div className="flex items-start gap-2">
        <HugeiconsIcon 
          icon={WrenchIcon} 
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-bytebot-bronze-light-12" 
        />
        <div className="flex-1 min-w-0">
          <div 
            className="mb-1 flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="text-xs font-semibold text-bytebot-bronze-light-12">
              {agentName}
            </span>
            <span className="text-xs text-bytebot-bronze-light-12">→</span>
            <span className="text-xs font-medium text-bytebot-bronze-light-12">
              {toolName}
            </span>
            {isComplete && (
              <span
                className={`ml-auto text-xs ${
                  success
                    ? "text-bytebot-green-11"
                    : "text-bytebot-red-light-11"
                }`}
              >
                {success ? "✓" : "✗"}
                {duration && ` ${duration}ms`}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className={`h-4 w-4 flex-shrink-0 text-bytebot-bronze-light-12 transition-transform ${!isComplete ? 'ml-auto' : 'ml-2'}`} />
            ) : (
              <ChevronDown className={`h-4 w-4 flex-shrink-0 text-bytebot-bronze-light-12 transition-transform ${!isComplete ? 'ml-auto' : 'ml-2'}`} />
            )}
          </div>
          
          {isExpanded && (
            <>
              {/* Tool Input */}
              <div className="mt-2">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-bytebot-bronze-light-12">
                  Parameters
                </div>
                <div className="max-h-40 overflow-auto rounded-md border border-bytebot-bronze-light-7 bg-white p-2">
                  <pre className="text-xs text-bytebot-bronze-light-12 whitespace-pre min-w-max">
                    {JSON.stringify(toolInput, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Tool Output/Error */}
              {isComplete && (
                <div className="mt-2">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-bytebot-bronze-light-12">
                    {error ? "Error" : "Result"}
                  </div>
                  <div
                    className={`max-h-56 overflow-auto rounded-md border p-2 ${
                      error
                        ? "border-bytebot-red-light-9 bg-bytebot-red-light-2"
                        : "border-bytebot-bronze-light-7 bg-white"
                    }`}
                  >
                    <pre
                      className={`text-xs whitespace-pre min-w-max ${
                        error
                          ? "text-bytebot-red-light-11"
                          : "text-bytebot-bronze-light-12"
                      }`}
                    >
                      {error || (typeof output === "string" ? output : JSON.stringify(output, null, 2))}
                    </pre>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
