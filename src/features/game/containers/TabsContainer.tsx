"use client";

import { useGameStore } from "@/features/game/store/gameStore";
import { TabBar } from "@/components/ui";
import NightTab from "@/features/game/components/tabs/NightTab";
import DayTab from "@/features/game/components/tabs/DayTab";
import VotesTab from "@/features/game/components/tabs/VotesTab";
import AgentsTab from "@/features/game/components/tabs/AgentsTab";

const TABS = [
  { id: "night", icon: "bedtime", label: "Noc" },
  { id: "day", icon: "wb_sunny", label: "Dzień" },
  { id: "votes", icon: "how_to_vote", label: "Głosy" },
  { id: "agents", icon: "group", label: "Agenci" },
] as const;

export default function TabsContainer() {
  const activeTab = useGameStore((s) => s.activeTab);
  const setActiveTab = useGameStore((s) => s.setActiveTab);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === "night" && <NightTab />}
        {activeTab === "day" && <DayTab />}
        {activeTab === "votes" && <VotesTab />}
        {activeTab === "agents" && <AgentsTab />}
      </div>

      {/* Fixed bottom tab bar */}
      <TabBar
        tabs={[...TABS]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as "night" | "day" | "votes" | "agents")}
      />
    </div>
  );
}
