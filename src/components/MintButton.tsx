'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract } from 'wagmi';
import { WARRIOR_CATS_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';
import confetti from 'canvas-confetti';

interface MintButtonProps {
  imageUrl: string;
  name: string;
  onSuccess: (tokenId: string) => void;
  className?: string;
}

export default function MintButton({ imageUrl, name, onSuccess, className = '' }: MintButtonProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = React.useState(false);

  const { writeContract } = useWriteContract();

  const handleMint = async () => {
    if (!address) return;
    
    try {
      setIsLoading(true);

      const response = await fetch('/api/prepare-mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to prepare mint');
      }

      const { tokenUri, signature } = await response.json();

      await writeContract({
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'mintCat',
        args: [tokenUri, signature],
      });

      // Trigger success flow immediately after mint transaction is sent
      const testTokenId = '1'; // You might want to generate this differently
      onSuccess(testTokenId);

      // Create and show success message
      const message = document.createElement('div');
      message.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-[2000]';
      message.innerHTML = `
        <div class="bg-black/80 backdrop-blur-md rounded-xl p-8 shadow-2xl border border-yellow-500/20">
          <div class="text-6xl mb-4">🎉</div>
          <h2 class="text-2xl font-bold mb-2 text-white">Warrior Cat Minted!</h2>
          <p class="text-yellow-400">Your mighty warrior has joined the ranks!</p>
        </div>
      `;
      document.body.appendChild(message);

      // Trigger confetti celebration
      const count = 200;
      const defaults = { origin: { y: 0.7 }, zIndex: 1500 };

      function fire(particleRatio: number, opts: any) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });

      // Delay redirect to show celebration
      setTimeout(() => {
        document.body.removeChild(message);
        router.push('/my-cats');
      }, 3000);

    } catch (error) {
      alert('Failed to mint NFT');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center text-white/50 animate-pulse">
        Connect wallet to mint your warrior
      </div>
    );
  }

  return (
    <button
      onClick={handleMint}
      disabled={isLoading}
      className={`btn-primary ${className}`}
    >
      {isLoading ? 'Minting...' : 'Mint NFT'}
    </button>
  );
} 