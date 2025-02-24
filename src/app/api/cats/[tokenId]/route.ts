import { db } from '@/lib/db';
import { battles } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { tokenId: string } }
) {
  try {
    if (!params?.tokenId) {
      return NextResponse.json({ error: 'No token ID provided' }, { status: 400 });
    }

    const tokenId = parseInt(params.tokenId);
    if (isNaN(tokenId)) {
      return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
    }

    // Get all battles where this cat was either winner or loser
    const catBattles = await db
      .select({
        Id: battles.Id,
        Timestamp: battles.Timestamp,
        WinnerId: battles.WinnerId,
        LoserId: battles.LoserId,
        Reward: battles.Reward,
        IsChamp: battles.IsChamp,
      })
      .from(battles)
      .where(or(
        eq(battles.WinnerId, tokenId), 
        eq(battles.LoserId, tokenId)
      ))
      .orderBy(battles.Timestamp, 'desc');

    // Calculate stats
    const stats = catBattles.reduce((acc, battle) => {
      if (battle.WinnerId === tokenId) {
        acc.wins++;
        if (battle.IsChamp === 1) acc.championCount++;
      } else {
        acc.losses++;
      }
      // Convert Wei to string to preserve full number
      const rewardInWei = BigInt(Math.floor(Number(battle.Reward || 0) * 1e18)).toString();
      acc.lifetimeRewards = (BigInt(acc.lifetimeRewards) + BigInt(rewardInWei)).toString();
      return acc;
    }, {
      wins: 0,
      losses: 0,
      championCount: 0,
      lifetimeRewards: '0'
    });

    // Format battles for display with Wei values
    const formattedBattles = catBattles
      .sort((a, b) => {
        // First sort by date (most recent first)
        const dateA = Math.floor(a.Id / 1000000000000);  // Get YYMMDD
        const dateB = Math.floor(b.Id / 1000000000000);
        if (dateB !== dateA) return dateB - dateA;

        // Then sort by hour (latest first)
        const hourA = Math.floor((a.Id % 1000000000000) / 10000000000);  // Get HH
        const hourB = Math.floor((b.Id % 1000000000000) / 10000000000);
        if (hourB !== hourA) return hourB - hourA;

        // Finally sort by match number (highest first)
        const matchA = a.Id % 1000000;  // Get last 6 digits
        const matchB = b.Id % 1000000;
        return matchB - matchA;
      })
      .map(battle => ({
        roundId: battle.Id.toString(),
        timestamp: battle.Timestamp * 1000,
        winnerId: battle.WinnerId,
        loserId: battle.LoserId,
        reward: BigInt(Math.floor(Number(battle.Reward || 0) * 1e18)).toString(),
        isChamp: battle.IsChamp === 1
      }));

    const response = {
      stats,
      battles: formattedBattles
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in cats API:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch cat data',
        stats: { wins: 0, losses: 0, championCount: 0, lifetimeRewards: 0 },
        battles: []
      }, 
      { status: 500 }
    );
  }
} 