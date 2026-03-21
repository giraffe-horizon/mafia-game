"use client";

import { useGameStore } from "@/features/game/store/gameStore";
import { usePlayerState } from "@/features/game/hooks/usePlayerState";
import { useCurrentPhase } from "@/features/game/hooks/useCurrentPhase";
import { TabBar } from "@/components/ui";
import NightTab from "@/features/game/components/tabs/NightTab";
import DayTab from "@/features/game/components/tabs/DayTab";
import ArchiveTab from "@/features/game/components/tabs/ArchiveTab";
import AgentsTab from "@/features/game/components/tabs/AgentsTab";
import EndScreen from "@/features/game/components/EndScreen";

const ALL_TABS = [
  { id: "night", icon: "bedtime", label: "Noc" },
  { id: "day", icon: "wb_sunny", label: "Dzień" },
  { id: "archive", icon: "folder_open", label: "Archiwum" },
  { id: "agents", icon: "group", label: "Agenci" },
] as const;

type TabId = "night" | "day" | "archive" | "agents";

export default function TabsContainer() {
  const activeTab = useGameStore((s) => s.activeTab);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const tabNotifications = useGameStore((s) => s.tabNotifications);
  const { isHost } = usePlayerState();
  const { isFinished } = useCurrentPhase();

  // Task 3: Hide Night tab for GM (host)
  const tabs = isHost ? ALL_TABS.filter((t) => t.id !== "night") : ALL_TABS;

  // Task 2: When game ends, show EndScreen as default but allow tab switching
  const showEndScreen = isFinished && activeTab === "day";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {showEndScreen && <EndScreen />}
        {activeTab === "night" && !isHost && <NightTab />}
        {activeTab === "day" && !showEndScreen && <DayTab />}
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
