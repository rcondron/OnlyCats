import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { WARRIOR_CATS_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';

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

export async function updateCatStates(tokenIds: bigint[], newState: 'alive' | 'dead') {
  try {
    const { request } = await publicClient.simulateContract({
      address: WARRIOR_CATS_ADDRESS,
      abi: warriorCatsABI,
      functionName: 'updateCatStates',
      args: [tokenIds.map(id => BigInt(id)), newState],
      account,
    });

    const hash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return receipt;
  } catch (error) {
    throw error;
  }
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

export async function distributeTournamentRewards(
  tokenIds: number[],
  amounts: bigint[]
) {
  try {
    const { request } = await publicClient.simulateContract({
      address: WARRIOR_CATS_ADDRESS,
      abi: warriorCatsABI,
      functionName: 'addToCatBalances',
      args: [tokenIds.map(id => BigInt(id)), amounts],
      account,
    });

    const hash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return receipt;
  } catch (error) {
    throw error;
  }
} 