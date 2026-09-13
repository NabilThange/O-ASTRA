"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FileScriptIcon, PencilEdit02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  buildWorkflowStepSummary,
  coerceWorkflowVariableValue,
  getWorkflowFieldInputValue,
  interpolateWorkflowDisplaySteps,
  sortWorkflowDisplaySteps,
  type WorkflowVariableDefinition,
} from "./workflow-plan.utils";

interface EditablePlanProps {
  agent: string;
  taskId: string;
  plan: {
    steps: Array<{
      id: string;
      type: "web" | "desktop" | "workflow";
      description: string;
      success_criteria: string;
      display_steps?: Array<{
        id: string;
        step_number?: number;
        title: string;
        description: string;
        titleTemplate?: string;
        descriptionTemplate?: string;
      }>;
      workflow_name?: string;
      workflow_vars?: Record<string, unknown>;
      workflow_var_definitions?: WorkflowVariableDefinition[];
    }>;
  };
  onApprovePlan: (approvedPlan: any[]) => Promise<void>;
}

interface EditableStep {
  id: string;
  type: "web" | "desktop" | "workflow";
  description: string;
  success_criteria: string;
  display_steps?: Array<{
    id: string;
    step_number?: number;
    title: string;
    description: string;
    titleTemplate?: string;
    descriptionTemplate?: string;
  }>;
  workflow_name?: string;
  workflow_vars?: Record<string, unknown>;
  workflow_var_definitions?: WorkflowVariableDefinition[];
  isEditing: boolean;
}

const AGENT_COLORS: Record<string, string> = {
  ORCHESTRATOR: "text-bytebot-bronze-light-12 bg-bytebot-red-light-1 border-bytebot-bronze-light-6",
};

