import { NextResponse } from 'next/server';
import { db, tournaments, cats } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const results = await db.select({
      id: tournaments.id,
      date: tournaments.date,
      winner: {
        id: cats.id,
        name: cats.name,
        imageUrl: cats.imageUrl,
      },
      totalParticipants: tournaments.totalParticipants,
      totalRounds: tournaments.totalRounds,
      bracketData: tournaments.bracketData,
    })
    .from(tournaments)
    .leftJoin(cats, eq(cats.id, tournaments.winnerId))
    .orderBy(desc(tournaments.date))
    .limit(10);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
} 