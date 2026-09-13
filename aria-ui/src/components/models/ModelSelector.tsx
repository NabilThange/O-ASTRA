import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Model, GroupedModels } from "@/types";

interface ModelSelectorProps {
  models: Model[];
  groupedModels: GroupedModels;
  selectedModel: Model | null;
  onModelChange: (model: Model | null) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  groupedModels,
  selectedModel,
  onModelChange,
}) => {
  return (
    <Select
      value={selectedModel?.name}
      onValueChange={(val) =>
        onModelChange(models.find((m) => m.name === val) || null)
      }
    >
      <SelectTrigger className="w-auto">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {groupedModels.groq.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              GROQ
            </div>
            {groupedModels.groq.map((m) => (
              <SelectItem key={m.name} value={m.name}>
                {m.title}
              </SelectItem>
            ))}
          </>
        )}
        {groupedModels.bytez.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              BYTEZ
            </div>
            {groupedModels.bytez.map((m) => (
              <SelectItem key={m.name} value={m.name}>
                {m.title}
              </SelectItem>
            ))}
          </>
        )}
        {groupedModels.google && groupedModels.google.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              GOOGLE
            </div>
            {groupedModels.google.map((m) => (
              <SelectItem key={m.name} value={m.name}>
                {m.title}
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  );
};
