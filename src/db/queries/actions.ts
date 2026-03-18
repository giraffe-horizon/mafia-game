import type { D1Database, GameRow, GamePlayerRow } from "@/db/types";
import { now, nanoid } from "@/db/helpers";

export async function getMafiaKillActions(
  db: D1Database,
  gameId: string,
  round: number
): Promise<{
  aliveMafia: { player_id: string }[];
  killActions: { player_id: string; target_player_id: string }[];
}> {
  const { results: aliveMafia } = await db
    .prepare(
      "SELECT player_id FROM game_players WHERE game_id = ? AND role = 'mafia' AND is_alive = 1"
    )
    .bind(gameId)
    .all<{ player_id: string }>();

  const { results: killActions } = await db
    .prepare(
      "SELECT player_id, target_player_id FROM game_actions WHERE game_id = ? AND round = ? AND action_type = 'kill'"
    )
    .bind(gameId, round)
    .all<{ player_id: string; target_player_id: string }>();

  return { aliveMafia, killActions };
}

export async function getPhaseProgress(
  db: D1Database,
  gameRow: GameRow,
  allPlayers: GamePlayerRow[]
): Promise<{
  phase: string;
  requiredActions: { playerId: string; nickname: string; role: string; done: boolean }[];
  allDone: boolean;
  hint: string;
  mafiaUnanimous: boolean;
}> {
  const { phase, round } = gameRow;

  // Get all actions in current round/phase
  const { results: actions } = await db
    .prepare("SELECT * FROM game_actions WHERE game_id = ? AND round = ? AND phase = ?")
    .bind(gameRow.id, round, phase)
    .all<{ player_id: string; action_type: string }>();

  const actionsByPlayer = new Map<string, string[]>();
  actions.forEach((a) => {
    if (!actionsByPlayer.has(a.player_id)) actionsByPlayer.set(a.player_id, []);
    actionsByPlayer.get(a.player_id)!.push(a.action_type);
  });

  const alivePlayers = allPlayers.filter((p) => p.is_alive && !p.is_host);
  const requiredActions: { playerId: string; nickname: string; role: string; done: boolean }[] = [];

  let mafiaUnanimous = false;

  if (phase === "night") {
    // Check mafia consensus
    const { aliveMafia, killActions } = await getMafiaKillActions(db, gameRow.id, round);

    mafiaUnanimous = (() => {
      if (aliveMafia.length === 0) {
        return true; // No mafia left
      } else if (aliveMafia.length === 1) {
        return killActions.length === 1;
      } else {
        // Multi-mafia: need consensus (same target)
        if (killActions.length < aliveMafia.length) {
          return false;
        } else {
          const targets = new Set(killActions.map((k) => k.target_player_id || ""));
          return targets.size === 1;
        }
      }
    })();

    // Track individual mafia actions
    aliveMafia.forEach((m) => {
      const playerData = allPlayers.find((p) => p.player_id === m.player_id);
      requiredActions.push({
        playerId: m.player_id,
        nickname: playerData?.nickname || "Unknown",
        role: "mafia",
        done: actionsByPlayer.get(m.player_id)?.includes("kill") || false,
      });
    });

    // Track special roles
    alivePlayers
      .filter((p) => p.role === "detective" || p.role === "doctor")
      .forEach((p) => {
        const expectedAction = p.role === "detective" ? "investigate" : "protect";
        requiredActions.push({
          playerId: p.player_id,
          nickname: p.nickname,
          role: p.role || "unknown",
          done: actionsByPlayer.get(p.player_id)?.includes(expectedAction) || false,
        });
      });
  } else if (phase === "voting") {
    // All alive non-host players must vote
    alivePlayers.forEach((p) => {
      requiredActions.push({
        playerId: p.player_id,
        nickname: p.nickname,
        role: p.role || "unknown",
        done: actionsByPlayer.get(p.player_id)?.includes("vote") || false,
      });
    });
  }

  const allDone = requiredActions.every((r) => r.done) && (phase !== "night" || mafiaUnanimous);

  let hint = "";
  if (phase === "night") {
    const pendingMafia = requiredActions.filter((r) => r.role === "mafia" && !r.done);
    const pendingSpecial = requiredActions.filter(
      (r) => (r.role === "detective" || r.role === "doctor") && !r.done
    );

    if (pendingMafia.length > 0) {
      hint += `Mafia: ${pendingMafia.map((p) => p.nickname).join(", ")} - wybierz cel do zabicia. `;
    }
    if (pendingSpecial.length > 0) {
      hint += `Oczekuje na: ${pendingSpecial.map((p) => `${p.nickname} (${p.role})`).join(", ")}`;
    }
    if (!mafiaUnanimous && pendingMafia.length === 0) {
      hint += "Mafia musi osiągnąć jednomyślność w wyborze celu.";
    }
  } else if (phase === "voting") {
    const pendingVoters = requiredActions.filter((r) => !r.done);
    if (pendingVoters.length > 0) {
      hint = `Oczekuje na głosy: ${pendingVoters.map((p) => p.nickname).join(", ")}`;
    }
  }

  return { phase, requiredActions, allDone, hint, mafiaUnanimous };
}

