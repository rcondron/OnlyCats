'use client';

import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { WARRIOR_CATS_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';

export default function ClaimTokensButton({ tokenId, className }: { tokenId: string; className?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const handleClaim = async () => {
    try {
      setIsLoading(true);
      const tx = await writeContractAsync({
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'claimTokens',
        args: [BigInt(tokenId)],
      });
      alert('Transaction sent! Please wait for confirmation.');
    } catch (error) {
      console.error('Error claiming tokens:', error);
      alert('Failed to claim tokens. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClaim}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Claiming...' : 'Claim Rewards'}
    </button>
  );
} 