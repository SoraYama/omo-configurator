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
import { useConfig } from "@/context/ConfigContext";
import { extractModelsFromProviders } from "@/lib/config";

const VARIANTS = ["__none", "medium", "high", "xhigh", "max"];

export function BatchModelBar() {
  const { openCodeConfig, ohMyOpenCodeConfig, batchReplaceModel } = useConfig();
  const [fromModel, setFromModel] = useState("");
  const [toModel, setToModel] = useState("");
  const [toVariant, setToVariant] = useState("__none");
  const [showConfirm, setShowConfirm] = useState(false);

  const allModels = useMemo(() => {
    if (!openCodeConfig?.providers) return [];
    return extractModelsFromProviders(openCodeConfig.providers);
  }, [openCodeConfig?.providers]);

  const currentModels = useMemo(() => {
    const models = new Set<string>();
    if (ohMyOpenCodeConfig?.agents) {
      for (const a of Object.values(ohMyOpenCodeConfig.agents)) {
        models.add(a.model);
      }
    }
    if (ohMyOpenCodeConfig?.categories) {
      for (const c of Object.values(ohMyOpenCodeConfig.categories)) {
        models.add(c.model);
      }
    }
    return Array.from(models).sort();
  }, [ohMyOpenCodeConfig]);

  const matchCount = useMemo(() => {
    if (!fromModel) return 0;
    let count = 0;
    if (ohMyOpenCodeConfig?.agents) {
      count += Object.values(ohMyOpenCodeConfig.agents).filter(
        (a) => a.model === fromModel,
      ).length;
    }
    if (ohMyOpenCodeConfig?.categories) {
      count += Object.values(ohMyOpenCodeConfig.categories).filter(
        (c) => c.model === fromModel,
      ).length;
    }
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

      <Select value={fromModel || undefined} onValueChange={setFromModel}>
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="来源模型" />
        </SelectTrigger>
        <SelectContent>
          {currentModels.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground">→</span>

      <Select value={toModel || undefined} onValueChange={setToModel}>
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="目标模型" />
        </SelectTrigger>
        <SelectContent>
          {allModels.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
