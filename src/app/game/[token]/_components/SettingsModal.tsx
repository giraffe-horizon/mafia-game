import CharacterPicker from "@/components/CharacterPicker";
import { Button, Modal } from "@/components/ui";

export interface PlayerInfo {
  playerNickname: string;
  currentPlayer: {
    isHost: boolean;
    character?: {
      id: string;
    };
  };
}

export interface CharacterData {
  characters: Array<{
    id: string;
    slug: string;
    name: string;
    name_pl: string;
    avatar_url: string;
  }>;
  selectedCharacterId: string | null;
  onCharacterSelect: (id: string | null) => void;
}

export interface ModalActions {
  onSave: () => void;
  onLeaveGame: () => void;
}

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  playerInfo: PlayerInfo;
  characterData: CharacterData;
  modalActions: ModalActions;
}

export default function SettingsModal({
  isVisible,
  onClose,
  playerInfo,
  characterData,
  modalActions,
}: SettingsModalProps) {
  const { playerNickname, currentPlayer } = playerInfo;
  const { characters, selectedCharacterId, onCharacterSelect } = characterData;
  const { onSave, onLeaveGame } = modalActions;

  return (
    <Modal isOpen={isVisible} onClose={onClose} title="Ustawienia gracza">
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
        <Button onClick={onClose} variant="secondary" className="flex-1">
          Anuluj
        </Button>
        {!currentPlayer.isHost && (
          <Button
            onClick={onSave}
            disabled={!selectedCharacterId || selectedCharacterId === currentPlayer.character?.id}
            variant="primary"
            className="flex-1"
          >
            Zapisz
          </Button>
        )}
      </div>
      {!currentPlayer.isHost && (
        <Button
          onClick={() => {
            onClose();
            onLeaveGame();
          }}
          variant="danger"
          icon="logout"
          className="w-full mt-4"
        >
          Opuść grę
        </Button>
      )}
    </Modal>
  );
}
