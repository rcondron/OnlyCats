import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { battles, cats } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get total battles
    const [battleCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(battles);

    // Get cat with most wins
    const [topWinner] = await db
      .select({
        catId: battles.WinnerId,
        wins: sql<number>`count(*) as wins`
      })
      .from(battles)
      .groupBy(battles.WinnerId)
      .orderBy(sql`wins DESC`)
      .limit(1);

    // Get latest battle timestamp
    const [latestBattle] = await db
      .select({ timestamp: battles.Timestamp })
      .from(battles)
      .orderBy(battles.Timestamp, 'desc')
      .limit(1);

    const stats = {
      totalBattles: battleCount?.count ?? 0,
      mostWins: topWinner ? {
        id: topWinner.catId,
        wins: topWinner.wins
      } : null,
      lastTournament: latestBattle ? new Date(latestBattle.timestamp * 1000).toISOString() : null,
      upcomingTournament: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching tournament stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament stats' },
      { status: 500 }
    );
  }
} 