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
import { extractModelsFromProviders } from "@/lib/config";
import { getRecommendation } from "@/lib/recommended-models";
import { useMemo } from "react";

const VARIANTS = ["__none", "medium", "high", "xhigh", "max"];

export function AgentTable() {
  const { ohMyOpenCodeConfig, openCodeConfig, updateAgent } = useConfig();

  const agents = ohMyOpenCodeConfig?.agents ?? {};
  const models = useMemo(() => {
    if (!openCodeConfig?.providers) return [];
    return extractModelsFromProviders(openCodeConfig.providers);
  }, [openCodeConfig?.providers]);

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Agents</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">名称</TableHead>
            <TableHead>模型</TableHead>
            <TableHead className="w-[120px]">Variant</TableHead>
            <TableHead className="w-[60px]">推荐</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(agents).map(([name, agent]) => {
            const rec = getRecommendation("agent", name);
            const isRecommended =
              rec?.model === agent.model &&
              (rec?.variant ?? "") === (agent.variant ?? "");

            return (
              <TableRow key={name}>
                <TableCell className="font-mono text-sm">{name}</TableCell>
                <TableCell>
                  <Select
                    value={agent.model}
                    onValueChange={(model) =>
                      updateAgent(name, { ...agent, model })
                    }
                  >
                    <SelectTrigger className="w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={agent.variant ?? "__none"}
                    onValueChange={(v) =>
                      updateAgent(name, {
                        ...agent,
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
                              updateAgent(name, {
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
                              推荐: {rec.model}
                              {rec.variant ? ` (${rec.variant})` : ""}
                            </p>
                            {rec.fallbacks.length > 0 && (
                              <>
                                <p className="font-medium">备选链:</p>
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
                              <p className="text-orange-400">点击应用推荐配置</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs">无推荐配置</p>
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
