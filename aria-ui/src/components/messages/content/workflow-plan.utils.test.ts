import test from "node:test";
import assert from "node:assert/strict";

import {
  buildWorkflowStepSummary,
  coerceWorkflowVariableValue,
  interpolateWorkflowDisplaySteps,
  sortWorkflowDisplaySteps,
  type WorkflowVariableDefinition,
} from "./workflow-plan.utils";

test("buildWorkflowStepSummary renders concrete workflow vars in summary text", () => {
  assert.equal(
    buildWorkflowStepSummary("freelancer-research-email", {
      businessType: "coffee shops",
      city: "Mumbai",
      recipientEmail: "user@example.com",
      maxResults: 20,
    }),
    'Run freelancer-research-email workflow with businessType "coffee shops", city "Mumbai", recipientEmail "user@example.com", and maxResults 20.',
  );
});

test("coerceWorkflowVariableValue converts numeric and boolean inputs", () => {
  const numberDefinition: WorkflowVariableDefinition = {
    name: "maxResults",
    type: "number",
    required: false,
    description: "Maximum results",
  };
  const booleanDefinition: WorkflowVariableDefinition = {
    name: "includeYouTube",
    type: "boolean",
    required: false,
    description: "Include YouTube research",
  };

  assert.equal(coerceWorkflowVariableValue(numberDefinition, "25"), 25);
  assert.equal(coerceWorkflowVariableValue(numberDefinition, ""), "");
  assert.equal(coerceWorkflowVariableValue(booleanDefinition, true), true);
});

test("sortWorkflowDisplaySteps prefers explicit step_number then original order", () => {
  const sorted = sortWorkflowDisplaySteps([
    { id: "third", step_number: 3, title: "Third", description: "Third step" },
    { id: "fallback-a", title: "Fallback A", description: "Array ordered step" },
    { id: "first", step_number: 1, title: "First", description: "First step" },
    { id: "fallback-b", title: "Fallback B", description: "Second array ordered step" },
  ]);

  assert.deepEqual(
    sorted.map((step) => step.id),
    ["first", "third", "fallback-a", "fallback-b"],
  );
});

test("interpolateWorkflowDisplaySteps returns steps in display order", () => {
  const interpolated = interpolateWorkflowDisplaySteps(
    [
      {
        id: "send",
        step_number: 2,
        title: "Send",
        description: "Send email",
        titleTemplate: "Send to {recipientEmail}",
      },
      {
        id: "research",
        step_number: 1,
        title: "Research",
        description: "Research businesses",
        titleTemplate: "Research {businessType}",
      },
    ],
    {
      businessType: "coffee shops",
      recipientEmail: "user@example.com",
    },
  );

  assert.deepEqual(
    interpolated.map((step) => ({
      id: step.id,
      title: step.title,
    })),
    [
      { id: "research", title: "Research coffee shops" },
      { id: "send", title: "Send to user@example.com" },
    ],
  );
});
