"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { ChatInput } from "@/components/messages/ChatInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Model } from "@/types";
import { TaskList } from "@/components/tasks/TaskList";
import { useVoiceAgentContext } from "@/providers/VoiceAgentProvider";
import { AuraBot } from "@/components/aura/AuraBot";
import { AuraMascotBubble } from "@/components/aura/AuraMascotBubble";
import { Keyboard, Sparkles } from "lucide-react";

interface FileWithBase64 {
  name: string;
  base64: string;
  type: string;
  size: number;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileWithBase64[]>([]);
  const [isTaskInputFocused, setIsTaskInputFocused] = useState(false);
  const [showTypeInput, setShowTypeInput] = useState(false);
  const {
    dispatchInstruction,
    conversation,
    handleMascotClick,
    bubbleText,
    finalizeBuffer,
  } = useVoiceAgentContext();

  // Fetch available AI models
  useEffect(() => {
    fetch("/api/tasks/models")
      .then((res) => res.json())
      .then((data) => {
        setModels(data);
        if (data.length > 0) setSelectedModel(data[0]);
      })
      .catch((err) => console.error("Failed to load models", err));
  }, []);

  // Handle task dispatch (from voice or typing)
  const handleStartTask = useCallback(
    async (taskDescription: string) => {
      if (!taskDescription.trim()) return;

      setIsLoading(true);
      try {
        const modelToUse = selectedModel || models[0];
        const taskData: {
          description: string;
          model?: Model;
          files?: FileWithBase64[];
        } = {
          description: taskDescription,
          ...(modelToUse ? { model: modelToUse } : {}),
        };

        if (uploadedFiles.length > 0) {
          taskData.files = uploadedFiles;
        }

        await dispatchInstruction(taskDescription, taskData);
      } catch (error) {
        console.error("Error creating task:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [dispatchInstruction, selectedModel, models, uploadedFiles]
  );

  const handleSendTyped = async () => {
    await handleStartTask(input);
  };

  const handleFileUpload = (files: FileWithBase64[]) => {
    setUploadedFiles(files);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F9F9F8]">
      <Header />

      <main className="flex flex-1 flex-col items-center px-4 pb-16 pt-8 sm:pt-12">
        <div className="flex w-full max-w-2xl flex-col items-center">
          {/* Main Hero Title */}
          <h1 className="mb-10 text-center text-3xl font-normal tracking-tight text-neutral-900 sm:text-4xl">
            What can I help you get done?
          </h1>

          {/* Voice Mascot Centerpiece */}
          <div className="relative mb-8 flex flex-col items-center justify-center">
            {/* Mascot Speech Bubble */}
            <div className="absolute -top-4 right-[-10px] sm:right-[-40px] z-20">
              <AuraMascotBubble
                text={bubbleText}
                isListening={
                  conversation.state === "LISTENING" ||
                  conversation.state === "FOLLOW_UP"
                }
                isThinking={conversation.state === "DISPATCHED"}
                onActionClick={
                  conversation.state === "LISTENING" ? finalizeBuffer : undefined
                }
                actionText="Done"
                position="top-right"
              />
            </div>

            {/* AuraBot Interactive Mascot Ball */}
            <div className="relative">
              <AuraBot
                size="lg"
                emotion={conversation.emotion}
                isTaskInputFocused={isTaskInputFocused}
                onClick={handleMascotClick}
                className="drop-shadow-xl"
              />
            </div>
          </div>

          {/* "Type instead" pill button */}
          <div className="mb-8 flex flex-col items-center">
            <button
              onClick={() => setShowTypeInput((prev) => !prev)}
              className="group flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white/90 px-4 py-2 text-xs font-medium text-neutral-600 shadow-sm backdrop-blur-sm transition-all hover:border-neutral-300 hover:bg-white hover:text-neutral-900 hover:shadow"
            >
              <Keyboard className="h-3.5 w-3.5 text-neutral-500 transition-colors group-hover:text-neutral-800" />
              <span>{showTypeInput ? "Hide text input" : "Type instead"}</span>
            </button>
          </div>

          {/* Collapsible Manual Text Input & Model Selector */}
          {showTypeInput && (
            <div className="mb-10 w-full animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
                <ChatInput
                  input={input}
                  isLoading={isLoading}
                  onInputChange={setInput}
                  onSend={handleSendTyped}
                  onFileUpload={handleFileUpload}
                  onFocusChange={setIsTaskInputFocused}
                  minLines={2}
                />
                <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-2">
                  <Select
                    value={selectedModel?.name}
                    onValueChange={(val) =>
                      setSelectedModel(
                        models.find((m) => m.name === val) || null
                      )
                    }
                  >
                    <SelectTrigger className="h-8 w-auto gap-2 border-none bg-neutral-100 px-3 text-xs text-neutral-700 hover:bg-neutral-200/70">
                      <Sparkles className="h-3 w-3 text-neutral-500" />
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.name} value={m.name} className="text-xs">
                          {m.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Latest Tasks Feed */}
          <div className="w-full">
            <TaskList
              className="w-full"
              title="Latest Tasks"
              description="You'll see tasks that are completed, scheduled, or require your attention."
            />
          </div>
        </div>
      </main>
    </div>
  );
}
