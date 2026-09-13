"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface AgentConfig {
  name: string;
  provider: string;
  model: string;
  description: string;
}

interface AgentSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_AGENT_CONFIGS: AgentConfig[] = [
  {
    name: "CLARIFIER",
    provider: "groq",
    model: "openai/gpt-oss-20b",
    description: "Fast Q&A, user is waiting",
  },
  {
    name: "ORCHESTRATOR",
    provider: "openrouter",
    model: "openai/gpt-oss-120b:free",
    description: "Brain of system - bad plan = everything fails",
  },
  {
    name: "WEB",
    provider: "google",
    model: "gemini-3-flash",
    description: "Loops 15-20x, PinchTab gives structured text",
  },
  {
    name: "DESKTOP",
    provider: "bytez",
    model: "anthropic/claude-sonnet-4-6",
    description: "User-overridable, Desktop = #1 failure point",
  },
  {
    name: "PERCEPTION",
    provider: "groq",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    description: "Vision model, fast, runs every action",
  },
  {
    name: "VERIFIER",
    provider: "groq",
    model: "openai/gpt-oss-20b",
    description: "Runs 20-30x per task, strict JSON guaranteed",
  },
  {
    name: "RECOVERY",
    provider: "bytez",
    model: "anthropic/claude-sonnet-4-6",
    description: "Needs creativity, smarter than Groq",
  },
  {
    name: "REPORTER",
    provider: "groq",
    model: "openai/gpt-oss-20b",
    description: "Reads state, writes summary - zero reasoning",
  },
];

const GROQ_MODELS = [
  { name: "llama-3.1-8b-instant", title: "Llama 3.1 8B Instant" },
  { name: "llama-3.3-70b-versatile", title: "Llama 3.3 70B Versatile" },
  { name: "openai/gpt-oss-120b", title: "GPT OSS 120B" },
  { name: "openai/gpt-oss-20b", title: "GPT OSS 20B" },
  { name: "meta-llama/llama-4-scout-17b-16e-instruct", title: "Llama 4 Scout 17B" },
];

const BYTEZ_MODELS = [
  { name: "anthropic/claude-haiku-4-5", title: "Claude Haiku 4.5" },
  { name: "anthropic/claude-opus-4-6", title: "Claude Opus 4" },
  { name: "anthropic/claude-sonnet-4-6", title: "Claude Sonnet 4.6" },
  { name: "anthropic/claude-sonnet-4-5", title: "Claude Sonnet 4.5" },
  { name: "google/gemini-2.0-flash", title: "Gemini 2.0 Flash" },
  { name: "openai/gpt-4o", title: "GPT-4o" },
];

const GOOGLE_MODELS = [
  { name: "gemini-3-flash-preview", title: "Gemini 3 Flash Preview" },
  { name: "gemini-3.1-flash-lite-preview", title: "Gemini 3.1 Flash Lite Preview" },
  { name: "gemini-2.5-flash", title: "Gemini 2.5 Flash" },
  { name: "gemini-2.5-flash-lite", title: "Gemini 2.5 Flash Lite" },
];

const OPENROUTER_MODELS = [
  { name: "openai/gpt-oss-120b:free", title: "GPT OSS 120B (Free)" },
  { name: "openai/gpt-oss-20b:free", title: "GPT OSS 20B (Free)" },
  { name: "nvidia/nemotron-3-nano-30b-a3b:free", title: "Nemotron 3 Nano 30B (Free)" },
];

export function AgentSettingsModal({ open, onOpenChange }: AgentSettingsModalProps) {
  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>(DEFAULT_AGENT_CONFIGS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAgentConfigs();
    }
  }, [open]);

  const fetchAgentConfigs = async () => {
    try {
      const response = await fetch("/api/proxy/agents/config");
      if (response.ok) {
        const data = await response.json();
        console.log("📥 [FRONTEND] Fetched agent configurations:");
        console.table(data.agents.map((a: AgentConfig) => ({
          Agent: a.name,
          Model: a.model,
          Provider: a.provider,
        })));
        setAgentConfigs(data.agents || DEFAULT_AGENT_CONFIGS);
      }
    } catch (error) {
      logger.error({ event: "agent_settings.fetch_failed" }, "Failed to fetch agent configs", error instanceof Error ? error : undefined);
    }
  };

  const handleModelChange = (agentName: string, newModel: string) => {
    setAgentConfigs((prev) =>
      prev.map((agent) => {
        if (agent.name === agentName) {
          // Determine provider based on model name
          const isGroqModel = GROQ_MODELS.some((m) => m.name === newModel);
          const isGoogleModel = GOOGLE_MODELS.some((m) => m.name === newModel);
          const isOpenRouterModel = OPENROUTER_MODELS.some((m) => m.name === newModel);
          const provider = isGroqModel ? "groq" : isGoogleModel ? "google" : isOpenRouterModel ? "openrouter" : "bytez";
          
          console.log(`🎯 [FRONTEND] Model changed for ${agentName}:`, {
            oldModel: agent.model,
            newModel: newModel,
            provider: provider,
          });
          
          return { ...agent, model: newModel, provider };
        }
        return agent;
      })
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    console.log("📤 [FRONTEND] Saving agent configurations:");
    console.table(agentConfigs.map((a) => ({
      Agent: a.name,
      Model: a.model,
      Provider: a.provider,
    })));
    
    try {
      const response = await fetch("/api/proxy/agents/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agents: agentConfigs }),
      });

      if (response.ok) {
        console.log("✅ [FRONTEND] Agent configurations saved successfully");
        try {
          const result = await response.json();
          console.log("📊 [FRONTEND] Server confirmed:");
          console.table(result.agents.map((a: AgentConfig) => ({
            Agent: a.name,
            Model: a.model,
            Provider: a.provider,
          })));
        } catch (e) {
          // Ignore JSON parse errors on success
        }
        onOpenChange(false);
      } else {
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const data = await response.json();
          errorMsg = data?.message || errorMsg;
        } catch (e) {
          // Use default error message if JSON parsing fails
        }
        throw new Error(errorMsg);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to save agent configurations: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agent Model Settings</DialogTitle>
          <DialogDescription>
            Configure which models power each agent in the system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {agentConfigs.map((agent) => (
            <div
              key={agent.name}
              className="flex items-center justify-between gap-4 rounded-lg border border-bytebot-bronze-light-7 bg-bytebot-bronze-light-2 p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-bytebot-bronze-light-12">
                    {agent.name}
                  </h3>
                  <span className="text-xs text-bytebot-bronze-dark-9 uppercase">
                    ({agent.provider})
                  </span>
                </div>
                <p className="text-sm text-bytebot-bronze-dark-9 mt-1">
                  {agent.description}
                </p>
              </div>

              <div className="w-64">
                <Select
                  value={agent.model}
                  onValueChange={(value) => handleModelChange(agent.name, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      GROQ
                    </div>
                    {GROQ_MODELS.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        {model.title}
                      </SelectItem>
                    ))}
                    <div className="my-1 border-t border-bytebot-bronze-light-7"></div>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      BYTEZ
                    </div>
                    {BYTEZ_MODELS.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        {model.title}
                      </SelectItem>
                    ))}
                    <div className="my-1 border-t border-bytebot-bronze-light-7"></div>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      GOOGLE
                    </div>
                    {GOOGLE_MODELS.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        {model.title}
                      </SelectItem>
                    ))}
                    <div className="my-1 border-t border-bytebot-bronze-light-7"></div>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      OPENROUTER (FREE)
                    </div>
                    {OPENROUTER_MODELS.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        {model.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
