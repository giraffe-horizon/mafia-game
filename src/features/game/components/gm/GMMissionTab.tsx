import { MISSION_PRESETS, CATEGORY_LABELS } from "@/lib/missions-presets";
import type { PublicPlayer } from "@/db";
import type { MissionFormProps, HostMission } from "@/features/game/types";
import { SectionHeader } from "@/components/ui";

interface GMMissionTabProps extends MissionFormProps {
  players: PublicPlayer[];
  hostMissions?: HostMission[];
  onCompleteMission: (id: string) => void;
  onDeleteMission: (id: string) => void;
}

export default function GMMissionTab({
  players,
  hostMissions,
  msnTarget,
  msnDesc,
  msnPoints,
  msnPreset,
  msnPending,
  msnError,
  onMsnTargetChange,
  onMsnDescChange,
  onMsnPointsChange,
  onMsnPresetChange,
  onCreateMission,
  onCompleteMission,
  onDeleteMission,
}: GMMissionTabProps) {
  function handlePresetChange(value: string) {
    onMsnPresetChange(value);
    if (value !== "custom") {
      const idx = parseInt(value, 10);
      const preset = MISSION_PRESETS[idx];
      if (preset) {
        onMsnDescChange(preset.description);
        onMsnPointsChange(preset.points);
      }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {hostMissions && hostMissions.length > 0 && (
        <div className="flex flex-col gap-2 mb-1">
          <SectionHeader className="mb-0">Aktywne misje</SectionHeader>
          {hostMissions.map((m) => (
            <div
              key={m.id}
              className={`p-3 border ${m.isCompleted ? "bg-green-950/20 border-green-900/30 opacity-60" : "bg-surface-lowest border-surface-highest"}`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className={`text-[10px] font-display font-bold uppercase ${m.isCompleted ? "text-green-500" : "text-on-surface-dim"}`}
                    >
                      {m.playerNickname}
                    </span>
                    <span className="text-surface-highest text-[10px]">·</span>
                    <span className="text-yellow-600 text-[10px] font-display">+{m.points}pkt</span>
                    {m.isCompleted && <span className="text-green-500 text-[10px]">✓</span>}
                  </div>
                  <p
                    className={`text-xs ${m.isCompleted ? "text-on-surface-dim line-through" : "text-on-surface"}`}
                  >
                    {m.description}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0 mt-0.5">
                  {!m.isCompleted && (
                    <button
                      onClick={() => onCompleteMission(m.id)}
                      title="Oznacz jako wykonaną"
                      className="w-7 h-7 flex items-center justify-center bg-green-900/30 hover:bg-green-900/60 border border-green-800/40 transition-all"
                    >
                      <span className="material-symbols-outlined text-[14px] text-green-400">
                        check
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteMission(m.id)}
                    title="Usuń misję"
                    className="w-7 h-7 flex items-center justify-center bg-red-950/30 hover:bg-red-950/60 border border-red-900/30 transition-all"
                  >
                    <span className="material-symbols-outlined text-[14px] text-red-500">
                      delete
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {hostMissions && hostMissions.length === 0 && (
        <p className="text-on-surface-dim text-xs font-display text-center py-2">
          Brak misji — utwórz poniżej
        </p>
      )}

      <div className="border-t border-surface-low pt-3">
        <SectionHeader className="mb-3">Nowa misja</SectionHeader>
      </div>

      <select
        value={msnTarget}
        onChange={(e) => onMsnTargetChange(e.target.value)}
        className="w-full bg-surface-lowest border border-surface-highest px-3 py-2 text-on-surface text-sm font-display focus:outline-none focus:border-primary/50"
      >
        <option value="">Wybierz gracza...</option>
        {players.map((p) => (
          <option key={p.playerId} value={p.playerId}>
            {p.nickname}
          </option>
        ))}
      </select>

      <select
        value={msnPreset}
        onChange={(e) => handlePresetChange(e.target.value)}
        className="w-full bg-surface-lowest border border-surface-highest px-3 py-2 text-on-surface text-sm font-display focus:outline-none focus:border-primary/50"
      >
        <option value="custom">— Własne zadanie —</option>
        {MISSION_PRESETS.map((p, i) => (
          <option key={i} value={String(i)}>
            [{CATEGORY_LABELS[p.category]}] {p.description.substring(0, 40)}…
          </option>
        ))}
      </select>

      <textarea
        value={msnDesc}
        onChange={(e) => {
          onMsnDescChange(e.target.value);
          onMsnPresetChange("custom");
        }}
        placeholder="Opis misji..."
        rows={3}
        className="w-full bg-surface-lowest border border-surface-highest px-3 py-2 text-on-surface text-sm font-display placeholder:text-on-surface-dim focus:outline-none focus:border-primary/50 resize-none"
      />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 ml-auto">
          {([1, 2, 3] as const).map((pts) => (
            <button
              key={pts}
              onClick={() => onMsnPointsChange(pts)}
              className={`w-9 h-9 text-sm font-display font-bold border transition-all ${
                msnPoints === pts
                  ? pts === 1
                    ? "bg-green-900/40 border-green-700 text-green-400"
                    : pts === 2
                      ? "bg-yellow-900/40 border-yellow-700 text-yellow-400"
                      : "bg-red-900/40 border-red-700 text-red-400"
                  : "border-surface-highest text-on-surface-dim hover:border-on-surface-dim"
              }`}
            >
              {pts}
            </button>
          ))}
        </div>
      </div>
      {msnError && <p className="text-red-400 text-xs font-display">{msnError}</p>}
      <button
        onClick={onCreateMission}
        disabled={msnPending || !msnTarget || !msnDesc.trim()}
        className="flex items-center justify-center gap-2 h-10 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-display uppercase tracking-wider text-sm transition-all disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-[16px]">add_task</span>
        {msnPending ? "Tworzę..." : "Utwórz misję"}
      </button>
    </div>
  );
}
