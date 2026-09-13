"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToolDefinition } from "./StreamDeckToolPanel";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading02Icon, CheckmarkCircle01Icon, CancelCircleIcon } from "@hugeicons/core-free-icons";
import { logger } from "@/lib/logger";

interface ToolExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: ToolDefinition;
  taskId: string;
}

type ExecutionStatus = "idle" | "executing" | "success" | "error";

export const ToolExecutionModal: React.FC<ToolExecutionModalProps> = ({
  isOpen,
  onClose,
  tool,
  taskId,
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<ExecutionStatus>("idle");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes or tool changes
  useEffect(() => {
    if (isOpen) {
      setFormData({});
      setStatus("idle");
      setResult(null);
      setError(null);

      // Auto-execute if tool has no parameters
      if (tool.executeImmediately) {
        handleExecute();
      }
    }
  }, [isOpen, tool]);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!tool.parameters) return true;

    for (const param of tool.parameters) {
      if (param.required && !formData[param.name]) {
        setError(`${param.label} is required`);
        return false;
      }
    }
    return true;
  };

  const handleExecute = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    setStatus("executing");

    try {
      // Build parameters based on tool type
      let parameters: Record<string, any> = {};

      if (tool.agentName === "DESKTOP") {
        // Desktop tools use the unified "computer" tool with action parameter
        if (tool.id === "desktop-click") {
          parameters = {
            action: "click",
            coordinate: [parseInt(formData.x), parseInt(formData.y)],
          };
        } else if (tool.id === "desktop-type") {
          parameters = {
            action: "type",
            text: formData.text,
          };
        } else if (tool.id === "desktop-key") {
          parameters = {
            action: "key",
            text: formData.key,
          };
        } else if (tool.id === "desktop-terminal") {
          parameters = {
            action: "terminal_command",
            command: formData.command,
          };
        } else if (tool.id === "desktop-app") {
          parameters = {
            action: "application",
            application: formData.application,
          };
        }
      } else {
        // Web and Workflow tools use direct parameter mapping
        parameters = { ...formData };
      }

      logger.debug(
        { event: "control.tool_execute", tool: tool.toolName, parameters },
        "Executing tool manually"
      );

      const response = await fetch(`/api/proxy/control/tasks/${taskId}/execute-tool`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toolName: tool.toolName,
          parameters,
          agentName: tool.agentName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Tool execution failed");
      }

      const data = await response.json();
      setResult(JSON.stringify(data.result, null, 2));
      setStatus("success");

      logger.info(
        { event: "control.tool_success", tool: tool.toolName },
        "Tool executed successfully"
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setStatus("error");

      logger.error(
        { event: "control.tool_error", tool: tool.toolName, error: errorMessage },
        "Tool execution failed"
      );
    }
  };

  const handleClose = () => {
    setFormData({});
    setStatus("idle");
    setResult(null);
    setError(null);
    onClose();
  };

  const renderFormField = (param: NonNullable<ToolDefinition["parameters"]>[0]) => {
    // Special handling for application field - show quick buttons + text field
    if (tool.id === "desktop-app" && param.name === "application") {
      const commonApps = [
        { label: "Firefox", value: "firefox" },
        { label: "Chromium", value: "chromium" },
        { label: "Gmail", value: "gmail" },
        { label: "Terminal", value: "terminal" },
        { label: "File Manager", value: "thunar" },
        { label: "Text Editor", value: "mousepad" },
        { label: "VS Code", value: "vscode" },
        { label: "Desktop", value: "desktop" },
      ];

      return (
        <div className="space-y-3">
          {/* Quick App Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {commonApps.map((app) => (
              <Button
                key={app.value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleInputChange(param.name, app.value)}
                className={`text-xs ${
                  formData[param.name] === app.value
                    ? "bg-blue-100 border-blue-500"
                    : ""
                }`}
              >
                {app.label}
              </Button>
            ))}
          </div>

          {/* Text Field (optional override) */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Or enter custom application:</Label>
            <Input
              id={param.name}
              type="text"
              value={formData[param.name] || ""}
              onChange={(e) => handleInputChange(param.name, e.target.value)}
              placeholder={param.placeholder}
            />
          </div>
        </div>
      );
    }

    switch (param.type) {
      case "textarea":
        return (
          <Textarea
            id={param.name}
            value={formData[param.name] || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange(param.name, e.target.value)}
            placeholder={param.placeholder}
            rows={4}
            className="resize-none"
          />
        );

      case "select":
        return (
          <Select
            value={formData[param.name] || ""}
            onValueChange={(value) => handleInputChange(param.name, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${param.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {param.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "number":
        return (
          <Input
            id={param.name}
            type="number"
            value={formData[param.name] || ""}
            onChange={(e) => handleInputChange(param.name, e.target.value)}
            placeholder={param.placeholder}
          />
        );

      default:
        return (
          <Input
            id={param.name}
            type="text"
            value={formData[param.name] || ""}
            onChange={(e) => handleInputChange(param.name, e.target.value)}
            placeholder={param.placeholder}
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={tool.icon} className="h-5 w-5" />
            {tool.name}
          </DialogTitle>
          <DialogDescription>{tool.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Form Fields */}
          {tool.parameters && tool.parameters.length > 0 && status === "idle" && (
            <div className="space-y-4">
              {tool.parameters.map((param) => (
                <div key={param.name} className="space-y-2">
                  <Label htmlFor={param.name}>
                    {param.label}
                    {param.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {renderFormField(param)}
                </div>
              ))}
            </div>
          )}

          {/* Executing State */}
          {status === "executing" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <HugeiconsIcon
                icon={Loading02Icon}
                className="h-8 w-8 text-blue-500 animate-spin"
              />
              <p className="text-sm text-gray-600">Executing tool...</p>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-5 w-5" />
                <span className="font-semibold">Execution Successful</span>
              </div>
              {result && (
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">{result}</pre>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {status === "error" && error && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-600">
                <HugeiconsIcon icon={CancelCircleIcon} className="h-5 w-5" />
                <span className="font-semibold">Execution Failed</span>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Validation Error */}
          {status === "idle" && error && (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {status === "idle" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleExecute} className="bg-blue-500 hover:bg-blue-600">
                Execute
              </Button>
            </>
          )}

          {status === "executing" && (
            <Button disabled className="bg-blue-500">
              Executing...
            </Button>
          )}

          {(status === "success" || status === "error") && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setStatus("idle");
                  setResult(null);
                  setError(null);
                }}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Execute Again
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
