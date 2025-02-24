import { db } from '@/lib/db';
import { battles } from '@/lib/db/schema';
import { eq, and, gte, lt, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';

interface BracketMatch {
  roundId: string;
  bracketRound: number;
  matchIndex: string;
  winnerId: number;
  loserId: number;
  winnerMetadata?: {
    name: string;
    image: string;
  };
  loserMetadata?: {
    name: string;
    image: string;
  };
  winnerStats: {
    wins: number;
    losses: number;
    championCount: number;
    lifetimeRewards: string;
  };
  loserStats: {
    wins: number;
    losses: number;
    championCount: number;
    lifetimeRewards: string;
  };
}

// Helper function to parse battle ID (YYMMDDHH + RR + IIIIII)
function parseBattleId(id: bigint) {
  const idStr = id.toString();
  const yymmdd = idStr.slice(0, 6);    // YYMMDD
  const hour = parseInt(idStr.slice(6, 8));  // HH
  const round = parseInt(idStr.slice(8, 10)); // Round number (2 digits)
  const matchNum = parseInt(idStr.slice(-6));    // Last 6 digits for match number

  return {
    dateStr: yymmdd,
    hour,
    round,
    matchNum
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    // Convert date string to YYMMDD format for comparison
    const date = new Date(dateStr);
    const yymmdd = date.toISOString().slice(2, 10).replace(/-/g, '').slice(0, 6);
    
    // Create ID range for the entire day (00-23 hours)
    const startId = BigInt(yymmdd + '00' + '00' + '000000');
    const endId = BigInt(yymmdd + '23' + '99' + '999999');

    // Get all battles for the specified day
    const dailyBattles = await db
      .select({
        Id: battles.Id,
        WinnerId: battles.WinnerId,
        LoserId: battles.LoserId,
        Reward: battles.Reward,
        IsChamp: battles.IsChamp,
      })
      .from(battles)
      .where(
        and(
          gte(battles.Id, startId),
          lt(battles.Id, endId)
        )
      )
      .orderBy(battles.Id);

    // Group battles by hour
    const tournaments = new Map<number, any[]>();
    
    for (const battle of dailyBattles) {
      // Use the raw ID string without padding
      const battleId = battle.Id.toString();
      const { hour, round, matchNum } = parseBattleId(BigInt(battleId));

      if (!tournaments.has(hour)) {
        tournaments.set(hour, []);
      }
      
      // Calculate stats for both winner and loser
      const [winnerStats, loserStats] = await Promise.all([
        calculateCatStats(Number(battle.WinnerId)),
        calculateCatStats(Number(battle.LoserId))
      ]);

      const match = {
        roundId: battleId,
        matchId: `${battleId}-${battle.WinnerId}-${battle.LoserId}`,
        hour,
        bracketRound: round,
        matchIndex: matchNum,
        winnerId: Number(battle.WinnerId),
        loserId: Number(battle.LoserId),
        winnerStats,
        loserStats,
        isChamp: battle.IsChamp === 1
      };

      tournaments.get(hour)?.push(match);
    }

    // Sort tournaments by hour and matches by round and index
    const formattedTournaments = Array.from(tournaments.entries())
      .sort(([hourA], [hourB]) => hourA - hourB)
      .map(([hour, matches]) => ({
        hour,
        matches: matches.sort((a, b) => {
          if (a.bracketRound !== b.bracketRound) {
            return a.bracketRound - b.bracketRound;
          }
          return a.matchIndex - b.matchIndex;
        })
      }));

    return NextResponse.json(formattedTournaments);

  } catch (error) {
    console.error('Error fetching bracket data:', error);
    return NextResponse.json({ error: 'Failed to fetch bracket data' }, { status: 500 });
  }
}

async function calculateCatStats(catId: number) {
  const catBattles = await db
    .select({
      Id: battles.Id,
      WinnerId: battles.WinnerId,
      LoserId: battles.LoserId,
      Reward: battles.Reward,
      IsChamp: battles.IsChamp,
    })
    .from(battles)
    .where(
      or(
        eq(battles.WinnerId, catId),
        eq(battles.LoserId, catId)
      )
    );

  return catBattles.reduce((acc, battle) => {
    if (Number(battle.WinnerId) === catId) {
      acc.wins++;
      if (battle.IsChamp === 1) acc.championCount++;
    } else {
      acc.losses++;
    }
    const rewardInWei = BigInt(Math.floor(Number(battle.Reward || 0) * 1e18)).toString();
    acc.lifetimeRewards = (BigInt(acc.lifetimeRewards) + BigInt(rewardInWei)).toString();
    return acc;
  }, {
    wins: 0,
    losses: 0,
    championCount: 0,
    lifetimeRewards: '0'
  });
} 