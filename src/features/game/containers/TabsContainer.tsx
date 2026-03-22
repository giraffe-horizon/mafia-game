"use client";

import { useGameStore } from "@/features/game/store/gameStore";
import { usePlayerState } from "@/features/game/hooks/usePlayerState";
import type { TabId } from "@/features/game/store/slices/uiSlice";
import { TabBar } from "@/components/ui";
import NightTab from "@/features/game/components/tabs/NightTab";
import DayTab from "@/features/game/components/tabs/DayTab";
import ArchiveTab from "@/features/game/components/tabs/ArchiveTab";
import AgentsTab from "@/features/game/components/tabs/AgentsTab";

const ALL_TABS = [
  { id: "night", icon: "bedtime", label: "Noc" },
  { id: "day", icon: "wb_sunny", label: "Dzień" },
  { id: "archive", icon: "folder_open", label: "Archiwum" },
  { id: "agents", icon: "group", label: "Agenci" },
] as const;

export default function TabsContainer() {
  const activeTab = useGameStore((s) => s.activeTab);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const tabNotifications = useGameStore((s) => s.tabNotifications);
  const { isHost } = usePlayerState();

  // Hide Night tab for GM (host)
  const tabs = isHost ? ALL_TABS.filter((t) => t.id !== "night") : ALL_TABS;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === "night" && !isHost && <NightTab />}
        {activeTab === "day" && <DayTab />}
        {activeTab === "archive" && <ArchiveTab />}
        {activeTab === "agents" && <AgentsTab />}
      </div>

      {/* Fixed bottom tab bar */}
      <TabBar
        tabs={[...tabs]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
        notifications={tabNotifications}
      />
    </div>
  );
}
