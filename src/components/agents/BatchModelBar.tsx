import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["common", "agents"]);
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

  const variantSuffix =
    toVariant !== "__none" ? ` (${toVariant})` : "";

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
      <span className="text-sm font-medium whitespace-nowrap">
        {t("agents:batchReplace.title")}
      </span>

      <ModelSelect
        value={fromModel}
        onValueChange={setFromModel}
        placeholder={t("agents:batchReplace.fromPlaceholder")}
        models={currentModels}
        triggerClassName="w-[240px]"
      />

      <span className="text-muted-foreground">→</span>

      <ModelSelect
        value={toModel}
        onValueChange={setToModel}
        placeholder={t("agents:batchReplace.toPlaceholder")}
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
        {t("agents:batchReplace.applyButton")}
        {matchCount > 0 && ` (${matchCount})`}
      </Button>

      <ConfirmDialog
        open={showConfirm}
        title={t("agents:batchReplace.confirm.title")}
        description={t("agents:batchReplace.confirm.description", {
          from: fromModel,
          count: matchCount,
          to: toModel,
          variant: variantSuffix,
        })}
        confirmText={t("agents:batchReplace.confirm.confirmText")}
        onConfirm={handleApply}
        onCancel={() => setShowConfirm(false)}
        variant="destructive"
      />
    </div>
  );
}
