import { ethers } from 'ethers';
import { WARRIOR_CATS_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';

export async function distributeRewards(
  winners: { id: string; amount: number }[],
  provider: ethers.Provider
) {
  try {
    const contract = new ethers.Contract(
      WARRIOR_CATS_ADDRESS,
      warriorCatsABI,
      provider
    );

    // Convert amounts to wei
    const winnerIds = winners.map(w => w.id);
    const amounts = winners.map(w => ethers.parseEther(w.amount.toString()));

    // Call the contract's reward distribution function
    const tx = await contract.distributeRewards(winnerIds, amounts);
    await tx.wait();

    return {
      success: true,
      transactionHash: tx.hash
    };
  } catch (error) {
    console.error('Error distributing rewards:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 