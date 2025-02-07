import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { battles } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { tokenId: string } }
) {
  try {
    const tokenId = params.tokenId;

    // Get all battles where this cat was either winner or loser
    const catBattles = await db
      .select()
      .from(battles)
      .where(
        or(
          eq(battles.winnerId, tokenId),
          eq(battles.loserId, tokenId)
        )
      )
      .orderBy(battles.timestamp);

    // Calculate stats
    const stats = {
      wins: catBattles.filter(b => b.winnerId === tokenId).length,
      losses: catBattles.filter(b => b.loserId === tokenId).length,
      totalBattles: catBattles.length,
      recentBattles: catBattles.slice(-5),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error(`Error fetching cat state for token ${params.tokenId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch cat state' },
      { status: 500 }
    );
  }
} 