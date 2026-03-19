"use client";

import { useGameStore } from "@/features/game/store/gameStore";

interface RoleVisibilityResult {
  roleVisible: boolean;
  toggleRole: () => void;
}

export function useRoleVisibility(): RoleVisibilityResult {
  const roleVisible = useGameStore((s) => s.roleVisible);
  const toggleRole = useGameStore((s) => s.toggleRole);

  return { roleVisible, toggleRole };
}
