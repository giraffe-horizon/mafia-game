import type { PublicPlayer } from "@/db";
import type { MessageFormProps } from "../../types";

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
      <select
        value={msgTarget}
        onChange={(e) => onMsgTargetChange(e.target.value)}
        className="w-full bg-background border border-on-surface/20 px-3 py-2 text-on-surface text-sm font-display focus:outline-none focus:border-stamp"
      >
        <option value="">Wszyscy (broadcast)</option>
        {players.map((p) => (
          <option key={p.playerId} value={p.playerId}>
            {p.nickname}
          </option>
        ))}
      </select>
      <textarea
        value={msgContent}
        onChange={(e) => onMsgContentChange(e.target.value)}
        placeholder="Treść wiadomości..."
        rows={3}
        className="w-full bg-background border border-on-surface/20 px-3 py-2 text-on-surface text-sm font-display placeholder:text-on-surface/20 focus:outline-none focus:border-stamp resize-none"
      />
      {msgError && <p className="text-stamp text-xs font-display">{msgError}</p>}
      <button
        onClick={onSendMessage}
        disabled={msgPending || !msgContent.trim()}
        className="flex items-center justify-center gap-2 h-10 bg-stamp text-on-paper border border-stamp font-display font-bold uppercase tracking-widest text-xs hover:bg-stamp/90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-[16px]">send</span>
        {msgPending ? "Wysyłam..." : "Wyślij"}
      </button>
    </div>
  );
}
