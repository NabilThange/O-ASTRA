"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import type { ComponentProps, HTMLAttributes } from "react";
import { createContext, memo, useCallback, useContext, useMemo, useState } from "react";

export type BundledLanguage = string;

interface CodeBlockContextValue {
  code: string;
}

const CodeBlockContext = createContext<CodeBlockContextValue>({
  code: "",
});

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language?: BundledLanguage;
  showLineNumbers?: boolean;
};

export const CodeBlock = memo(
  ({
    code,
    language = "plaintext",
    showLineNumbers = false,
    className,
    children,
    ...props
  }: CodeBlockProps) => {
    const value = useMemo(() => ({ code }), [code]);

    return (
      <CodeBlockContext.Provider value={value}>
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-md border border-border/50 bg-muted/40 font-mono text-xs",
            className
          )}
          {...props}
        >
          {children ? (
            children
          ) : (
            <CodeBlockContent
              code={code}
              language={language}
              showLineNumbers={showLineNumbers}
            />
          )}
        </div>
      </CodeBlockContext.Provider>
    );
  }
);
CodeBlock.displayName = "CodeBlock";

export const CodeBlockHeader = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-center justify-between border-b border-border/40 bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CodeBlockTitle = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center gap-2 font-medium", className)} {...props}>
    {children}
  </div>
);

export const CodeBlockFilename = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("font-mono text-foreground", className)} {...props}>
    {children}
  </span>
);

export const CodeBlockActions = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("-my-1 -mr-1 flex items-center gap-2", className)}
    {...props}
  >
    {children}
  </div>
);

export const CodeBlockContent = ({
  code,
  showLineNumbers = false,
}: {
  code: string;
  language?: BundledLanguage;
  showLineNumbers?: boolean;
}) => {
  const lines = useMemo(() => code.split("\n"), [code]);

  return (
    <div className="relative overflow-auto p-3">
      <pre className="m-0 font-mono leading-relaxed">
        <code>
          {lines.map((line, idx) => (
            <div key={idx} className="flex leading-5">
              {showLineNumbers && (
                <span className="mr-4 inline-block w-6 select-none text-right text-muted-foreground/50">
                  {idx + 1}
                </span>
              )}
              <span className="text-foreground whitespace-pre">{line || " "}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CodeBlockCopyButton = ({
  className,
  onCopy,
  onError,
  timeout = 2000,
  children,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { code } = useContext(CodeBlockContext);

  const copyToClipboard = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      onCopy?.();
      setTimeout(() => setIsCopied(false), timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  }, [code, onCopy, onError, timeout]);

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <Button
      className={cn("h-6 w-6 p-0 text-muted-foreground hover:text-foreground", className)}
      onClick={copyToClipboard}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children ?? <Icon size={13} />}
    </Button>
  );
};

export type CodeBlockLanguageSelectorProps = ComponentProps<typeof Select>;
export const CodeBlockLanguageSelector = (props: CodeBlockLanguageSelectorProps) => (
  <Select {...props} />
);

export type CodeBlockLanguageSelectorTriggerProps = ComponentProps<typeof SelectTrigger>;
export const CodeBlockLanguageSelectorTrigger = ({
  className,
  ...props
}: CodeBlockLanguageSelectorTriggerProps) => (
  <SelectTrigger
    className={cn("h-6 border-none bg-transparent px-2 text-xs shadow-none", className)}
    size="sm"
    {...props}
  />
);

export type CodeBlockLanguageSelectorValueProps = ComponentProps<typeof SelectValue>;
export const CodeBlockLanguageSelectorValue = (
  props: CodeBlockLanguageSelectorValueProps
) => <SelectValue {...props} />;

export type CodeBlockLanguageSelectorContentProps = ComponentProps<typeof SelectContent>;
export const CodeBlockLanguageSelectorContent = ({
  align = "end",
  ...props
}: CodeBlockLanguageSelectorContentProps) => (
  <SelectContent align={align} {...props} />
);

export type CodeBlockLanguageSelectorItemProps = ComponentProps<typeof SelectItem>;
export const CodeBlockLanguageSelectorItem = (
  props: CodeBlockLanguageSelectorItemProps
) => <SelectItem {...props} />;
