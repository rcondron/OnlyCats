'use client';

import { useState, useEffect, use } from 'react';
import { useReadContract } from 'wagmi';
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
    lifetimeRewards: string;
    battles: Array<{
      roundId: string;
      timestamp: number;
      winnerId: number;
      loserId: number;
      reward: string;
      isChamp: boolean;
    }>;
  };
}

interface PageProps {
  params: Promise<{ tokenId: string }>;
}

export default function CatProfile({ params }: PageProps) {
  const { tokenId } = use(params);
  const [profile, setProfile] = useState<CatProfile | null>(null);
  const tokenIdBigInt = BigInt(tokenId);

  // Only fetch metadata from blockchain
  const { data: tokenUri } = useReadContract({
    address: WARRIOR_CATS_ADDRESS,
    abi: warriorCatsABI,
    functionName: 'tokenURI',
    args: [tokenIdBigInt],
  });

  // Add error state
  const [error, setError] = useState<string | null>(null);

  // Update the useEffect to handle errors better
  useEffect(() => {
    async function loadProfile() {
      try {
        if (!tokenUri) return;

        // Fetch metadata from IPFS
        const uri = tokenUri as string;
        const url = uri?.startsWith('ipfs://')
          ? `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`
          : uri;
        
        const metadataResponse = await fetch(url);
        if (!metadataResponse.ok) {
          throw new Error('Failed to fetch metadata');
        }
        
        const metadata = await metadataResponse.json();
        if (metadata.image.startsWith('ipfs://')) {
          metadata.image = `https://ipfs.io/ipfs/${metadata.image.replace('ipfs://', '')}`;
        }

        // Fetch battle data from our API
        console.log('Fetching battle data for cat:', tokenId);
        const battleResponse = await fetch(`/api/cats/${tokenId}`);
        
        if (!battleResponse.ok) {
          const errorData = await battleResponse.json().catch(() => ({ error: 'Failed to fetch battle data' }));
          console.error('Battle data fetch failed:', battleResponse.status, errorData);
          throw new Error(errorData.error || `Failed to fetch battle data: ${battleResponse.status}`);
        }
        
        let battleData;
        try {
          battleData = await battleResponse.json();
        } catch (error) {
          console.error('Failed to parse battle data:', error);
          battleData = { stats: {}, battles: [] };
        }

        if (!battleData || typeof battleData !== 'object') {
          console.error('Invalid battle data format:', battleData);
          battleData = { stats: {}, battles: [] };
        }

        setProfile({
          tokenId: tokenIdBigInt,
          metadata,
          stats: {
            wins: battleData?.stats?.wins || 0,
            losses: battleData?.stats?.losses || 0,
            championCount: battleData?.stats?.championCount || 0,
            lifetimeRewards: battleData?.stats?.lifetimeRewards || '0',
            battles: Array.isArray(battleData?.battles) ? battleData.battles : []
          }
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        setError(error instanceof Error ? error.message : 'Failed to load profile');
      }
    }

    loadProfile();
  }, [tokenUri, tokenId, tokenIdBigInt]);

  // Add error state display
  if (error) return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black p-4">
        <div className="max-w-7xl mx-auto text-center py-12">
          <p className="text-xl text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setProfile(null);
              loadProfile();
            }}
            className="px-4 py-2 rounded-lg bg-purple-500/10 
              text-purple-400 hover:bg-purple-500/20 transition-colors
              border border-purple-500/20 hover:border-purple-500/30"
          >
            Try Again
          </button>
        </div>
      </main>
    </>
  );

  if (!profile) return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black p-4">
        <div className="max-w-7xl mx-auto text-center py-12">
          <div className="animate-spin text-4xl mb-4">🌟</div>
          <p className="text-xl text-white/70">Loading warrior cat profile...</p>
        </div>
      </main>
    </>
  );

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
                      {profile.stats.lifetimeRewards && profile.stats.lifetimeRewards !== '0'
                        ? `${Number(formatEther(BigInt(profile.stats.lifetimeRewards))).toFixed(3)} MOR`
                        : '0.000 MOR'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Battle History */}
          <div className="mt-6">
            <h2 className="text-xl font-bold text-purple-300 mb-4">Battle History</h2>
            {profile?.stats?.battles?.length ? (
              <BattleHistory battles={profile.stats.battles} tokenId={tokenId} />
            ) : (
              <div className="text-center text-purple-300/70 py-8">
                No battles found for this warrior cat
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

// First, define the BattleCard component
const BattleCard = ({ battle, tokenId }: { battle: any, tokenId: string }) => (
  <div className="bg-purple-500/5 p-3 rounded-lg border border-purple-500/20 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="text-[10px] text-white/30">
        #{battle.roundId}
      </div>
      <div className={battle.winnerId === Number(tokenId) ? 'text-emerald-400' : 'text-red-400'}>
        {battle.winnerId === Number(tokenId) ? 'Won vs' : 'Lost to'} #
        {battle.winnerId === Number(tokenId) ? battle.loserId : battle.winnerId}
        {battle.isChamp && <span className="ml-2">🏆</span>}
      </div>
      <div className="text-purple-300/70">
        {battle.reward && battle.reward !== '0'
          ? `+${Number(formatEther(BigInt(battle.reward))).toFixed(3)} MOR`
          : '+0.000 MOR'
        }
      </div>
    </div>
    <div className="text-sm text-purple-300/70">
      {new Date(battle.timestamp).toLocaleString(undefined, {
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

// Then update the battle history section to use the BattleHistory component
const BattleHistory = ({ battles, tokenId }: { battles: any[], tokenId: string }) => {
  // Group battles by tournament (YYMMDDHH)
  const groupedBattles = battles.reduce((acc, battle) => {
    const tournamentId = battle.roundId.toString().slice(0, 8); // YYMMDDHH
    if (!acc[tournamentId]) {
      acc[tournamentId] = [];
    }
    acc[tournamentId].push(battle);
    return acc;
  }, {} as Record<string, typeof battles>);

  // Convert to array and sort by tournament ID (descending)
  const sortedTournaments = Object.entries(groupedBattles)
    // Sort tournaments by date/hour descending
    .sort(([tournamentA], [tournamentB]) => {
      const timeA = parseInt(tournamentA);
      const timeB = parseInt(tournamentB);
      return timeB - timeA;
    })
    .map(([tournamentId, battles]) => [
      tournamentId,
      // Sort battles within each tournament by battle ID ascending
      battles.sort((a, b) => a.roundId.localeCompare(b.roundId))
    ]);

  return (
    <div className="space-y-4">
      {sortedTournaments.map(([tournamentId, tournamentBattles], index) => (
        <div key={tournamentId}>
          {index > 0 && <div className="border-t border-purple-500/20 my-4" />}
          <div className="space-y-2">
            {tournamentBattles.map(battle => (
              <BattleCard key={battle.roundId} battle={battle} tokenId={tokenId} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}; 