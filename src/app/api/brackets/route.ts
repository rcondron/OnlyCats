import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { battles, tournaments } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get all tournaments ordered by timestamp
    const tournamentResults = await db
      .select()
      .from(tournaments)
      .orderBy(desc(tournaments.timestamp));

    // For each tournament, get its battles
    const brackets = await Promise.all(
      tournamentResults.map(async (tournament) => {
        const tournamentBattles = await db
          .select()
          .from(battles)
          .where(eq(battles.battleId, tournament.battleId))
          .orderBy(battles.round);

        // Convert the battles into a bracket format
        const matches = tournamentBattles.map((battle) => ({
          id: battle.id,
          round: battle.round,
          winner: {
            id: Number(battle.winnerId),
            name: `Cat #${battle.winnerId}`,
            imageUrl: `/api/cats/${battle.winnerId}/image`,
          },
          loser: {
            id: Number(battle.loserId),
            name: `Cat #${battle.loserId}`,
            imageUrl: `/api/cats/${battle.loserId}/image`,
          },
        }));

        return {
          id: tournament.id.toString(),
          battleID: tournament.battleId,
          matches,
          totalRounds: Math.max(...matches.map(m => m.round)),
          prizePool: tournament.prizePool,
          participantCount: tournament.participantCount,
          timestamp: tournament.timestamp,
        };
      })
    );

    return NextResponse.json(brackets);
  } catch (error) {
    console.error('Error fetching brackets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brackets' },
      { status: 500 }
    );
  }
} 