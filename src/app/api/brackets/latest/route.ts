import { NextResponse } from 'next/server';
import { db, battles, cats } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Get the latest tournament date
    const latestBattle = await db.select()
      .from(battles)
      .orderBy(desc(battles.tournamentDay))
      .limit(1);

    if (latestBattle.length === 0) {
      return NextResponse.json([]);
    }

    const tournamentDate = latestBattle[0].tournamentDay;

    // Get all battles from this tournament
    const tournamentBattles = await db.select({
      id: battles.id,
      round: battles.round,
      tournamentDay: battles.tournamentDay,
      winner: {
        id: cats.id,
        name: cats.name,
        imageUrl: cats.imageUrl,
      },
      loser: {
        id: cats.id,
        name: cats.name,
        imageUrl: cats.imageUrl,
      },
    })
    .from(battles)
    .where(eq(battles.tournamentDay, tournamentDate))
    .leftJoin(cats, eq(cats.id, battles.winnerId))
    .leftJoin(cats, eq(cats.id, battles.loserId))
    .orderBy(battles.round, battles.id);

    // Group battles by round
    const rounds = tournamentBattles.reduce<Record<number, any[]>>((acc, battle) => {
      if (!acc[battle.round]) {
        acc[battle.round] = [];
      }
      acc[battle.round].push(battle);
      return acc;
    }, {});

    // Convert to array format
    const bracketRounds = Object.entries(rounds).map(([round, matches]) => ({
      round: parseInt(round),
      matches,
    }));

    return NextResponse.json(bracketRounds);
  } catch (error) {
    console.error('Error fetching brackets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brackets' },
      { status: 500 }
    );
  }
} 