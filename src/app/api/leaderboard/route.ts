import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { battles } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const leaderboard = await db
      .select({
        catId: battles.winnerId,
        wins: sql<number>`count(*)`.as('wins'),
      })
      .from(battles)
      .groupBy(battles.winnerId)
      .orderBy(sql`wins DESC`)
      .limit(10);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
} 