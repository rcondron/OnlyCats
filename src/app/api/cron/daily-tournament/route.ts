import { NextResponse } from 'next/server';
import { runDailyTournament } from '@/lib/services/battleSystem';
import { parseEther } from 'viem';
import { db } from '@/lib/db';
import { battles } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { WARRIOR_CATS_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';

const REWARD_PER_WIN = parseEther('10'); // 10 MOR tokens per win
const TOURNAMENT_WINNER_BONUS = parseEther('100'); // 100 MOR tokens for tournament winner

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Run the daily tournament
    const tournamentResult = await runDailyTournament();
    
    if (!tournamentResult) {
      return NextResponse.json({ error: 'No tournament result' }, { status: 400 });
    }

    // Get all battles for this tournament
    const tournamentBattles = await db
      .select()
      .from(battles)
      .where(
        sql`DATE(${battles.timestamp}) = DATE(${tournamentResult.tournamentDate})`
      );

    // Calculate rewards for each participant
    const rewards = new Map<number, bigint>();
    tournamentBattles.forEach(battle => {
      const currentReward = rewards.get(Number(battle.winnerId)) || BigInt(0);
      rewards.set(Number(battle.winnerId), currentReward + REWARD_PER_WIN);
    });

    // Add bonus for tournament winner
    const winnerReward = rewards.get(tournamentResult.winner.id) || BigInt(0);
    rewards.set(tournamentResult.winner.id, winnerReward + TOURNAMENT_WINNER_BONUS);

    // Convert rewards map to arrays for contract call
    const tokenIds = Array.from(rewards.keys());
    const amounts = Array.from(rewards.values());

    // Create a public client for reading contract state
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    // Read current cat states
    const catStates = await Promise.all(
      tokenIds.map(id =>
        client.readContract({
          address: WARRIOR_CATS_ADDRESS,
          abi: warriorCatsABI,
          functionName: 'getCatState',
          args: [BigInt(id)],
        })
      )
    );

    // Return the tournament results and reward data
    return NextResponse.json({
      success: true,
      tournamentDate: tournamentResult.tournamentDate,
      totalParticipants: tournamentResult.totalParticipants,
      totalRounds: tournamentResult.totalRounds,
      rewards: tokenIds.map((id, i) => ({
        tokenId: id,
        amount: amounts[i].toString(),
        state: Number(catStates[i]),
      })),
    });
  } catch (error) {
    console.error('Error in daily tournament:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 