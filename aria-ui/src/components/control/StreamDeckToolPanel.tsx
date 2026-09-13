"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Globe02Icon,
  Mouse01Icon,
  KeyboardIcon,
  Camera01Icon,
  ArrowDown01Icon,
  FileSearchIcon,
  CursorPointer01Icon,
  TextIcon,
  ComputerTerminal01Icon,
  AppStoreIcon,
  Search01Icon,
  Mail01Icon,
  Download01Icon,
  Upload01Icon,
  StopIcon,
  PlayIcon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { ToolExecutionModal } from "./ToolExecutionModal";

export type ToolCategory = "web" | "desktop" | "workflow" | "control";

export interface ToolDefinition {
  id: string;
  name: string;
  category: ToolCategory;
  icon: any;
  description: string;
  agentName: "WEB" | "DESKTOP" | "WORKFLOW";
  toolName: string;
  parameters?: Array<{
    name: string;
    label: string;
    type: "text" | "number" | "select" | "textarea";
    required: boolean;
    placeholder?: string;
    options?: Array<{ label: string; value: string }>;
  }>;
  executeImmediately?: boolean;
}

const TOOL_DEFINITIONS: ToolDefinition[] = [
  // Web Actions (PinchTab)
  {
    id: "web-navigate",
    name: "Navigate",
    category: "web",
    icon: Globe02Icon,
    description: "Navigate to a URL",
    agentName: "WEB",
    toolName: "pinchtab_navigate",
    parameters: [
      {
        name: "url",
        label: "URL",
        type: "text",
        required: true,
        placeholder: "https://example.com",
      },
    ],
  },
  {
    id: "web-click",
    name: "Click Element",
    category: "web",
    icon: Mouse01Icon,
    description: "Click an element on the page",
    agentName: "WEB",
    toolName: "pinchtab_click",
    parameters: [
      {
        name: "selector",
        label: "Element Selector",
        type: "text",
        required: true,
        placeholder: "button.submit",
      },
    ],
  },
  {
    id: "web-type",
    name: "Type Text",
    category: "web",
    icon: KeyboardIcon,
    description: "Type text into an input field",
    agentName: "WEB",
    toolName: "pinchtab_type",
    parameters: [
      {
        name: "selector",
        label: "Element Selector",
        type: "text",
        required: true,
        placeholder: "input#search",
      },
      {
        name: "text",
        label: "Text to Type",
        type: "text",
        required: true,
        placeholder: "Enter text here",
      },
    ],
  },
  {
    id: "web-screenshot",
    name: "Screenshot",
    category: "web",
    icon: Camera01Icon,
    description: "Take a screenshot of the page",
    agentName: "WEB",
    toolName: "pinchtab_screenshot",
    executeImmediately: true,
  },
  {
    id: "web-scroll",
    name: "Scroll",
    category: "web",
    icon: ArrowDown01Icon,
    description: "Scroll the page",
    agentName: "WEB",
    toolName: "pinchtab_scroll",
    parameters: [
      {
        name: "direction",
        label: "Direction",
        type: "select",
        required: true,
        options: [
          { label: "Down", value: "down" },
          { label: "Up", value: "up" },
        ],
      },
    ],
  },
  {
    id: "web-extract",
    name: "Extract Data",
    category: "web",
    icon: FileSearchIcon,
    description: "Extract text from an element",
    agentName: "WEB",
    toolName: "pinchtab_extract",
    parameters: [
      {
        name: "selector",
        label: "Element Selector",
        type: "text",
        required: true,
        placeholder: "div.content",
      },
    ],
  },

  // Desktop Actions
  {
    id: "desktop-click",
    name: "Click Coordinates",
    category: "desktop",
    icon: CursorPointer01Icon,
    description: "Click at specific coordinates",
    agentName: "DESKTOP",
    toolName: "computer",
    parameters: [
      {
        name: "x",
        label: "X Coordinate",
        type: "number",
        required: true,
        placeholder: "640",
      },
      {
        name: "y",
        label: "Y Coordinate",
        type: "number",
        required: true,
        placeholder: "480",
      },
    ],
  },
  {
    id: "desktop-type",
    name: "Type Keys",
    category: "desktop",
    icon: TextIcon,
    description: "Type text on desktop",
    agentName: "DESKTOP",
    toolName: "computer",
    parameters: [
      {
        name: "text",
        label: "Text to Type",
        type: "text",
        required: true,
        placeholder: "Enter text here",
      },
    ],
  },
  {
    id: "desktop-key",
    name: "Press Key",
    category: "desktop",
    icon: KeyboardIcon,
    description: "Press a keyboard key",
    agentName: "DESKTOP",
    toolName: "computer",
    parameters: [
      {
        name: "key",
        label: "Key",
        type: "select",
        required: true,
        options: [
          { label: "Enter", value: "Return" },
          { label: "Tab", value: "Tab" },
          { label: "Escape", value: "Escape" },
          { label: "Backspace", value: "BackSpace" },
          { label: "Delete", value: "Delete" },
        ],
      },
    ],
  },
  {
    id: "desktop-terminal",
    name: "Run Command",
    category: "desktop",
    icon: ComputerTerminal01Icon,
    description: "Execute a terminal command",
    agentName: "DESKTOP",
    toolName: "computer",
    parameters: [
      {
        name: "command",
        label: "Command",
        type: "text",
        required: true,
        placeholder: "ls -la",
      },
    ],
  },
  {
    id: "desktop-app",
    name: "Open Application",
    category: "desktop",
    icon: AppStoreIcon,
    description: "Open an application",
    agentName: "DESKTOP",
    toolName: "computer",
    parameters: [
      {
        name: "application",
        label: "Application Name",
        type: "text",
        required: true,
        placeholder: "firefox",
      },
    ],
  },

  // Workflows
  {
    id: "workflow-google-search",
    name: "Google Search",
    category: "workflow",
    icon: Search01Icon,
    description: "Search DuckDuckGo for a query",
    agentName: "WORKFLOW",
    toolName: "google-search",
    parameters: [
      {
        name: "query",
        label: "Search Query",
        type: "text",
        required: true,
        placeholder: "AI news",
      },
    ],
  },
  {
    id: "workflow-send-gmail",
    name: "Send Gmail",
    category: "workflow",
    icon: Mail01Icon,
    description: "Send email via Gmail with optional attachment",
    agentName: "WORKFLOW",
    toolName: "send-gmail",
    parameters: [
      {
        name: "to",
        label: "To",
        type: "text",
        required: true,
        placeholder: "recipient@example.com",
      },
      {
        name: "subject",
        label: "Subject",
        type: "text",
        required: true,
        placeholder: "Email subject",
      },
      {
        name: "body",
        label: "Body",
        type: "textarea",
        required: true,
        placeholder: "Email body",
      },
      {
        name: "cc",
        label: "CC (optional)",
        type: "text",
        required: false,
        placeholder: "cc@example.com",
      },
      {
        name: "bcc",
        label: "BCC (optional)",
        type: "text",
        required: false,
        placeholder: "bcc@example.com",
      },
      {
        name: "password",
        label: "Gmail Password (optional)",
        type: "text",
        required: false,
        placeholder: "If session expired",
      },
      {
        name: "attachment",
        label: "Attachment Path (optional)",
        type: "text",
        required: false,
        placeholder: "/home/user/Desktop/file.pdf",
      },
    ],
  },
  {
    id: "workflow-send-email-n8n",
    name: "Send Email (N8N)",
    category: "workflow",
    icon: Mail01Icon,
    description: "Send email via N8N webhook",
    agentName: "WORKFLOW",
    toolName: "send-email-n8n",
    parameters: [
      {
        name: "to",
        label: "To",
        type: "text",
        required: true,
        placeholder: "recipient@example.com",
      },
      {
        name: "subject",
        label: "Subject",
        type: "text",
        required: true,
        placeholder: "Email subject",
      },
      {
        name: "body",
        label: "Body",
        type: "textarea",
        required: true,
        placeholder: "Email body",
      },
      {
        name: "cc",
        label: "CC (optional)",
        type: "text",
        required: false,
        placeholder: "cc@example.com",
      },
      {
        name: "bcc",
        label: "BCC (optional)",
        type: "text",
        required: false,
        placeholder: "bcc@example.com",
      },
      {
        name: "senderName",
        label: "Sender Name (optional)",
        type: "text",
        required: false,
        placeholder: "Aria",
      },
      {
        name: "buttonText",
        label: "Button Text (optional)",
        type: "text",
        required: false,
        placeholder: "Click Here",
      },
      {
        name: "buttonUrl",
        label: "Button URL (optional)",
        type: "text",
        required: false,
        placeholder: "https://example.com",
      },
      {
        name: "attachment",
        label: "Attachment Path (optional)",
        type: "text",
        required: false,
        placeholder: "/home/user/Desktop/file.pdf",
      },
    ],
  },
  {
    id: "workflow-open-whatsapp",
    name: "Open WhatsApp",
    category: "workflow",
    icon: Mail01Icon,
    description: "Open WhatsApp chat and send messages",
    agentName: "WORKFLOW",
    toolName: "open-whatsapp",
    parameters: [
      {
        name: "phone",
        label: "Phone Number",
        type: "text",
        required: true,
        placeholder: "911234567890",
      },
      {
        name: "messages",
        label: "Messages (optional)",
        type: "textarea",
        required: false,
        placeholder: "Hello! | How are you? | Talk later",
      },
    ],
  },
  {
    id: "workflow-summarise-url",
    name: "Summarise URL",
    category: "workflow",
    icon: FileSearchIcon,
    description: "Visit URL, scrape content, and summarise with AI",
    agentName: "WORKFLOW",
    toolName: "summarise-url",
    parameters: [
      {
        name: "url",
        label: "URL",
        type: "text",
        required: true,
        placeholder: "https://example.com/article",
      },
      {
        name: "filename",
        label: "Filename (optional)",
        type: "text",
        required: false,
        placeholder: "summary.txt",
      },
      {
        name: "prompt",
        label: "AI Prompt (optional)",
        type: "textarea",
        required: false,
        placeholder: "Summarise the key points...",
      },
    ],
  },
  {
    id: "workflow-deep-research",
    name: "Deep Research",
    category: "workflow",
    icon: Search01Icon,
    description: "Search, scrape, analyze, and generate research report",
    agentName: "WORKFLOW",
    toolName: "deep-research",
    parameters: [
      {
        name: "topic",
        label: "Research Topic",
        type: "text",
        required: true,
        placeholder: "quantum computing breakthroughs 2025",
      },
      {
        name: "max_links",
        label: "Max Links (optional)",
        type: "number",
        required: false,
        placeholder: "3",
      },
      {
        name: "email_to",
        label: "Email To (optional)",
        type: "text",
        required: false,
        placeholder: "recipient@example.com",
      },
      {
        name: "email_cc",
        label: "Email CC (optional)",
        type: "text",
        required: false,
        placeholder: "cc@example.com",
      },
      {
        name: "email_bcc",
        label: "Email BCC (optional)",
        type: "text",
        required: false,
        placeholder: "bcc@example.com",
      },
      {
        name: "email_sender_name",
        label: "Sender Name (optional)",
        type: "text",
        required: false,
        placeholder: "Aria Research",
      },
      {
        name: "email_button_text",
        label: "Button Text (optional)",
        type: "text",
        required: false,
        placeholder: "Read More",
      },
      {
        name: "email_button_url",
        label: "Button URL (optional)",
        type: "text",
        required: false,
        placeholder: "https://example.com",
      },
      {
        name: "whatsapp_to",
        label: "WhatsApp To (optional)",
        type: "text",
        required: false,
        placeholder: "919876543210",
      },
    ],
  },
  {
    id: "workflow-kilocode-request",
    name: "Kilocode Request",
    category: "workflow",
    icon: ComputerTerminal01Icon,
    description: "Launch Kilocode CLI and submit coding request",
    agentName: "WORKFLOW",
    toolName: "kilocode-request",
    parameters: [
      {
        name: "userRequest",
        label: "Coding Request",
        type: "textarea",
        required: true,
        placeholder: "Build a React component that...",
      },
    ],
  },
];