export async function getVoteTally(
  db: D1Database,
  gameRow: GameRow,
  allPlayers: GamePlayerRow[]
): Promise<{
  totalVoters: number;
  votedCount: number;
  results: { nickname: string; playerId: string; votes: number }[];
}> {
  if (gameRow.phase !== "voting") {
    return { totalVoters: 0, votedCount: 0, results: [] };
  }

  const alivePlayers = allPlayers.filter((p) => p.is_alive && !p.is_host);
  const totalVoters = alivePlayers.length;

  const { results: votes } = await db
    .prepare(
      `SELECT target_player_id, COUNT(*) as count
       FROM game_actions
       WHERE game_id = ? AND round = ? AND action_type = 'vote'
       GROUP BY target_player_id`
    )
    .bind(gameRow.id, gameRow.round)
    .all<{ target_player_id: string; count: number }>();

  const { results: allVotes } = await db
    .prepare(
      "SELECT COUNT(*) as total FROM game_actions WHERE game_id = ? AND round = ? AND action_type = 'vote'"
    )
    .bind(gameRow.id, gameRow.round)
    .all<{ total: number }>();

  const votedCount = allVotes[0]?.total || 0;

  const results = votes.map((v) => {
    const targetPlayer = allPlayers.find((p) => p.player_id === v.target_player_id);
    return {
      nickname: targetPlayer?.nickname || "Unknown",
      playerId: v.target_player_id,
      votes: v.count,
    };
  });

  // Sort by vote count (highest first)
  results.sort((a, b) => b.votes - a.votes);

  return { totalVoters, votedCount, results };
}

export async function getMafiaTeamActions(
  db: D1Database,
  playerRow: GamePlayerRow,
  gameRow: GameRow,
  allPlayers: GamePlayerRow[]
): Promise<
  | {
      nickname: string;
      targetPlayerId: string | null;
      targetNickname: string | null;
    }[]
  | undefined
> {
  if (playerRow.role !== "mafia") return undefined;

  const { results: actions } = await db
    .prepare(
      `SELECT ga.player_id, ga.target_player_id
       FROM game_actions ga
       JOIN game_players gp ON ga.player_id = gp.player_id
       WHERE ga.game_id = ? AND ga.round = ? AND ga.phase = ? AND gp.role = 'mafia'`
    )
    .bind(gameRow.id, gameRow.round, gameRow.phase)
    .all<{ player_id: string; target_player_id: string | null }>();

  return actions.map((action) => {
    const actor = allPlayers.find((p) => p.player_id === action.player_id);
    const target = action.target_player_id
      ? allPlayers.find((p) => p.player_id === action.target_player_id)
      : null;

    return {
      nickname: actor?.nickname || "Unknown",
      targetPlayerId: action.target_player_id,
      targetNickname: target?.nickname || null,
    };
  });
}

export async function submitAction(
  db: D1Database,
  token: string,
  actionType: string,
  targetPlayerId?: string,
  _forPlayerId?: string
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!playerRow) return { success: false, error: "Nieprawidłowy token gracza" };

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();
  if (!gameRow) return { success: false, error: "Gra nie istnieje" };
  if (gameRow.status !== "playing") return { success: false, error: "Gra nie trwa" };
  if (!playerRow.is_alive) return { success: false, error: "Nie żyjesz" };

  // Validate action based on phase and role
  if (gameRow.phase === "night") {
    if (actionType === "kill" && playerRow.role !== "mafia") {
      return { success: false, error: "Tylko mafia może zabijać w nocy" };
    }
    if (actionType === "investigate" && playerRow.role !== "detective") {
      return { success: false, error: "Tylko detektyw może badać" };
    }
    if (actionType === "protect" && playerRow.role !== "doctor") {
      return { success: false, error: "Tylko doktor może chronić" };
    }
  } else if (gameRow.phase === "voting") {
    if (actionType !== "vote") {
      return { success: false, error: "W fazie głosowania można tylko głosować" };
    }
  } else {
    return { success: false, error: "Nie można wykonywać akcji w tej fazie gry" };
  }

  // Remove previous action of the same type in this round/phase
  await db
    .prepare(
      "DELETE FROM game_actions WHERE game_id = ? AND player_id = ? AND round = ? AND phase = ? AND action_type = ?"
    )
    .bind(playerRow.game_id, playerRow.player_id, gameRow.round, gameRow.phase, actionType)
    .run();

  // Insert new action
  await db
    .prepare(
      "INSERT INTO game_actions (id, game_id, round, phase, player_id, action_type, target_player_id, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      nanoid(),
      playerRow.game_id,
      gameRow.round,
      gameRow.phase,
      playerRow.player_id,
      actionType,
      targetPlayerId || null,
      "{}",
      now()
    )
    .run();

  return { success: true };
}
