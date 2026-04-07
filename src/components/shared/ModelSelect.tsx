import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useConfig } from "@/context/ConfigContext";
import { buildModelList } from "@/lib/config";

interface ModelSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** 显示触发按钮的额外 className */
  triggerClassName?: string;
  /** 自定义候选模型列表，不传则自动从全局 config 聚合 */
  models?: string[];
}

export function ModelSelect({
  value,
  onValueChange,
  placeholder,
  triggerClassName,
  models: modelsProp,
}: ModelSelectProps) {
  const { openCodeConfig, ohMyOpenCodeConfig, externalModels } = useConfig();
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);

  const defaultModels = useMemo(
    () => buildModelList(openCodeConfig, ohMyOpenCodeConfig, externalModels),
    [openCodeConfig, ohMyOpenCodeConfig, externalModels],
  );
  const models = modelsProp ?? defaultModels;
  const resolvedPlaceholder = placeholder ?? t("modelSelect.placeholder");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-[260px] justify-between font-normal truncate",
            !value && "text-muted-foreground",
            triggerClassName,
          )}
        >
          <span className="truncate">{value || resolvedPlaceholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={t("modelSelect.searchPlaceholder")}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>{t("modelSelect.noResult")}</CommandEmpty>
            <CommandGroup>
              {models.map((model) => (
                <CommandItem
                  key={model}
                  value={model}
                  onSelect={(selected) => {
                    onValueChange(selected === value ? "" : selected);
                    setOpen(false);
                  }}
                  className="font-mono text-xs"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === model ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {model}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
