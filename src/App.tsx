import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { TabBar, type TabValue } from "@/components/layout/TabBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AgentTable } from "@/components/agents/AgentTable";
import { CategoryTable } from "@/components/agents/CategoryTable";
import { BatchModelBar } from "@/components/agents/BatchModelBar";
import { McpList } from "@/components/mcp/McpList";
import { ProviderList } from "@/components/provider/ProviderList";
import { useConfig } from "@/context/ConfigContext";

export default function App() {
  const [tab, setTab] = useState<TabValue>("agents");
  const { loading, error } = useConfig();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">加载配置中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">加载失败</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="px-4 pt-3">
            <TabBar value={tab} onValueChange={setTab} />
          </div>
          <div className="flex-1 overflow-auto p-4">
            {tab === "agents" && (
              <div className="space-y-6">
                <BatchModelBar />
                <AgentTable />
                <CategoryTable />
              </div>
            )}
            {tab === "mcp" && <McpList />}
            {tab === "providers" && <ProviderList />}
          </div>
        </div>
      </div>
    </div>
  );
}
