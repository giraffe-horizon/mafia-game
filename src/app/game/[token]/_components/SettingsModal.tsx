import CharacterPicker from "@/components/CharacterPicker";

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  playerNickname: string;
  currentPlayer: {
    isHost: boolean;
    character?: {
      id: string;
    };
  };
  characters: Array<{
    id: string;
    slug: string;
    name: string;
    name_pl: string;
    avatar_url: string;
  }>;
  selectedCharacterId: string | null;
  onCharacterSelect: (id: string | null) => void;
  onSave: () => void;
  onLeaveGame: () => void;
}

export default function SettingsModal({
  isVisible,
  onClose,
  playerNickname,
  currentPlayer,
  characters,
  selectedCharacterId,
  onCharacterSelect,
  onSave,
  onLeaveGame,
}: SettingsModalProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-white font-bold text-lg mb-4 font-typewriter">Ustawienia gracza</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-slate-400 text-sm mb-2 font-typewriter">Nazwa</label>
            <input
              type="text"
              value={playerNickname || ""}
              readOnly
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
            />
          </div>
          {characters.length > 0 && !currentPlayer.isHost && (
            <div>
              <label className="block text-slate-400 text-sm mb-3 font-typewriter">Postać</label>
              <CharacterPicker
                characters={characters}
                selectedId={selectedCharacterId}
                onSelect={onCharacterSelect}
              />
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-typewriter transition-colors"
          >
            Anuluj
          </button>
          {!currentPlayer.isHost && (
            <button
              onClick={onSave}
              disabled={!selectedCharacterId || selectedCharacterId === currentPlayer.character?.id}
              className="flex-1 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded font-typewriter transition-colors"
            >
              Zapisz
            </button>
          )}
        </div>
        {!currentPlayer.isHost && (
          <button
            onClick={() => {
              onClose();
              onLeaveGame();
            }}
            className="w-full mt-4 py-2 bg-red-900/50 hover:bg-red-800/50 border border-red-700/50 text-red-300 rounded font-typewriter transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Opuść grę
          </button>
        )}
      </div>
    </div>
  );
}
