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
      "SELECT player_id, target_player_id FROM game_actions WHERE game_id = ? AND round = ? AND phase = 'night' AND action_type = 'kill'"
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

  // Only return progress for specific phases during gameplay
  if (gameRow.status !== "playing")
    return {
      phase,
      requiredActions: [],
      allDone: true,
      hint: "",
      mafiaUnanimous: true,
    };
  if (phase === "review" || phase === "lobby" || phase === "ended")
    return {
      phase,
      requiredActions: [],
      allDone: true,
      hint: "",
      mafiaUnanimous: true,
    };

  const alivePlayers = allPlayers.filter((p) => p.is_alive === 1);
  const aliveNonHost = alivePlayers.filter((p) => p.is_host === 0);

  if (phase === "day") {
    return {
      phase,
      requiredActions: [],
      allDone: true,
      hint: "Czas na dyskusję. Przejdź do głosowania gdy gracze są gotowi.",
      mafiaUnanimous: true, // Not applicable during day
    };
  }

  // Get actions for current phase/round
  const { results: actions } = await db
    .prepare("SELECT player_id FROM game_actions WHERE game_id = ? AND round = ? AND phase = ?")
    .bind(gameRow.id, round, phase)
    .all<{ player_id: string }>();

  const actedPlayerIds = new Set(actions.map((a) => a.player_id));

  if (phase === "night") {
    // Required: mafia (kill), detective (investigate), doctor (protect)
    const requiredRoles = ["mafia", "detective", "doctor"];
    const requiredActions = aliveNonHost
      .filter((p) => requiredRoles.includes(p.role!))
      .map((p) => ({
        playerId: p.player_id,
        nickname: p.nickname,
        role: p.role!,
        done: actedPlayerIds.has(p.player_id),
      }));

    const missingRoles = requiredActions.filter((a) => !a.done).map((a) => a.role);

    // Check mafia consensus
    const { aliveMafia, killActions } = await getMafiaKillActions(db, gameRow.id, round);

    let mafiaUnanimous: boolean;
    let hasConsensusIssue = false;

    if (aliveMafia.length > 1) {
      const mafiaPlayerIds = new Set(aliveMafia.map((m) => m.player_id));
      const mafiaKillActions = killActions.filter((action) => mafiaPlayerIds.has(action.player_id));

      if (mafiaKillActions.length > 0) {
        const targets = [...new Set(mafiaKillActions.map((action) => action.target_player_id))];
        const allMafiaVoted = mafiaKillActions.length === aliveMafia.length;
        const unanimous = targets.length === 1 && allMafiaVoted;

        mafiaUnanimous = unanimous;
        hasConsensusIssue = targets.length > 1;

        if (!allMafiaVoted) {
          mafiaUnanimous = false;
        }
      } else {
        // No votes yet, not unanimous
        mafiaUnanimous = false;
      }
    } else if (aliveMafia.length === 1) {
      // Single mafia member, unanimous if they voted
      mafiaUnanimous = killActions.length > 0;
    } else {
      // No mafia alive, considered unanimous
      mafiaUnanimous = true;
    }

    const allDone = missingRoles.length === 0 && mafiaUnanimous;
    const baseHint = allDone
      ? "Wszystkie akcje złożone! Przejdź do dnia."
      : `Czekaj na akcje nocne. Brakuje: ${missingRoles.join(", ")}.`;

    const hint = baseHint + (hasConsensusIssue ? " ⚠️ Mafia nie jest zgodna!" : "");

    return {
      phase,
      requiredActions,
      allDone,
      hint,
      mafiaUnanimous,
    };
  }

  if (phase === "voting") {
    // Required: ALL alive non-host players
    const requiredActions = aliveNonHost.map((p) => ({
      playerId: p.player_id,
      nickname: p.nickname,
      role: p.role!,
      done: actedPlayerIds.has(p.player_id),
    }));

    const votedCount = requiredActions.filter((a) => a.done).length;
    const totalVoters = requiredActions.length;
    const allDone = votedCount === totalVoters;

    const hint = allDone
      ? "Wszyscy zagłosowali! Ogłoś wynik."
      : `Trwa głosowanie. ${votedCount}/${totalVoters} głosów.`;

    return {
      phase,
      requiredActions,
      allDone,
      hint,
      mafiaUnanimous: true, // Not applicable during voting
    };
  }

  return {
    phase,
    requiredActions: [],
    allDone: true,
    hint: "",
    mafiaUnanimous: true,
  };
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

  const aliveNonHost = allPlayers.filter((p) => p.is_alive && !p.is_host);
  const totalVoters = aliveNonHost.length;

  const { results: votes } = await db
    .prepare(
      "SELECT target_player_id, COUNT(*) as vote_count FROM game_actions WHERE game_id = ? AND round = ? AND phase = 'voting' AND action_type = 'vote' AND target_player_id IS NOT NULL GROUP BY target_player_id ORDER BY vote_count DESC"
    )
    .bind(gameRow.id, gameRow.round)
    .all<{ target_player_id: string; vote_count: number }>();

  const { results: allVotes } = await db
    .prepare(
      "SELECT COUNT(*) as total FROM game_actions WHERE game_id = ? AND round = ? AND phase = 'voting' AND action_type = 'vote'"
    )
    .bind(gameRow.id, gameRow.round)
    .all<{ total: number }>();

  const votedCount = allVotes[0]?.total || 0;

  const results = votes.map((v) => {
    const targetPlayer = allPlayers.find((p) => p.player_id === v.target_player_id);
    return {
      nickname: targetPlayer?.nickname || "Unknown",
      playerId: v.target_player_id,
      votes: v.vote_count,
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
  forPlayerId?: string
): Promise<{ success: boolean; error?: string }> {
  const callerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!callerRow) return { success: false, error: "Nie znaleziono gracza" };

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(callerRow.game_id)
    .first<GameRow>();
  if (!gameRow || gameRow.status !== "playing") return { success: false, error: "Gra nie trwa" };

  // GM can act on behalf of another player
  let playerRow = callerRow;
  if (forPlayerId && callerRow.is_host) {
    const targetPlayer = await db
      .prepare("SELECT * FROM game_players WHERE game_id = ? AND player_id = ?")
      .bind(callerRow.game_id, forPlayerId)
      .first<GamePlayerRow>();
    if (!targetPlayer) return { success: false, error: "Gracz nie istnieje" };
    playerRow = targetPlayer;
  } else if (forPlayerId) {
    return { success: false, error: "Tylko MG może działać za innych graczy" };
  }

  if (!playerRow.is_alive)
    return { success: false, error: "Wyeliminowani gracze nie mogą działać" };

  // Validate action for phase + role
  if (gameRow.phase === "night") {
    if (actionType === "kill" && playerRow.role !== "mafia")
      return { success: false, error: "Tylko mafia może wybierać ofiary" };
    if (actionType === "investigate" && playerRow.role !== "detective")
      return { success: false, error: "Tylko detektyw może sprawdzać" };
    if (actionType === "protect" && playerRow.role !== "doctor")
      return { success: false, error: "Tylko doktor może chronić" };

    // Doctor cannot protect the same player two rounds in a row
    if (actionType === "protect" && targetPlayerId && gameRow.round > 1) {
      const lastProtect = await db
        .prepare(
          "SELECT target_player_id FROM game_actions WHERE game_id = ? AND player_id = ? AND action_type = 'protect' AND round = ? LIMIT 1"
        )
        .bind(gameRow.id, playerRow.player_id, gameRow.round - 1)
        .first<{ target_player_id: string }>();
      if (lastProtect && lastProtect.target_player_id === targetPlayerId) {
        return { success: false, error: "Nie możesz chronić tego samego gracza dwa razy z rzędu" };
      }
    }
    if (!["kill", "investigate", "protect", "wait"].includes(actionType))
      return { success: false, error: "Nieprawidłowa akcja nocna" };
  } else if (gameRow.phase === "voting") {
    if (actionType !== "vote") return { success: false, error: "Teraz można tylko głosować" };
  } else {
    return { success: false, error: "Akcje można składać tylko w nocy lub podczas głosowania" };
  }

  // Validate target
  if (targetPlayerId) {
    // Self-target and GM-target restrictions apply to night actions only (not voting)
    if (gameRow.phase === "night") {
      if (targetPlayerId === playerRow.player_id) {
        return { success: false, error: "Nie można wybrać siebie jako celu" };
      }
    }

    const target = await db
      .prepare("SELECT is_alive, is_host FROM game_players WHERE game_id = ? AND player_id = ?")
      .bind(playerRow.game_id, targetPlayerId)
      .first<{ is_alive: number; is_host: number }>();
    if (!target) return { success: false, error: "Cel nie istnieje" };
    if (!target.is_alive) return { success: false, error: "Cel jest już wyeliminowany" };
    if (target.is_host) return { success: false, error: "Nie można wybrać Mistrza Gry jako celu" };
  }

  // Allow changing decision — atomic DELETE + INSERT to prevent race conditions
  const newActionId = nanoid();
  const createdAt = now();
  await db.batch([
    db
      .prepare(
        "DELETE FROM game_actions WHERE game_id = ? AND player_id = ? AND round = ? AND phase = ?"
      )
      .bind(playerRow.game_id, playerRow.player_id, gameRow.round, gameRow.phase),
    db
      .prepare(
        "INSERT INTO game_actions (id, game_id, round, phase, player_id, action_type, target_player_id, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, '{}', ?)"
      )
      .bind(
        newActionId,
        playerRow.game_id,
        gameRow.round,
        gameRow.phase,
        playerRow.player_id,
        actionType,
        targetPlayerId ?? null,
        createdAt
      ),
  ]);

  return { success: true };
}
