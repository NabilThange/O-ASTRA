import React from "react";
import { renderToString } from "react-dom/server";
import { MessageContent } from "./src/components/messages/content/MessageContent";
import { MessageContentType } from "@bytebot/shared";

// Create a mock AgentPlanContentBlock
const mockBlock = {
  type: MessageContentType.AgentPlan,
  agent: "ORCHESTRATOR",
  plan: {
    steps: [
      {
        id: "step_1",
        type: "web",
        description: "Test step",
        success_criteria: "Done",
      },
    ],
  },
  timestamp: new Date().toISOString(),
};

try {
  const htmlEditable = renderToString(
    <MessageContent
      content={[mockBlock] as any}
      taskId="task_123"
      isAwaitingPlanApproval={true}
    />
  );
  
  const htmlReadOnly = renderToString(
    <MessageContent
      content={[mockBlock] as any}
      taskId="task_123"
      isAwaitingPlanApproval={false}
    />
  );

  console.log("----- EDITABLE RENDER -----");
  console.log(htmlEditable.includes("Review & Edit") ? "EditablePlanContent rendered successfully!" : "FAILED: EditablePlanContent not found in output");
  if (!htmlEditable.includes("Review & Edit")) {
    console.log("Actual HTML:", htmlEditable);
  }

  console.log("----- READONLY RENDER -----");
  console.log(htmlReadOnly.includes("Execution Plan") && !htmlReadOnly.includes("Review & Edit") ? "AgentPlanContent rendered successfully!" : "FAILED: AgentPlanContent not found in output");

} catch (error) {
  console.error("Render failed with error:", error);
}
