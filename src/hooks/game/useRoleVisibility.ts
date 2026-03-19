"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/stores/game/gameStore";

interface RoleVisibilityResult {
  roleVisible: boolean;
  setRoleVisible: (visible: boolean | ((prev: boolean) => boolean)) => void;
  toggleRole: () => void;
}

export function useRoleVisibility(): RoleVisibilityResult {
  const [roleVisible, setRoleVisible] = useState(false);
  const currentRound = useGameStore((s) => s.state?.game?.round);

  // Reset role visibility when a new round starts (rematch)
  useEffect(() => {
    setRoleVisible(false);
  }, [currentRound]);

  const toggleRole = () => setRoleVisible((prev) => !prev);

  return { roleVisible, setRoleVisible, toggleRole };
}
