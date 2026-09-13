"use client";

import React, { useState } from "react";
import { TaskStatus } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logger } from "@/lib/logger";

interface TaskStatusDropdownProps {
  taskId: string;
  currentStatus: TaskStatus;
  onStatusChange?: (newStatus: TaskStatus) => void;
}

const STATUS_OPTIONS = [
  { value: TaskStatus.PENDING, label: "Pending", color: "text-gray-600" },
  { value: TaskStatus.RUNNING, label: "Running", color: "text-blue-600" },
  { value: TaskStatus.NEEDS_HELP, label: "Needs Help", color: "text-amber-600" },
  { value: TaskStatus.NEEDS_REVIEW, label: "Needs Review", color: "text-purple-600" },
  { value: TaskStatus.COMPLETED, label: "Completed", color: "text-green-600" },
  { value: TaskStatus.CANCELLED, label: "Cancelled", color: "text-gray-600" },
  { value: TaskStatus.FAILED, label: "Failed", color: "text-red-600" },
];

export const TaskStatusDropdown: React.FC<TaskStatusDropdownProps> = ({
  taskId,
  currentStatus,
  onStatusChange,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localStatus, setLocalStatus] = useState(currentStatus);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === localStatus) return;

    setIsUpdating(true);

    try {
      logger.info(
        { event: "control.update_status", taskId, oldStatus: localStatus, newStatus },
        "Updating task status"
      );

      const response = await fetch(`/api/proxy/control/tasks/${taskId}/update-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update status");
      }

      const result = await response.json();
      setLocalStatus(newStatus as TaskStatus);

      logger.info(
        { event: "control.update_status_success", taskId, newStatus },
        "Task status updated successfully"
      );

      // Call callback if provided
      if (onStatusChange) {
        onStatusChange(newStatus as TaskStatus);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { event: "control.update_status_error", taskId, error: errorMessage },
        "Failed to update task status"
      );
      alert(`Failed to update status: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentOption = STATUS_OPTIONS.find((opt) => opt.value === localStatus);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-bytebot-bronze-dark-7">Status:</span>
      <Select
        value={localStatus}
        onValueChange={handleStatusChange}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            <span className={currentOption?.color}>{currentOption?.label}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className={option.color}>{option.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isUpdating && (
        <span className="text-xs text-gray-500">Updating...</span>
      )}
    </div>
  );
};
