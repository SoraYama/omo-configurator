import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type TabValue = "agents" | "mcp" | "providers";

interface TabBarProps {
  value: TabValue;
  onValueChange: (value: TabValue) => void;
}

export function TabBar({ value, onValueChange }: TabBarProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as TabValue)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="agents">Agents & Categories</TabsTrigger>
        <TabsTrigger value="mcp">MCP 服务器</TabsTrigger>
        <TabsTrigger value="providers">Providers</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
