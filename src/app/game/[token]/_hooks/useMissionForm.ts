import { useState } from "react";
import type { GameService } from "@/app/game/[token]/_services/gameService";
import { getErrorMessage } from "@/lib/errors";

interface UseMissionFormParams {
  token: string;
  refetch: () => Promise<void>;
  gameService: GameService;
}

interface UseMissionFormReturn {
  msnTarget: string;
  msnDesc: string;
  msnSecret: boolean;
  msnPoints: 1 | 2 | 3;
  msnPreset: string;
  msnPending: boolean;
  msnError: string;
  setMsnTarget: (target: string) => void;
  setMsnDesc: (desc: string) => void;
  setMsnSecret: (secret: boolean) => void;
  setMsnPoints: (points: 1 | 2 | 3) => void;
  setMsnPreset: (preset: string) => void;
  setMsnError: (error: string) => void;
  handleCreateMission: () => Promise<void>;
  handleCompleteMission: (missionId: string) => Promise<void>;
  handleDeleteMission: (missionId: string) => Promise<void>;
}

export function useMissionForm({
  token,
  refetch,
  gameService,
}: UseMissionFormParams): UseMissionFormReturn {
  const [msnTarget, setMsnTarget] = useState("");
  const [msnDesc, setMsnDesc] = useState("");
  const [msnSecret, setMsnSecret] = useState(false);
  const [msnPoints, setMsnPoints] = useState<1 | 2 | 3>(1);
  const [msnPreset, setMsnPreset] = useState<string>("custom");
  const [msnPending, setMsnPending] = useState(false);
  const [msnError, setMsnError] = useState("");

  const handleCreateMission = async () => {
    if (!msnTarget || !msnDesc.trim()) return;
    setMsnPending(true);
    setMsnError("");
    try {
      await gameService.createMission(token, msnTarget, msnDesc, msnSecret, msnPoints);
      setMsnDesc("");
      setMsnTarget("");
      setMsnSecret(false);
      setMsnPoints(1);
      setMsnPreset("custom");
      await refetch();
    } catch (error) {
      setMsnError(getErrorMessage(error));
    } finally {
      setMsnPending(false);
    }
  };

  const handleCompleteMission = async (missionId: string) => {
    try {
      await gameService.completeMission(token, missionId);
      await refetch();
    } catch (error) {
      setMsnError(getErrorMessage(error, "Błąd ukończenia misji"));
    }
  };

  const handleDeleteMission = async (missionId: string) => {
    try {
      await gameService.deleteMission(token, missionId);
      await refetch();
    } catch (error) {
      setMsnError(getErrorMessage(error, "Błąd usuwania misji"));
    }
  };

  return {
    msnTarget,
    msnDesc,
    msnSecret,
    msnPoints,
    msnPreset,
    msnPending,
    msnError,
    setMsnTarget,
    setMsnDesc,
    setMsnSecret,
    setMsnPoints,
    setMsnPreset,
    setMsnError,
    handleCreateMission,
    handleCompleteMission,
    handleDeleteMission,
  };
}
