import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ModelSelect } from "@/components/shared/ModelSelect";
import { useConfig } from "@/context/ConfigContext";

const VARIANTS = ["__none", "medium", "high", "xhigh", "max"];

export function BatchModelBar() {
  const { ohMyOpenCodeConfig, batchReplaceModel } = useConfig();
  const [fromModel, setFromModel] = useState("");
  const [toModel, setToModel] = useState("");
  const [toVariant, setToVariant] = useState("__none");
  const [showConfirm, setShowConfirm] = useState(false);

  /** 当前 agents/categories 中已在用的模型（去重），用作来源候选 */
  const currentModels = useMemo(() => {
    const models = new Set<string>();
    for (const a of Object.values(ohMyOpenCodeConfig?.agents ?? {})) {
      if (a.model) models.add(a.model);
    }
    for (const c of Object.values(ohMyOpenCodeConfig?.categories ?? {})) {
      if (c.model) models.add(c.model);
    }
    return Array.from(models).sort();
  }, [ohMyOpenCodeConfig]);

  const matchCount = useMemo(() => {
    if (!fromModel) return 0;
    let count = 0;
    count += Object.values(ohMyOpenCodeConfig?.agents ?? {}).filter(
      (a) => a.model === fromModel,
    ).length;
    count += Object.values(ohMyOpenCodeConfig?.categories ?? {}).filter(
      (c) => c.model === fromModel,
    ).length;
    return count;
  }, [fromModel, ohMyOpenCodeConfig]);

  const handleApply = () => {
    const variant = toVariant === "__none" ? undefined : toVariant;
    batchReplaceModel(fromModel, toModel, variant);
    setShowConfirm(false);
    setFromModel("");
    setToModel("");
    setToVariant("__none");
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
      <span className="text-sm font-medium whitespace-nowrap">批量替换</span>

      {/* 来源：仅显示当前在用模型 */}
      <ModelSelect
        value={fromModel}
        onValueChange={setFromModel}
        placeholder="来源模型"
        models={currentModels}
        triggerClassName="w-[240px]"
      />

      <span className="text-muted-foreground">→</span>

      {/* 目标：显示全量可用模型 */}
      <ModelSelect
        value={toModel}
        onValueChange={setToModel}
        placeholder="目标模型"
        triggerClassName="w-[240px]"
      />

      <Select value={toVariant} onValueChange={setToVariant}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Variant" />
        </SelectTrigger>
        <SelectContent>
          {VARIANTS.map((v) => (
            <SelectItem key={v} value={v}>
              {v === "__none" ? "-" : v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        disabled={!fromModel || !toModel}
        onClick={() => setShowConfirm(true)}
      >
        应用
        {matchCount > 0 && ` (${matchCount})`}
      </Button>

      <ConfirmDialog
        open={showConfirm}
        title="确认批量替换"
        description={`将把所有使用 "${fromModel}" 的 agent/category（共 ${matchCount} 个）替换为 "${toModel}"${toVariant !== "__none" ? ` (${toVariant})` : ""}。此操作不可撤销。`}
        confirmText="确认替换"
        onConfirm={handleApply}
        onCancel={() => setShowConfirm(false)}
        variant="destructive"
      />
    </div>
  );
}