const CATEGORY_COLORS = {
  web: "bg-blue-500 hover:bg-blue-600",
  desktop: "bg-green-500 hover:bg-green-600",
  workflow: "bg-purple-500 hover:bg-purple-600",
  control: "bg-amber-500 hover:bg-amber-600",
};

const CATEGORY_LABELS = {
  web: "Web Actions",
  desktop: "Desktop Actions",
  workflow: "Workflows",
  control: "Control",
};

interface StreamDeckToolPanelProps {
  taskId: string;
  isManualControl: boolean;
  onStopAgent: () => void;
  onResumeAgent: () => void;
}

export const StreamDeckToolPanel: React.FC<StreamDeckToolPanelProps> = ({
  taskId,
  isManualControl,
  onStopAgent,
  onResumeAgent,
}) => {
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToolClick = (tool: ToolDefinition) => {
    if (tool.executeImmediately) {
      // Execute immediately without modal
      setSelectedTool(tool);
      setIsModalOpen(true);
      // Modal will auto-execute
    } else {
      setSelectedTool(tool);
      setIsModalOpen(true);
    }
  };

  const groupedTools = TOOL_DEFINITIONS.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<ToolCategory, ToolDefinition[]>);

  return (
    <div className="space-y-4">
      {/* Control Actions */}
      <div className="bg-bytebot-bronze-light-2 border-bytebot-bronze-light-7 rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-bytebot-bronze-dark-7 mb-3">
          Agent Control
        </h3>
        <div className="flex gap-2">
          {!isManualControl ? (
            <Button
              onClick={onStopAgent}
              variant="default"
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white"
              icon={<HugeiconsIcon icon={StopIcon} className="h-4 w-4" />}
            >
              Stop Agent
            </Button>
          ) : (
            <Button
              onClick={onResumeAgent}
              variant="default"
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white"
              icon={<HugeiconsIcon icon={PlayIcon} className="h-4 w-4" />}
            >
              Resume Agent
            </Button>
          )}
        </div>
      </div>

      {/* Tool Categories */}
      {(Object.keys(groupedTools) as ToolCategory[]).map((category) => (
        <div
          key={category}
          className="bg-bytebot-bronze-light-2 border-bytebot-bronze-light-7 rounded-lg border p-4"
        >
          <h3 className="text-sm font-semibold text-bytebot-bronze-dark-7 mb-3">
            {CATEGORY_LABELS[category]}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {groupedTools[category].map((tool) => (
              <Button
                key={tool.id}
                onClick={() => handleToolClick(tool)}
                disabled={!isManualControl}
                variant="outline"
                size="sm"
                className={`flex items-center gap-2 justify-start ${
                  isManualControl ? "" : "opacity-50 cursor-not-allowed"
                }`}
              >
                <HugeiconsIcon icon={tool.icon} className="h-4 w-4" />
                <span className="text-xs">{tool.name}</span>
              </Button>
            ))}
          </div>
        </div>
      ))}

      {/* Tool Execution Modal */}
      {selectedTool && (
        <ToolExecutionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTool(null);
          }}
          tool={selectedTool}
          taskId={taskId}
        />
      )}
    </div>
  );
};
