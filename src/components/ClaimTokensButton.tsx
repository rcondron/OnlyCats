'use client';

import React from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { WARRIOR_CATS_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';

interface ClaimTokensButtonProps {
  tokenId: string;
  className?: string;
}

export default function ClaimTokensButton({ tokenId, className = '' }: ClaimTokensButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { writeContract, data: hash } = useWriteContract();

  const { isLoading: isClaiming } = useWaitForTransactionReceipt({
    hash,
    onSuccess() {
      setIsLoading(false);
      // Optionally show success message
      alert('Tokens successfully claimed!');
      // Refresh the page to show updated balance
      window.location.reload();
    },
  });

  const handleClaim = async () => {
    try {
      setIsLoading(true);
      await writeContract({
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'claimTokens',
        args: [BigInt(tokenId)],
      });
    } catch (error) {
      console.error('Error claiming tokens:', error);
      alert('Failed to claim tokens');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClaim}
      disabled={isLoading || isClaiming}
      className={`${className} ${isLoading || isClaiming ? 'opacity-50' : ''}`}
    >
      {isLoading || isClaiming ? 'Claiming...' : 'Claim'}
    </button>
  );
} 