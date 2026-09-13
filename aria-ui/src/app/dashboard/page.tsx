"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { ChatInput } from "@/components/messages/ChatInput";
import { useRouter } from "next/navigation";
import { startTask } from "@/utils/taskUtils";
import { Model } from "@/types";
import { TaskList } from "@/components/tasks/TaskList";
import { logger } from "@/lib/logger";
import CherryBlossomQRCode from "@/components/qr/CherryBlossomQRCode";

interface FileWithBase64 {
  name: string;
  base64: string;
  type: string;
  size: number;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileWithBase64[]>([]);
  const router = useRouter();
  const [activePopoverIndex, setActivePopoverIndex] = useState<number | null>(
    null,
  );
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside or pressing ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonsRef.current &&
        !buttonsRef.current.contains(event.target as Node)
      ) {
        setActivePopoverIndex(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePopoverIndex(null);
      }
    };

    if (activePopoverIndex !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePopoverIndex]);

  const handleSend = async () => {
    if (!input.trim()) return;

    setIsLoading(true);

    try {
      // Fetch current ORCHESTRATOR model from agent config
      let orchestratorModel: Model | undefined;
      try {
        const agentConfigResponse = await fetch("/api/proxy/agents/config");
        if (agentConfigResponse.ok) {
          const agentConfig = await agentConfigResponse.json();
          const orchestratorConfig = agentConfig.agents?.find((a: any) => a.name === 'ORCHESTRATOR');
          if (orchestratorConfig) {
            orchestratorModel = {
              provider: orchestratorConfig.provider,
              name: orchestratorConfig.model,
            };
            logger.debug({ event: 'task.model_selected', model: orchestratorModel }, 'Using ORCHESTRATOR model for task');
          }
        }
      } catch (error) {
        logger.warn({ event: 'task.model_fetch_failed' }, 'Failed to fetch agent config, will use backend default', error instanceof Error ? error : undefined);
      }

      // Send request to start a new task
      const taskData: {
        description: string;
        model?: Model;
        files?: FileWithBase64[];
      } = {
        description: input,
        ...(orchestratorModel && { model: orchestratorModel }),
      };

      // Include files if any are uploaded
      if (uploadedFiles.length > 0) {
        taskData.files = uploadedFiles;
      }

      const task = await startTask(taskData);

      if (task && task.id) {
        // Redirect to the task page
        router.push(`/tasks/${task.id}`);
      } else {
        logger.warn({ event: 'task.create_failed' }, 'Failed to create task');
      }
    } catch (error) {
      logger.error({ event: 'task.create_error' }, 'Error sending message', error instanceof Error ? error : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (files: FileWithBase64[]) => {
    setUploadedFiles(files);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bytebot-bronze-light-1" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Header />

      <main className="flex flex-1 flex-col overflow-hidden bg-bytebot-bronze-light-1" style={{ backgroundColor: '#f5f5f5' }}>
        {/* Desktop grid layout (50/50 split) - only visible on large screens */}
        <div className="hidden h-full p-8 lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Main content area */}
          <div className="flex flex-col items-center overflow-y-auto">
            <div className="flex w-full max-w-xl flex-col items-center">
              <div className="mb-6 flex w-full flex-col items-start justify-start">
                <h1 className="text-bytebot-bronze-light-12 mb-1 text-2xl">
                  What can I help you get done?
                </h1>
              </div>

              <div className="bg-bytebot-bronze-light-2 border-bytebot-bronze-light-7 mb-10 w-full rounded-2xl border p-2">
                <ChatInput
                  input={input}
                  isLoading={isLoading}
                  onInputChange={setInput}
                  onSend={handleSend}
                  onFileUpload={handleFileUpload}
                  minLines={3}
                />
              </div>

              <TaskList
                className="w-full"
                title="Latest Tasks"
                description="You'll see tasks that are completed, scheduled, or require your attention."
              />
            </div>
          </div>

          {/* 3D Cherry Blossom QR Code - embedded directly */}
          <div className="flex items-center justify-center px-6 pt-6">
            <div className="aspect-square h-full w-full max-w-md overflow-hidden rounded-lg xl:max-w-2xl">
              <CherryBlossomQRCode />
            </div>
          </div>
        </div>

        {/* Mobile layout - only visible on small/medium screens */}
        <div className="flex h-full flex-col lg:hidden">
          <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 pt-10">
            <div className="flex w-full max-w-xl flex-col items-center pb-10">
              <div className="mb-6 flex w-full flex-col items-start justify-start">
                <h1 className="text-bytebot-bronze-light-12 mb-1 text-2xl">
                  What can I help you get done?
                </h1>
              </div>

              <div className="border-bytebot-bronze-light-5 mb-10 w-full rounded-2xl border bg-bytebot-bronze-light-2 p-2">
                <ChatInput
                  input={input}
                  isLoading={isLoading}
                  onInputChange={setInput}
                  onSend={handleSend}
                  onFileUpload={handleFileUpload}
                  minLines={3}
                />
              </div>

              <TaskList
                className="w-full"
                title="Latest Tasks"
                description="You'll see tasks that are completed, scheduled, or require your attention."
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
