import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfig } from "@/context/ConfigContext";
import { extractModelsFromProviders } from "@/lib/config";
import { useMemo } from "react";

interface ModelSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function ModelSelect({
  value,
  onValueChange,
  placeholder = "选择模型",
}: ModelSelectProps) {
  const { openCodeConfig } = useConfig();

  const models = useMemo(() => {
    if (!openCodeConfig?.providers) return [];
    return extractModelsFromProviders(openCodeConfig.providers);
  }, [openCodeConfig?.providers]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[260px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model} value={model}>
            {model}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
