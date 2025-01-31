import { NextResponse } from 'next/server';
import { WARRIOR_CATS_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export async function GET(
  request: Request,
  { params }: { params: { tokenId: string } }
) {
  try {
    const balance = await client.readContract({
      address: WARRIOR_CATS_ADDRESS,
      abi: warriorCatsABI,
      functionName: 'catBalances',
      args: [BigInt(params.tokenId)],
    });

    return NextResponse.json({ balance: balance.toString() });
  } catch (error) {
    console.error('Error fetching cat balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cat balance' },
      { status: 500 }
    );
  }
} 