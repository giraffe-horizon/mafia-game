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
    <Modal isOpen={isVisible} onClose={onClose} title="Ustawienia agenta">
      <div className="space-y-4">
        {/* Pseudonym display */}
        <div>
          <p className="font-display font-bold uppercase tracking-widest text-[10px] text-on-surface/30 mb-1">
            Pseudonim operacyjny
          </p>
          <div className="border border-on-surface/15 bg-background px-3 py-2">
            <span className="font-display text-on-surface/70 text-sm uppercase tracking-wide">
              {playerNickname || "—"}
            </span>
          </div>
        </div>

        {/* Character picker */}
        {characters.length > 0 && !currentPlayer.isHost && (
          <div>
            <p className="font-display font-bold uppercase tracking-widest text-[10px] text-on-surface/30 mb-2">
              Tożsamość operacyjna
            </p>
            <CharacterPicker
              characters={characters}
              selectedId={selectedCharacterId}
              onSelect={onCharacterSelect}
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-5">
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
          className="w-full mt-3"
        >
          Opuść operację
        </Button>
      )}
    </Modal>
  );
}
