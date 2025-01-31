'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { WARRIOR_CATS_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';

interface ReviveButtonProps {
  tokenId: string;
  className?: string;
  onSuccess?: () => void;
}

export default function ReviveButton({ tokenId, className = '', onSuccess }: ReviveButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null); // State to track the transaction hash
  const { writeContract } = useWriteContract();

  useWaitForTransactionReceipt({
    hash: transactionHash || undefined, // Pass `undefined` if no hash exists
    enabled: !!transactionHash, // Enable hook only if hash exists
    onSuccess() {
      setIsLoading(false);
      onSuccess?.(); // Trigger the success callback
    },
    onError(error) {
      setIsLoading(false);
      console.error('Revive transaction failed:', error);
      alert('Failed to revive warrior');
    }
  });

  const handleRevive = async () => {
    try {
      setIsLoading(true);

      const response = await writeContract({
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'reviveCat',
        args: [BigInt(tokenId)],
      });

      // Handle different return structures (e.g., { hash } or direct hash)
      const txHash = response?.hash || response; 
      setTransactionHash(txHash);
    } catch (error) {
      console.error('Error reviving cat:', error);
      alert('Failed to revive warrior');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleRevive}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Reviving...' : 'Revive'}
    </button>
  );
}
