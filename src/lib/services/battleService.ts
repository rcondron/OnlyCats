import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { WARRIOR_CATS_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';
import { useWriteContract } from 'wagmi';
import { type Hash } from 'viem';

// Initialize clients
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
});

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
});

export function useBattleService() {
  const { writeContract } = useWriteContract();

  const updateCatStates = async (
    tokenIds: bigint[],
    newState: 'alive' | 'dead'
  ) => {
    try {
      const stateValue = newState === 'alive' ? 1n : 0n;
      const states = Array(tokenIds.length).fill(stateValue);

      await writeContract({
        address: WARRIOR_CATS_ADDRESS as `0x${string}`,
        abi: warriorCatsABI,
        functionName: 'updateCatStates',
        args: [tokenIds, states] as const,
      });
    } catch (error) {
      console.error('Error updating cat states:', error);
      throw error;
    }
  };

  const distributeTournamentRewards = async (
    tokenIds: bigint[],
    amounts: bigint[]
  ) => {
    try {
      const args = [tokenIds, amounts] as const;
      await writeContract({
        address: WARRIOR_CATS_ADDRESS as `0x${string}`,
        abi: warriorCatsABI,
        functionName: 'addToCatBalances',
        args,
      });
    } catch (error) {
      console.error('Error distributing tournament rewards:', error);
      throw error;
    }
  };

  return {
    updateCatStates,
    distributeTournamentRewards,
  };
}

export async function getCatState(tokenId: number): Promise<string> {
  try {
    const state = await publicClient.readContract({
      address: WARRIOR_CATS_ADDRESS,
      abi: warriorCatsABI,
      functionName: 'getCatState',
      args: [BigInt(tokenId)],
    });

    return state as string;
  } catch (error) {
    throw error;
  }
}

export async function getCatsByState(state: 'alive' | 'dead'): Promise<bigint[]> {
  try {
    const cats = await publicClient.readContract({
      address: WARRIOR_CATS_ADDRESS,
      abi: warriorCatsABI,
      functionName: 'getCatsByState',
      args: [state],
    });

    return cats as bigint[];
  } catch (error) {
    throw error;
  }
} 