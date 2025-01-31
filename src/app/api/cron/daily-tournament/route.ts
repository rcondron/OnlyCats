import { NextResponse } from 'next/server';
import { runDailyTournament } from '@/lib/services/battleSystem';
import { distributeRewards } from '@/lib/services/rewards';
import { ethers } from 'ethers';
import { WARRIOR_CATS_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const tournamentResult = await runDailyTournament();
    
    if (tournamentResult) {
      const rewardResult = await distributeRewards(tournamentResult.tournamentDate);
      
      const contract = new ethers.Contract(WARRIOR_CATS_ADDRESS, warriorCatsABI, wallet);
      const tx = await contract.updateCatStates(
        [tournamentResult.winner.id],
        'alive'
      );
      await tx.wait();

      return NextResponse.json({ 
        winner: tournamentResult.winner,
        rewards: rewardResult,
      });
    }

    return NextResponse.json({ message: 'No tournament today' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Tournament failed' },
      { status: 500 }
    );
  }
} 