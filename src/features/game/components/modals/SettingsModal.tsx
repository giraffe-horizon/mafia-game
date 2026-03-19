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
    <Modal isOpen={isVisible} onClose={onClose} title="Ustawienia">
      <div className="flex flex-col gap-4">
        <div>
          <label className="font-display font-black text-[10px] uppercase tracking-widest text-on-surface/40 block mb-2">
            Pseudonim operacyjny
          </label>
          <input
            type="text"
            value={playerNickname || ""}
            readOnly
            className="w-full bg-transparent border-b border-on-surface/20 pb-1 pt-1 font-display text-sm text-on-surface focus:outline-none"
          />
        </div>
        {characters.length > 0 && !currentPlayer.isHost && (
          <div>
            <label className="font-display font-black text-[10px] uppercase tracking-widest text-on-surface/40 block mb-3">
              Postać
            </label>
            <div className="max-h-[40vh] overflow-y-auto">
              <CharacterPicker
                characters={characters}
                selectedId={selectedCharacterId}
                onSelect={onCharacterSelect}
              />
            </div>
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
          Opuść operację
        </Button>
      )}
    </Modal>
  );
}
