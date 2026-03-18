import { useState } from "react";
import { useRouter } from "next/navigation";
import * as apiClient from "@/lib/api-client";

interface UseGameActionsParams {
  token: string;
  refetch: () => Promise<void>;
  setError: (error: string) => void;
}

interface UseGameActionsReturn {
  actionPending: boolean;
  actionError: string;
  phasePending: boolean;
  starting: boolean;
  changingDecision: boolean;
  setChangingDecision: (changing: boolean) => void;
  handleAction: (actionType: string, targetPlayerId: string) => Promise<void>;
  handlePhase: (newPhase: string) => Promise<void>;
  handleStart: (gameMode: "full" | "simple", mafiaCount: number) => Promise<void>;
  handleKick: (playerId: string) => Promise<void>;
  handleLeave: () => Promise<void>;
  handleRematch: (mafiaCountSetting: number) => Promise<void>;
  handleGmAction: (
    forPlayerId: string,
    actionType: string,
    targetPlayerId: string
  ) => Promise<void>;
  handleTransferGm: (newHostPlayerId: string) => Promise<void>;
}

export function useGameActions({
  token,
  refetch,
  setError,
}: UseGameActionsParams): UseGameActionsReturn {
  const router = useRouter();
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState("");
  const [phasePending, setPhasePending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [changingDecision, setChangingDecision] = useState(false);

  const handleStart = async (gameMode: "full" | "simple", mafiaCount: number) => {
    setStarting(true);
    try {
      const input = { mode: gameMode, ...(mafiaCount > 0 && { mafiaCount }) };
      await apiClient.startGame(token, input);
      await refetch();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Błąd połączenia");
    } finally {
      setStarting(false);
    }
  };

  const handlePhase = async (newPhase: string) => {
    setPhasePending(true);
    try {
      await apiClient.advancePhase(token, { phase: newPhase });
      await refetch();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Błąd zmiany fazy");
    } finally {
      setPhasePending(false);
    }
  };

  const handleAction = async (actionType: string, targetPlayerId: string) => {
    setActionPending(true);
    setActionError("");
    try {
      await apiClient.submitAction(token, {
        type: actionType,
        ...(targetPlayerId && { targetPlayerId }),
      });
      await refetch();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Błąd połączenia");
    } finally {
      setActionPending(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm("Czy na pewno chcesz opuścić grę?")) return;
    try {
      await apiClient.leaveGame(token);
      router.push("/");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Błąd połączenia");
    }
  };

  const handleTransferGm = async (newHostPlayerId: string) => {
    try {
      await apiClient.transferGameMaster(token, { newHostPlayerId });
      await refetch();
    } catch {
      /* silent */
    }
  };

  const handleKick = async (playerId: string) => {
    try {
      await apiClient.kickPlayer(token, { playerId });
      await refetch();
    } catch {
      /* silent */
    }
  };

  const handleGmAction = async (
    forPlayerId: string,
    actionType: string,
    targetPlayerId: string
  ) => {
    try {
      await apiClient.submitAction(token, {
        type: actionType,
        forPlayerId,
        ...(targetPlayerId && { targetPlayerId }),
      });
      await refetch();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Błąd połączenia");
    }
  };

  const handleRematch = async (mafiaCountSetting: number) => {
    try {
      const input = mafiaCountSetting > 0 ? { mafiaCount: mafiaCountSetting } : undefined;
      await apiClient.rematchGame(token, input);
      await refetch();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Błąd połączenia");
    }
  };

  return {
    actionPending,
    actionError,
    phasePending,
    starting,
    changingDecision,
    setChangingDecision,
    handleAction,
    handlePhase,
    handleStart,
    handleKick,
    handleLeave,
    handleRematch,
    handleGmAction,
    handleTransferGm,
  };
}
