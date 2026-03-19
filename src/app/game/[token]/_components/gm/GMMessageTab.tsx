import type { PublicPlayer } from "@/db";
import type { MessageFormProps } from "@/app/game/[token]/types";
import { Button } from "@/components/ui";
import Select from "@/components/ui/Select";
import { TextArea } from "@/components/ui/Input";

interface GMMessageTabProps extends MessageFormProps {
  players: PublicPlayer[];
}

export default function GMMessageTab({
  players,
  msgTarget,
  msgContent,
  msgPending,
  msgError,
  onMsgTargetChange,
  onMsgContentChange,
  onSendMessage,
}: GMMessageTabProps) {
  return (
    <div className="flex flex-col gap-3">
      <Select
        value={msgTarget}
        onChange={onMsgTargetChange}
        options={[
          { value: "", label: "Wszyscy (broadcast)" },
          ...players.map((p) => ({ value: p.playerId, label: p.nickname })),
        ]}
      />
      <TextArea
        value={msgContent}
        onChange={(e) => onMsgContentChange(e.target.value)}
        placeholder="Treść wiadomości..."
        rows={3}
      />
      {msgError && <p className="text-red-400 text-xs font-typewriter">{msgError}</p>}
      <Button
        variant="ghost"
        onClick={onSendMessage}
        disabled={msgPending || !msgContent.trim()}
        loading={msgPending}
        icon="send"
        className="border-primary/40 text-primary hover:bg-primary/30"
      >
        {msgPending ? "Wysyłam..." : "Wyślij"}
      </Button>
    </div>
  );
}
