import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const PRIVATE_KEY = process.env.MINTING_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  throw new Error('Missing MINTING_PRIVATE_KEY environment variable');
}

const wallet = new ethers.Wallet(PRIVATE_KEY);

export async function POST(request: Request) {
  try {
    const { tokenURI } = await request.json();

    // Create the message hash
    const messageHash = ethers.keccak256(
      ethers.toUtf8Bytes(tokenURI)
    );

    // Sign the hash
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    return NextResponse.json({ signature });
  } catch (error) {
    console.error('Error signing mint request:', error);
    return NextResponse.json(
      { error: 'Failed to sign mint request' },
      { status: 500 }
    );
  }
} 