export function EditablePlanContent({ agent, plan, onApprovePlan }: EditablePlanProps) {
  const [steps, setSteps] = useState<EditableStep[]>(
    (plan?.steps || []).map((step) => ({ ...step, isEditing: false }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const colorClass =
    AGENT_COLORS[agent] || "text-bytebot-bronze-light-12 bg-bytebot-red-light-1 border-bytebot-bronze-light-6";

  const handleEditStep = (index: number) => {
    setApprovalError(null);
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, isEditing: true } : step)));
  };

  const handleSaveStep = (index: number) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, isEditing: false } : step)));
  };

  const handleDescriptionChange = (index: number, newDescription: string) => {
    setApprovalError(null);
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, description: newDescription } : step)));
  };

  const handleWorkflowVarChange = (
    index: number,
    definition: WorkflowVariableDefinition,
    rawValue: string | boolean
  ) => {
    setApprovalError(null);
    setSteps((prev) =>
      prev.map((step, i) => {
        if (i !== index) {
          return step;
        }

        const workflowVars = {
          ...(step.workflow_vars || {}),
          [definition.name]: coerceWorkflowVariableValue(definition, rawValue),
        };

        // Re-interpolate display steps with new variable values
        const interpolatedDisplaySteps = step.display_steps
          ? interpolateWorkflowDisplaySteps(step.display_steps, workflowVars)
          : step.display_steps;

        return {
          ...step,
          workflow_vars: workflowVars,
          description: buildWorkflowStepSummary(step.workflow_name, workflowVars),
          display_steps: interpolatedDisplaySteps,
        };
      })
    );
  };

  const handleApprovePlan = async () => {
    setIsSubmitting(true);
    setApprovalError(null);

    try {
      const finalizedPlan = steps.map(({ isEditing, ...step }) => step);
      await onApprovePlan(finalizedPlan);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to approve plan.";
      setApprovalError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={`mb-4 w-full shadow-sm ${colorClass}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-4 space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-bytebot-bronze-light-3 border border-bytebot-bronze-light-6">
            <HugeiconsIcon icon={FileScriptIcon} className="h-4 w-4 text-bytebot-bronze-light-11" />
          </div>
          <div className="flex flex-col">
            <CardTitle className="text-[13px] font-semibold tracking-tight text-bytebot-bronze-light-12">
              Execution Plan
            </CardTitle>
            <CardDescription className="text-[11px] font-medium text-bytebot-bronze-light-10">
              Generated by {agent} • {steps.length} pending operations
            </CardDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-bytebot-bronze-light-11 hover:bg-bytebot-bronze-light-4 hover:text-bytebot-bronze-light-12 shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>

      {isExpanded && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
          <CardContent className="px-4 pb-4 pt-0">
            <div className="relative mt-2 pl-3">
              <div className="absolute left-[15px] top-4 bottom-4 w-px bg-bytebot-bronze-light-5"></div>

              <div className="space-y-4">
                {steps.map((step, index) => {
                  const isWorkflow = step.type === "workflow";
                  const canEditWorkflowInputs =
                    isWorkflow &&
                    Array.isArray(step.workflow_var_definitions) &&
                    step.workflow_var_definitions.length > 0;

                  return (
                    <div key={step.id} className="relative pl-7">
                      <div className="absolute left-[-4px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-bytebot-bronze-light-1 border-2 border-bytebot-bronze-light-7 shadow-sm ring-4 ring-bytebot-red-light-1 z-10">
                        <span className="text-[8px] font-bold text-bytebot-bronze-light-11">{index + 1}</span>
                      </div>

                      <div className="group rounded-md border border-bytebot-bronze-light-6 bg-bytebot-bronze-light-2/50 backdrop-blur-sm p-3 transition-colors hover:bg-bytebot-bronze-light-3/50 hover:border-bytebot-bronze-light-8 hover:shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1.5 overflow-hidden">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center rounded bg-bytebot-bronze-light-4 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-bytebot-bronze-light-11 border border-bytebot-bronze-light-6 shadow-sm">
                                {step.type}
                              </span>
                              {!isWorkflow && (
                                <span className="text-[11px] font-semibold font-mono text-bytebot-bronze-light-11 opacity-80">
                                  {step.id}
                                </span>
                              )}
                              {step.workflow_name && (
                                <span className="inline-flex items-center rounded border border-bytebot-bronze-light-6 bg-bytebot-bronze-light-3 px-2 py-0.5 text-[10px] font-medium text-bytebot-bronze-light-11">
                                  {step.workflow_name}
                                </span>
                              )}
                            </div>

                            {!isWorkflow && step.isEditing ? (
                              <textarea
                                value={step.description}
                                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                className="mt-2 w-full min-h-[60px] rounded-md border border-bytebot-bronze-light-7 bg-bytebot-bronze-light-1 p-2 text-xs text-bytebot-bronze-light-12 focus:border-bytebot-bronze-light-9 focus:ring-1 focus:ring-bytebot-bronze-light-9 focus:outline-none transition-all shadow-inner"
                                rows={2}
                              />
                            ) : !isWorkflow ? (
                              <div className="text-[13px] font-medium leading-relaxed text-bytebot-bronze-light-12">
                                {step.description}
                              </div>
                            ) : (
                              <div className="text-[11px] text-bytebot-bronze-light-11 bg-bytebot-bronze-light-3/50 rounded-sm p-1.5 border border-bytebot-bronze-light-5">
                                <span className="font-semibold text-bytebot-bronze-light-11 opacity-90 mr-1.5">
                                  Workflow:
                                </span>
                                <span className="opacity-80">{step.workflow_name || step.id}</span>
                              </div>
                            )}

                            {step.success_criteria && !isWorkflow && (
                              <div className="pt-2">
                                <p className="text-[11px] text-bytebot-bronze-light-11 bg-bytebot-bronze-light-3/50 rounded-sm p-1.5 border border-bytebot-bronze-light-5">
                                  <span className="font-semibold text-bytebot-bronze-light-11 opacity-90 mr-1.5">Success:</span>
                                  <span className="opacity-80">{step.success_criteria}</span>
                                </p>
                              </div>
                            )}

                            {isWorkflow && step.isEditing && (
                              <div className="mt-3 rounded-md border border-bytebot-bronze-light-6 bg-bytebot-bronze-light-1/70 p-3">
                                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-bytebot-bronze-light-10">
                                  Workflow Inputs
                                </p>

                                {canEditWorkflowInputs ? (
                                  <div className="space-y-3">
                                    {step.workflow_var_definitions!.map((definition) => {
                                      const fieldId = `${step.id}-${definition.name}`;
                                      const currentValue = step.workflow_vars?.[definition.name];

                                      return (
                                        <div key={definition.name} className="space-y-1.5">
                                          <Label htmlFor={fieldId} className="text-[11px] font-semibold text-bytebot-bronze-light-12">
                                            {definition.name}
                                            {definition.required ? " *" : ""}
                                          </Label>
                                          <p className="text-[11px] text-bytebot-bronze-light-10">
                                            {definition.description}
                                          </p>

                                          {definition.type === "boolean" ? (
                                            <div className="flex items-center gap-2 pt-1">
                                              <Switch
                                                id={fieldId}
                                                checked={Boolean(currentValue)}
                                                onCheckedChange={(checked) =>
                                                  handleWorkflowVarChange(index, definition, checked)
                                                }
                                              />
                                              <span className="text-[11px] text-bytebot-bronze-light-11">
                                                {Boolean(currentValue) ? "Enabled" : "Disabled"}
                                              </span>
                                            </div>
                                          ) : definition.type === "object" ? (
                                            <div className="space-y-2">
                                              <Textarea
                                                id={fieldId}
                                                value={getWorkflowFieldInputValue(definition, currentValue)}
                                                readOnly
                                                className="min-h-[96px] text-xs"
                                              />
                                              <p className="text-[11px] text-bytebot-bronze-light-10">
                                                Object workflow inputs are shown for reference and remain read-only in this version.
                                              </p>
                                            </div>
                                          ) : (
                                            <Input
                                              id={fieldId}
                                              type={definition.type === "number" ? "number" : "text"}
                                              value={getWorkflowFieldInputValue(definition, currentValue)}
                                              onChange={(e) =>
                                                handleWorkflowVarChange(index, definition, e.target.value)
                                              }
                                              placeholder={definition.default !== undefined ? String(definition.default) : ""}
                                              className="h-8 text-xs"
                                            />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-bytebot-bronze-light-10">
                                    This saved plan does not include editable workflow input definitions, so the workflow stays read-only here.
                                  </p>
                                )}
                              </div>
                            )}

                            {(() => {
                              // Debug logging for workflow display steps
                              if (isWorkflow) {
                                console.log('[Workflow Debug - EditablePlan]', {
                                  hasDisplaySteps: !!step.display_steps,
                                  displayStepsCount: step.display_steps?.length,
                                  workflowName: step.workflow_name,
                                  stepId: step.id,
                                });
                              }
                              return null;
                            })()}
                            {step.display_steps && step.display_steps.length > 0 && (
                              <div className="ml-1 border-l border-bytebot-bronze-light-6 pl-3 pt-2">
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-bytebot-bronze-light-10">
                                  Workflow Steps
                                </p>
                                <div className="space-y-2">
                                  {sortWorkflowDisplaySteps(step.display_steps).map((displayStep, displayIndex) => (
                                    <div
                                      key={displayStep.id}
                                      className="flex gap-2 text-[11px] leading-relaxed text-bytebot-bronze-light-11"
                                    >
                                      <span className="w-5 flex-shrink-0 font-mono text-bytebot-bronze-light-10">
                                        {displayStep.step_number ?? displayIndex + 1}.
                                      </span>
                                      <div>
                                        <span className="font-semibold text-bytebot-bronze-light-12">
                                          {displayStep.title}
                                        </span>
                                        <span className="ml-1">{displayStep.description}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => (step.isEditing ? handleSaveStep(index) : handleEditStep(index))}
                            className="h-7 w-7 shrink-0 rounded-md border border-transparent bg-transparent text-bytebot-bronze-light-10 opacity-0 transition-all group-hover:opacity-100 hover:bg-bytebot-bronze-light-4 hover:border-bytebot-bronze-light-7 hover:text-bytebot-bronze-light-12"
                            title={step.isEditing ? "Save" : isWorkflow ? "Edit inputs" : "Edit"}
                            disabled={isWorkflow && !canEditWorkflowInputs}
                          >
                            <HugeiconsIcon
                              icon={step.isEditing ? Tick02Icon : PencilEdit02Icon}
                              className="h-3.5 w-3.5"
                            />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </div>
      )}

      <CardFooter className="flex items-center justify-between border-t border-bytebot-bronze-light-6 bg-bytebot-bronze-light-2/50 px-4 py-3">
        <div className="mr-2 min-w-0">
          <p className="text-[11px] font-medium text-bytebot-bronze-light-11 line-clamp-1">
            {steps.length > 0 ? "Review and edit before execution." : "Generating plan steps..."}
          </p>
          {approvalError && (
            <p className="mt-1 text-[11px] text-red-700">
              {approvalError}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 px-3 text-[11px] font-medium border-bytebot-bronze-light-7 bg-transparent hover:bg-bytebot-bronze-light-4 text-bytebot-bronze-light-11 shadow-sm"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
          <Button
            size="sm"
            onClick={handleApprovePlan}
            disabled={isSubmitting || steps.length === 0}
            className="h-7 px-3 text-[12px] bg-bytebot-bronze-light-12 flex items-center gap-1.5 font-semibold text-bytebot-red-light-1 hover:bg-bytebot-bronze-light-11 shadow-sm transition-all border border-transparent"
          >
            {isSubmitting ? "Building..." : "Build Plan"}
            {!isSubmitting && <HugeiconsIcon icon={FileScriptIcon} className="h-3.5 w-3.5 ml-0.5 opacity-90" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
