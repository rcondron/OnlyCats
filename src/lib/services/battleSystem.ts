import { drizzle } from 'drizzle-orm/better-sqlite3';
import { cats, battles, tournaments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { updateCatStates, distributeTournamentRewards } from './battleService';
import { parseEther } from 'viem';

const REWARD_PER_WIN = parseEther('10'); // 10 MOR tokens per win
const TOURNAMENT_WINNER_BONUS = parseEther('100'); // 100 MOR tokens for tournament winner

interface Fighter {
  id: number;
  name: string;
  wins: number;
  losses: number;
  tokenId: string;
  imageUrl: string;
  ipfsHash: string;
  owner: string;
  isActive: boolean;
}

function prepareFighter(cat: typeof cats.$inferSelect): Fighter {
  return {
    id: cat.id,
    name: cat.name,
    wins: cat.wins ?? 0,
    losses: cat.losses ?? 0,
    tokenId: cat.tokenId,
    imageUrl: cat.imageUrl,
    ipfsHash: cat.ipfsHash,
    owner: cat.owner,
    isActive: cat.isActive ?? false,
  };
}

function determineWinner(fighter1: Fighter, fighter2: Fighter): Fighter {
  const f1Ratio = fighter1.wins / (fighter1.wins + fighter1.losses + 1);
  const f2Ratio = fighter2.wins / (fighter2.wins + fighter2.losses + 1);
  
  const f1Score = f1Ratio + Math.random();
  const f2Score = f2Ratio + Math.random();
  
  return f1Score > f2Score ? fighter1 : fighter2;
}

export async function runDailyTournament() {
  try {
    // Get all active cats
    const activeCats = await db.select().from(cats).where(eq(cats.isActive, true));
    if (activeCats.length < 2) {
      console.log('Not enough cats for a tournament');
      return;
    }

    const fighters = activeCats.map(prepareFighter);
    const shuffledFighters = [...fighters].sort(() => Math.random() - 0.5);
    
    const tournamentDate = new Date();
    let round = 1;
    let currentRoundFighters = shuffledFighters;
    const allBattles = [];

    while (currentRoundFighters.length > 1) {
      const nextRound: typeof fighters = [];
      const roundBattles = [];
      
      for (let i = 0; i < currentRoundFighters.length; i += 2) {
        if (i + 1 >= currentRoundFighters.length) {
          nextRound.push(currentRoundFighters[i]);
          continue;
        }

        const fighter1 = currentRoundFighters[i];
        const fighter2 = currentRoundFighters[i + 1];
        
        const winner = determineWinner(fighter1, fighter2);
        const loser = winner.id === fighter1.id ? fighter2 : fighter1;

        roundBattles.push({
          winnerId: winner.id,
          loserId: loser.id,
          tournamentDay: tournamentDate,
          round,
        });

        nextRound.push({
          ...winner,
          wins: winner.wins + 1,
        });
      }

      // Record all battles for this round
      const insertedBattles = await db.insert(battles)
        .values(roundBattles)
        .returning();
      
      allBattles.push(...insertedBattles);

      currentRoundFighters = nextRound;
      round++;
    }

    const winner = currentRoundFighters[0];

    // Record tournament
    const [tournament] = await db.insert(tournaments)
      .values({
        date: tournamentDate,
        winnerId: winner.id,
        totalParticipants: shuffledFighters.length,
        totalRounds: round - 1,
        bracketData: allBattles,
        rewardsDistributed: false,
      })
      .returning();

    // Update contract state
    await updateCatStates(
      [BigInt(winner.id)],
      'alive'
    );

    // Distribute rewards
    const rewards = calculateRewards(allBattles, winner.id);
    await distributeTournamentRewards(
      Array.from(rewards.keys()),
      Array.from(rewards.values())
    );

    // Update tournament rewards status
    await db.update(tournaments)
      .set({ rewardsDistributed: true })
      .where(eq(tournaments.id, tournament.id));

    return {
      winner,
      tournamentDate,
      totalParticipants: shuffledFighters.length,
      totalRounds: round - 1,
    };
  } catch (error) {
    throw error;
  }
}

function calculateRewards(battles: typeof battles.$inferSelect[], winnerId: number): Map<number, bigint> {
  const rewards = new Map<number, bigint>();

  battles.forEach(battle => {
    // Add win reward
    const currentWinnerReward = rewards.get(battle.winnerId) || 0n;
    rewards.set(battle.winnerId, currentWinnerReward + REWARD_PER_WIN);
  });

  // Add tournament winner bonus
  const currentWinnerReward = rewards.get(winnerId) || 0n;
  rewards.set(winnerId, currentWinnerReward + TOURNAMENT_WINNER_BONUS);

  return rewards;
} 