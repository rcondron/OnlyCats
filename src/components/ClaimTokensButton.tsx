'use client';

import { useState } from 'react';
import { usePublicClient, useWriteContract } from 'wagmi';
import { WARRIOR_CATS_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';

interface ClaimTokensButtonProps {
  tokenId: string,
  className: any,
  onClaim: (tokenId: string) => void;
  children: any;
}
export default function ClaimTokensButton({ tokenId, className, onClaim }: ClaimTokensButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient()!;

  const handleClaim = async () => {
    try {
      setIsLoading(true);

      const tx = await writeContractAsync({
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'claimTokens',
        args: [BigInt(tokenId)],
      });

      const receipt = await publicClient?.waitForTransactionReceipt({ hash: tx })

      if (!tx || receipt?.status != "success") {
        throw new Error('Unable to process revival transaction');
      }

      onClaim(tokenId);

      alert('Claimed succesfully!');

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