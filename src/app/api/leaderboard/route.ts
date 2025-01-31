import { NextResponse } from 'next/server';
import { db, cats } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Fetch cats with all their stats
    const results = await db.select({
      tokenId: cats.tokenId,
      name: cats.name,
      image: cats.image,
      wins: cats.wins,
      losses: cats.losses,
      championCount: cats.championCount,
      lifetimeRewards: cats.lifetimeRewards,
    })
    .from(cats)
    .where(
      sql`${cats.wins} > 0 OR ${cats.losses} > 0 OR ${cats.championCount} > 0 OR ${cats.lifetimeRewards} > 0`
    )
    .limit(100);

    if (!results.length) {
      return NextResponse.json([]);
    }

    // Transform the data to match our CatLeader interface
    const leaders = results.map(cat => ({
      tokenId: cat.tokenId.toString(),
      metadata: {
        name: cat.name || 'Unknown Cat',
        image: cat.image || '/placeholder-cat.png',
      },
      stats: {
        wins: Number(cat.wins || 0),
        losses: Number(cat.losses || 0),
        championCount: Number(cat.championCount || 0),
        lifetimeRewards: cat.lifetimeRewards?.toString() || '0',
      }
    }));

    return NextResponse.json(leaders);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json([]);
  }
} 