export type WorkflowVariableType = "string" | "number" | "boolean" | "object";

export interface WorkflowVariableDefinition {
  name: string;
  type: WorkflowVariableType;
  required: boolean;
  description: string;
  default?: unknown;
}

export interface WorkflowDisplayStep {
  id: string;
  step_number?: number;
  title: string;
  description: string;
  titleTemplate?: string;
  descriptionTemplate?: string;
}

/**
 * Interpolate workflow display steps with actual variable values
 * @param displaySteps - Original display steps from workflow metadata
 * @param workflowVars - Actual variable values
 * @returns Interpolated display steps
 */
export function interpolateWorkflowDisplaySteps(
  displaySteps: WorkflowDisplayStep[],
  workflowVars: Record<string, unknown>,
): WorkflowDisplayStep[] {
  return sortWorkflowDisplaySteps(
    displaySteps.map((step) => ({
      ...step,
      title: step.titleTemplate
        ? interpolateTemplate(step.titleTemplate, workflowVars)
        : step.title,
      description: step.descriptionTemplate
        ? interpolateTemplate(step.descriptionTemplate, workflowVars)
        : step.description,
    })),
  );
}

export function sortWorkflowDisplaySteps(
  displaySteps: WorkflowDisplayStep[],
): WorkflowDisplayStep[] {
  return displaySteps
    .map((step, originalIndex) => ({ step, originalIndex }))
    .sort((left, right) => {
      const leftNumber = left.step.step_number;
      const rightNumber = right.step.step_number;

      if (leftNumber !== undefined && rightNumber !== undefined) {
        return leftNumber - rightNumber;
      }

      if (leftNumber !== undefined) {
        return -1;
      }

      if (rightNumber !== undefined) {
        return 1;
      }

      return left.originalIndex - right.originalIndex;
    })
    .map(({ step }) => step);
}

/**
 * Interpolate a template string with variable values
 * @param template - Template string with {variableName} placeholders
 * @param vars - Variable values
 * @returns Interpolated string
 */
function interpolateTemplate(
  template: string,
  vars: Record<string, unknown>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, varName) => {
    const value = vars[varName];
    if (value === undefined || value === null) {
      return match; // Keep placeholder if variable not found
    }
    return String(value);
  });
}

export function buildWorkflowStepSummary(
  workflowName?: string,
  workflowVars: Record<string, unknown> = {},
): string {
  if (!workflowName) {
    return "Run workflow.";
  }

  const renderedEntries = Object.entries(workflowVars)
    .filter(([, value]) => hasWorkflowValue(value))
    .map(([key, value]) => `${key} ${JSON.stringify(value)}`);

  if (renderedEntries.length === 0) {
    return `Run ${workflowName} workflow.`;
  }

  if (renderedEntries.length === 1) {
    return `Run ${workflowName} workflow with ${renderedEntries[0]}.`;
  }

  if (renderedEntries.length === 2) {
    return `Run ${workflowName} workflow with ${renderedEntries[0]} and ${renderedEntries[1]}.`;
  }

  return `Run ${workflowName} workflow with ${renderedEntries
    .slice(0, -1)
    .join(", ")}, and ${renderedEntries[renderedEntries.length - 1]}.`;
}

export function coerceWorkflowVariableValue(
  definition: WorkflowVariableDefinition,
  rawValue: string | boolean,
): unknown {
  switch (definition.type) {
    case "boolean":
      return Boolean(rawValue);
    case "number":
      return rawValue === "" ? "" : Number(rawValue);
    case "object":
      return rawValue;
    case "string":
    default:
      return String(rawValue);
  }
}

export function getWorkflowFieldInputValue(
  definition: WorkflowVariableDefinition,
  value: unknown,
): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (definition.type === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function hasWorkflowValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "";
}
