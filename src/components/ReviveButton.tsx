'use client';

import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { WARRIOR_CATS_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';

export default function ReviveButton({ tokenId, className }: { tokenId: string; className?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const { writeContract } = useWriteContract();

  const handleRevive = async () => {
    try {
      setIsLoading(true);
      await writeContract({
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'reviveCat',
        args: [BigInt(tokenId)],
      });
      alert('Transaction sent! Please wait for confirmation.');
    } catch (error) {
      console.error('Error reviving cat:', error);
      alert('Failed to revive cat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleRevive}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Reviving...' : 'Revive Cat'}
    </button>
  );
}
