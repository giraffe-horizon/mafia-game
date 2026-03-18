import type { PublicPlayer } from "@/lib/db";
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
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-typewriter focus:outline-none focus:border-primary/50"
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
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-typewriter placeholder:text-slate-600 focus:outline-none focus:border-primary/50 resize-none"
      />
      {msgError && <p className="text-red-400 text-xs font-typewriter">{msgError}</p>}
      <button
        onClick={onSendMessage}
        disabled={msgPending || !msgContent.trim()}
        className="flex items-center justify-center gap-2 h-10 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-typewriter uppercase tracking-wider text-sm transition-all disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-[16px]">send</span>
        {msgPending ? "Wysyłam..." : "Wyślij"}
      </button>
    </div>
  );
}
