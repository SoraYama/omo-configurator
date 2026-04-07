import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfig } from "@/context/ConfigContext";
import { getRecommendation } from "@/lib/recommended-models";
import { ModelSelect } from "@/components/shared/ModelSelect";

const VARIANTS = ["__none", "medium", "high", "xhigh", "max"];

export function CategoryTable() {
  const { ohMyOpenCodeConfig, updateCategory } = useConfig();
  const { t } = useTranslation(["common", "agents"]);

  const categories = ohMyOpenCodeConfig?.categories ?? {};

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">
        {t("agents:table.title.categories")}
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">{t("common:table.name")}</TableHead>
            <TableHead>{t("common:table.model")}</TableHead>
            <TableHead className="w-[120px]">{t("common:table.variant")}</TableHead>
            <TableHead className="w-[60px]">{t("common:table.recommend")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(categories).map(([name, cat]) => {
            const rec = getRecommendation("category", name);
            const isRecommended =
              rec?.model === cat.model &&
              (rec?.variant ?? "") === (cat.variant ?? "");

            return (
              <TableRow key={name}>
                <TableCell className="font-mono text-sm">{name}</TableCell>
                <TableCell>
                  <ModelSelect
                    value={cat.model}
                    onValueChange={(model) =>
                      updateCategory(name, { ...cat, model })
                    }
                    triggerClassName="w-[280px]"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={cat.variant ?? "__none"}
                    onValueChange={(v) =>
                      updateCategory(name, {
                        ...cat,
                        variant: v === "__none" ? undefined : v,
                      })
                    }
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent>
                      {VARIANTS.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v === "__none" ? "-" : v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={`cursor-pointer ${isRecommended ? "text-green-600" : "text-orange-500"}`}
                          onClick={() => {
                            if (rec && !isRecommended) {
                              updateCategory(name, {
                                model: rec.model,
                                variant: rec.variant,
                              });
                            }
                          }}
                        >
                          {isRecommended ? "✅" : "⚠️"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        {rec ? (
                          <div className="space-y-1 text-xs">
                            <p>
                              {t("agents:table.tooltip.recommended", {
                                model:
                                  rec.model +
                                  (rec.variant ? ` (${rec.variant})` : ""),
                              })}
                            </p>
                            {rec.fallbacks.length > 0 && (
                              <>
                                <p className="font-medium">
                                  {t("agents:table.tooltip.fallbackChain")}
                                </p>
                                <ol className="list-decimal list-inside">
                                  {rec.fallbacks.map((fb, i) => (
                                    <li key={i}>
                                      {fb.model}
                                      {fb.variant ? ` (${fb.variant})` : ""}
                                    </li>
                                  ))}
                                </ol>
                              </>
                            )}
                            {!isRecommended && (
                              <p className="text-orange-400">
                                {t("agents:table.tooltip.applyRecommended")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs">
                            {t("agents:table.tooltip.noRecommendation")}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
