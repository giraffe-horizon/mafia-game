import { MISSION_PRESETS, CATEGORY_LABELS } from "@/lib/missions-presets";
import type { PublicPlayer } from "@/db";
import type { MissionFormProps } from "../../types";
import { SectionHeader } from "@/components/ui";

interface HostMission {
  id: string;
  playerNickname: string;
  description: string;
  points: number;
  isCompleted: boolean;
}

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
              className={`p-3 border ${m.isCompleted ? "border-green-700/20 bg-green-950/10 opacity-60" : "border-on-surface/12 bg-surface-low"}`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className={`text-[10px] font-display font-bold uppercase ${m.isCompleted ? "text-green-500" : "text-on-surface/40"}`}
                    >
                      {m.playerNickname}
                    </span>
                    <span className="text-stamp text-[10px] font-display">+{m.points}pkt</span>
                    {m.isCompleted && (
                      <span className="stamp stamp-green text-[8px] py-0 px-1">WYKONANO</span>
                    )}
                  </div>
                  <p
                    className={`text-xs font-display ${m.isCompleted ? "text-on-surface/35 line-through" : "text-on-surface"}`}
                  >
                    {m.description}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0 mt-0.5">
                  {!m.isCompleted && (
                    <button
                      onClick={() => onCompleteMission(m.id)}
                      title="Oznacz jako wykonaną"
                      className="w-7 h-7 flex items-center justify-center border border-green-700/40 bg-green-950/20 text-green-400 hover:bg-green-950/40"
                    >
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteMission(m.id)}
                    title="Usuń misję"
                    className="w-7 h-7 flex items-center justify-center border border-stamp/30 bg-stamp/5 text-stamp hover:bg-stamp/10"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {hostMissions && hostMissions.length === 0 && (
        <p className="text-on-surface/25 text-xs font-display text-center py-2 uppercase tracking-wider">
          Brak misji — utwórz poniżej
        </p>
      )}

      <div className="border-t border-on-surface/10 pt-3">
        <SectionHeader className="mb-3">Nowa misja</SectionHeader>
      </div>

      <select
        value={msnTarget}
        onChange={(e) => onMsnTargetChange(e.target.value)}
        className="w-full bg-background border border-on-surface/20 px-3 py-2 text-on-surface text-sm font-display focus:outline-none focus:border-stamp"
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
        className="w-full bg-background border border-on-surface/20 px-3 py-2 text-on-surface text-sm font-display focus:outline-none focus:border-stamp"
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
        className="w-full bg-background border border-on-surface/20 px-3 py-2 text-on-surface text-sm font-display placeholder:text-on-surface/20 focus:outline-none focus:border-stamp resize-none"
      />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 ml-auto">
          {([1, 2, 3] as const).map((pts) => (
            <button
              key={pts}
              onClick={() => onMsnPointsChange(pts)}
              className={`w-9 h-9 text-sm font-display font-bold border ${
                msnPoints === pts
                  ? "border-stamp bg-stamp/10 text-stamp"
                  : "border-on-surface/20 text-on-surface/35 hover:border-on-surface/40"
              }`}
            >
              {pts}
            </button>
          ))}
        </div>
      </div>
      {msnError && <p className="text-stamp text-xs font-display">{msnError}</p>}
      <button
        onClick={onCreateMission}
        disabled={msnPending || !msnTarget || !msnDesc.trim()}
        className="flex items-center justify-center gap-2 h-10 bg-stamp text-on-paper border border-stamp font-display font-bold uppercase tracking-widest text-xs hover:bg-stamp/90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-[16px]">add_task</span>
        {msnPending ? "Tworzę..." : "Utwórz misję"}
      </button>
    </div>
  );
}
