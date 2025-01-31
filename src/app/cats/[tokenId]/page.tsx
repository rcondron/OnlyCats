'use client';

import { useState, useEffect } from 'react';
import { useReadContracts } from 'wagmi';
import { WARRIOR_CATS_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';
import Header from '@/components/Header';
import Image from 'next/image';
import { formatEther } from 'viem';

interface CatProfile {
  tokenId: bigint;
  metadata: {
    name: string;
    image: string;
    attributes?: any[];
  };
  stats: {
    wins: number;
    losses: number;
    championCount: number;
    lifetimeRewards: bigint;
    battles: any[];
  };
}

export default function CatProfile({ params }: { params: { tokenId: string } }) {
  const [profile, setProfile] = useState<CatProfile | null>(null);
  const tokenId = BigInt(params.tokenId);

  const { data: catData } = useReadContracts({
    contracts: [
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'tokenURI',
        args: [tokenId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'getBattlesByCat',
        args: [tokenId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'champsByCat',
        args: [tokenId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'lifetimeRewards',
        args: [tokenId],
      },
    ],
  });

  useEffect(() => {
    async function loadProfile() {
      if (!catData?.[0]?.result) return;

      try {
        // Fetch metadata
        const uri = catData[0].result as string;
        const url = uri.startsWith('ipfs://')
          ? `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`
          : uri;
        const response = await fetch(url);
        const metadata = await response.json();

        // Convert IPFS image URL
        if (metadata.image.startsWith('ipfs://')) {
          metadata.image = `https://ipfs.io/ipfs/${metadata.image.replace('ipfs://', '')}`;
        }

        // Calculate stats
        const battles = catData[1].result as any[] || [];
        let wins = 0;
        let losses = 0;
        battles.forEach((battle: any) => {
          if (battle.winnerId === tokenId) wins++;
          if (battle.loserId === tokenId) losses++;
        });

        setProfile({
          tokenId,
          metadata,
          stats: {
            wins,
            losses,
            championCount: Number(catData[2].result || 0n),
            lifetimeRewards: catData[3].result as bigint || 0n,
            battles: battles.sort((a, b) => Number(b.roundId - a.roundId)),
          },
        });
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    }

    loadProfile();
  }, [catData, tokenId]);

  if (!profile) return <div>Loading...</div>;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black p-4">
        <div className="max-w-7xl mx-auto">
          {/* Profile Header */}
          <div className="bg-purple-500/5 rounded-lg p-6 backdrop-blur-sm border border-purple-500/20">
            <div className="flex items-start gap-6">
              {/* Cat Image */}
              <div className="relative w-48 h-48 rounded-lg overflow-hidden border-2 border-purple-500/30">
                <Image
                  src={profile.metadata.image}
                  alt={profile.metadata.name}
                  fill
                  className="object-cover"
                  sizes="192px"
                />
              </div>

              {/* Cat Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-purple-300 mb-2">
                  {profile.metadata.name} #{profile.tokenId.toString()}
                </h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-purple-500/5 p-3 rounded-lg border border-purple-500/20">
                    <div className="text-sm text-purple-300/70">Wins</div>
                    <div className="text-xl text-emerald-400">{profile.stats.wins}</div>
                  </div>
                  <div className="bg-purple-500/5 p-3 rounded-lg border border-purple-500/20">
                    <div className="text-sm text-purple-300/70">Losses</div>
                    <div className="text-xl text-red-400">{profile.stats.losses}</div>
                  </div>
                  <div className="bg-purple-500/5 p-3 rounded-lg border border-purple-500/20">
                    <div className="text-sm text-purple-300/70">Championships</div>
                    <div className="text-xl text-yellow-400">{profile.stats.championCount} 🏆</div>
                  </div>
                  <div className="bg-purple-500/5 p-3 rounded-lg border border-purple-500/20">
                    <div className="text-sm text-purple-300/70">Earnings</div>
                    <div className="text-xl text-purple-400">
                      {Number(formatEther(profile.stats.lifetimeRewards)).toFixed(1)} MOR
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Battle History */}
          <div className="mt-6">
            <h2 className="text-xl font-bold text-purple-300 mb-4">Battle History</h2>
            <div className="space-y-2">
              {profile.stats.battles.map((battle) => {
                // Extract timestamp from roundId (first 8 digits represent Unix timestamp in hours)
                const roundIdStr = battle.roundId.toString().padStart(12, '0');
                const hourTimestamp = parseInt(roundIdStr.slice(0, 8), 10) * 3600; // Convert hours to seconds
                const battleDate = new Date(hourTimestamp * 1000); // Convert seconds to milliseconds

                return (
                  <div 
                    key={battle.roundId.toString()} 
                    className="bg-purple-500/5 p-3 rounded-lg border border-purple-500/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className={battle.winnerId === tokenId ? 'text-emerald-400' : 'text-red-400'}>
                        {battle.winnerId === tokenId ? 'Won vs' : 'Lost to'} #{battle.winnerId === tokenId ? battle.loserId.toString() : battle.winnerId.toString()}
                      </div>
                    </div>
                    <div className="text-sm text-purple-300/70">
                      {battleDate.toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 