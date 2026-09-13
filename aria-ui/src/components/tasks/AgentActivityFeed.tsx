"use client";

import React, { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AgentActivity {
  type: "screenshot" | "action" | "reasoning" | "perception";
  data: any;
  timestamp: string;
}

interface AgentActivityFeedProps {
  taskId: string;
}

export function AgentActivityFeed({ taskId }: AgentActivityFeedProps) {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [latestScreenshot, setLatestScreenshot] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;

    // Join task room
    socket.emit("join_task", taskId);

    // Listen for agent activity
    const handleActivity = (activity: AgentActivity) => {
      setActivities((prev) => [activity, ...prev].slice(0, 10)); // Keep last 10 activities

      // Update screenshot if available
      if (activity.type === "screenshot" && activity.data?.screenshot) {
        setLatestScreenshot(activity.data.screenshot);
      }
    };

    socket.on("agent_activity", handleActivity);

    return () => {
      socket.off("agent_activity", handleActivity);
      socket.emit("leave_task", taskId);
    };
  }, [taskId]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "screenshot":
        return "📸";
      case "action":
        return "⚡";
      case "reasoning":
        return "💭";
      case "perception":
        return "👁️";
      default:
        return "•";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "screenshot":
        return "bg-blue-100 text-blue-800";
      case "action":
        return "bg-green-100 text-green-800";
      case "reasoning":
        return "bg-purple-100 text-purple-800";
      case "perception":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatActionData = (activity: AgentActivity) => {
    if (activity.type === "action") {
      const { tool, arguments: args } = activity.data;
      if (tool === "computer") {
        const action = args.action;
        if (action === "click" || action === "double_click") {
          return `${action} at (${args.x}, ${args.y})`;
        } else if (action === "type") {
          return `typing: "${args.text?.substring(0, 30)}${args.text?.length > 30 ? "..." : ""}"`;
        } else if (action === "key") {
          return `pressing: ${args.text || args.key}`;
        }
        return action;
      }
      return tool;
    } else if (activity.type === "reasoning") {
      return activity.data.reasoning;
    } else if (activity.type === "perception") {
      return `Window: ${activity.data.active_window}`;
    } else if (activity.type === "screenshot") {
      return `Iteration ${activity.data.iteration}`;
    }
    return "";
  };

  if (activities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Latest Screenshot */}
      {latestScreenshot && (
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold">Current View</h3>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            <img
              src={`data:image/png;base64,${latestScreenshot}`}
              alt="Agent screenshot"
              className="h-full w-full object-contain"
            />
          </div>
        </Card>
      )}

      {/* Activity Feed */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Agent Activity</h3>
        <div className="space-y-2">
          {activities.map((activity, index) => (
            <div
              key={`${activity.timestamp}-${index}`}
              className="flex items-start gap-2 text-sm"
            >
              <Badge
                variant="secondary"
                className={`${getActivityColor(activity.type)} shrink-0`}
              >
                {getActivityIcon(activity.type)} {activity.type}
              </Badge>
              <span className="flex-1 text-gray-700">
                {formatActionData(activity)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
