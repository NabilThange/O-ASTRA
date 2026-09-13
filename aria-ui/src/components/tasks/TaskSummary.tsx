"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckmarkCircle01Icon, CancelCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface TaskSummaryData {
  summary: string;
  steps_completed: string[];
  steps_failed: string[];
  key_actions: string[];
  errors_encountered: string[];
  final_status: string;
  recommendations?: string[];
}

interface TaskSummaryProps {
  taskId: string;
  status: "COMPLETED" | "FAILED" | "CANCELLED";
}

export function TaskSummary({ taskId, status }: TaskSummaryProps) {
  const [summary, setSummary] = useState<TaskSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`/api/proxy/tasks/${taskId}/shared-state`);
        if (response.ok) {
          const data = await response.json();
          if (data.task_summary) {
            // Parse if it's a string
            const summaryData = typeof data.task_summary === 'string' 
              ? JSON.parse(data.task_summary) 
              : data.task_summary;
            setSummary(summaryData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch task summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [taskId]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-1/3 rounded bg-gray-200"></div>
          <div className="h-3 w-full rounded bg-gray-200"></div>
          <div className="h-3 w-5/6 rounded bg-gray-200"></div>
        </div>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-3">
        {status === "COMPLETED" ? (
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            className="h-6 w-6 text-green-600"
          />
        ) : (
          <HugeiconsIcon icon={CancelCircleIcon} className="h-6 w-6 text-red-600" />
        )}
        <h2 className="text-xl font-semibold">Task Summary</h2>
        <Badge
          variant={status === "COMPLETED" ? "default" : "destructive"}
          className="ml-auto"
        >
          {status}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Main Summary */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Overview</h3>
          <p className="text-sm text-gray-600">{summary.summary}</p>
        </div>

        {/* Steps Completed */}
        {summary.steps_completed && summary.steps_completed.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              ✅ Completed Steps
            </h3>
            <ul className="space-y-1">
              {summary.steps_completed.map((step, index) => (
                <li key={index} className="text-sm text-gray-600">
                  • {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Steps Failed */}
        {summary.steps_failed && summary.steps_failed.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-red-700">
              ❌ Failed Steps
            </h3>
            <ul className="space-y-1">
              {summary.steps_failed.map((step, index) => (
                <li key={index} className="text-sm text-red-600">
                  • {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Actions */}
        {summary.key_actions && summary.key_actions.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              🔑 Key Actions
            </h3>
            <ul className="space-y-1">
              {summary.key_actions.map((action, index) => (
                <li key={index} className="text-sm text-gray-600">
                  • {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Errors */}
        {summary.errors_encountered && summary.errors_encountered.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-orange-700">
              ⚠️ Errors Encountered
            </h3>
            <ul className="space-y-1">
              {summary.errors_encountered.map((error, index) => (
                <li key={index} className="text-sm text-orange-600">
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {summary.recommendations && summary.recommendations.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-blue-700">
              💡 Recommendations
            </h3>
            <ul className="space-y-1">
              {summary.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-blue-600">
                  • {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
