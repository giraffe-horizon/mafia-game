import { useState } from "react";
import type { GameService } from "../_services/gameService";

interface UseMessageFormParams {
  token: string;
  refetch: () => Promise<void>;
  gameService: GameService;
}

interface UseMessageFormReturn {
  msgTarget: string;
  msgContent: string;
  msgPending: boolean;
  msgError: string;
  setMsgTarget: (target: string) => void;
  setMsgContent: (content: string) => void;
  setMsgError: (error: string) => void;
  handleSendMessage: () => Promise<void>;
}

export function useMessageForm({
  token,
  refetch,
  gameService,
}: UseMessageFormParams): UseMessageFormReturn {
  const [msgTarget, setMsgTarget] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [msgPending, setMsgPending] = useState(false);
  const [msgError, setMsgError] = useState("");

  const handleSendMessage = async () => {
    if (!msgContent.trim()) return;
    setMsgPending(true);
    setMsgError("");
    try {
      await gameService.sendMessage(token, msgTarget || "all", msgContent);
      setMsgContent("");
      await refetch();
    } catch (error) {
      setMsgError(error instanceof Error ? error.message : "Błąd połączenia");
    } finally {
      setMsgPending(false);
    }
  };

  return {
    msgTarget,
    msgContent,
    msgPending,
    msgError,
    setMsgTarget,
    setMsgContent,
    setMsgError,
    handleSendMessage,
  };
}
