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
    <div className="flex flex-col gap-0">
      {/* Form header */}
      <div className="border border-on-surface/12 bg-surface-low mb-3">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-on-surface/8">
          <span className="material-symbols-outlined text-[14px] text-on-surface/30">mail</span>
          <p className="font-display font-bold uppercase tracking-widest text-[10px] text-on-surface/30">
            Depesza operacyjna
          </p>
        </div>

        {/* Recipient selector */}
        <div className="px-3 pt-3 pb-2">
          <p className="font-display text-[9px] uppercase tracking-widest text-on-surface/25 mb-1">
            Odbiorca:
          </p>
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
        </div>

        {/* Message body */}
        <div className="px-3 pb-3">
          <p className="font-display text-[9px] uppercase tracking-widest text-on-surface/25 mb-1">
            Treść depeszy:
          </p>
          <textarea
            value={msgContent}
            onChange={(e) => onMsgContentChange(e.target.value)}
            placeholder="Wpisz treść wiadomości..."
            rows={3}
            className="w-full bg-background border border-on-surface/20 px-3 py-2 text-on-surface text-sm font-display placeholder:text-on-surface/20 focus:outline-none focus:border-stamp resize-none"
          />
        </div>
      </div>

      {msgError && <p className="text-stamp text-xs font-display mb-2">{msgError}</p>}

      <button
        onClick={onSendMessage}
        disabled={msgPending || !msgContent.trim()}
        className="flex items-center justify-center gap-2 h-10 bg-stamp text-on-paper border border-stamp font-display font-bold uppercase tracking-widest text-xs hover:bg-stamp/90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-[16px]">send</span>
        {msgPending ? "Wysyłam..." : "Wyślij depeszę"}
      </button>
    </div>
  );
}
