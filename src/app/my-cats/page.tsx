'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { WARRIOR_CATS_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';
import { formatEther } from 'viem';

export default function MyCatsPage() {
  const { address } = useAccount();
  const [isReviving, setIsReviving] = useState(false);

  const { data: myCats } = useReadContract({
    address: WARRIOR_CATS_ADDRESS,
    abi: warriorCatsABI,
    functionName: 'getCatsByOwner',
    args: [address as `0x${string}`],
  });

  const { data: catBalances } = useReadContract({
    address: WARRIOR_CATS_ADDRESS,
    abi: warriorCatsABI,
    functionName: 'catBalances',
    args: [myCats?.[0] || 0n],
  });

  const { writeContract } = useWriteContract();

  const handleReviveAll = async () => {
    try {
      setIsReviving(true);
      const hash = await writeContract({
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'reviveAllCats',
      });
      alert(`Transaction sent! Please wait for confirmation.`);
    } catch (error) {
      console.error('Error reviving cats:', error);
      alert('Failed to revive cats. Please try again.');
    } finally {
      setIsReviving(false);
    }
  };

  if (!address) {
    return (
      <div className="my-cats-page">
        <h1>My Cats</h1>
        <p>Please connect your wallet to view your cats.</p>
      </div>
    );
  }

  return (
    <div className="my-cats-page">
      <h1>My Cats</h1>
      <button
        onClick={handleReviveAll}
        disabled={isReviving}
      >
        {isReviving ? 'Reviving...' : 'Revive All'}
      </button>
      <div className="cats-grid">
        {myCats?.map((catId) => (
          <div key={catId.toString()} className="cat-card">
            <h2>Cat #{catId.toString()}</h2>
            <p>Balance: {catBalances ? formatEther(catBalances) : '0'} MOR</p>
          </div>
        ))}
      </div>
    </div>
  );
} 