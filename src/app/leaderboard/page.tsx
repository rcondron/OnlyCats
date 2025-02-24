'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Image from 'next/image';
import Link from 'next/link';
import { formatEther } from 'viem';

interface CatLeader {
  tokenId: bigint;
  metadata: {
    name: string;
    image: string;
  };
  stats: {
    wins: number;
    losses: number;
    championCount: number;
    lifetimeRewards: bigint;
  };
}

interface LeaderCategory {
  title: string;
  icon: string;
  description: string;
  getValue: (cat: CatLeader) => number | string;
  color: string;
}

const CATEGORIES: LeaderCategory[] = [
  {
    title: 'Most Wins',
    icon: '🏆',
    description: 'Most successful warrior',
    getValue: (cat) => cat.stats.wins,
    color: 'emerald'
  },
  {
    title: 'Most Battles',
    icon: '⚔️',
    description: 'Most experienced warrior',
    getValue: (cat) => cat.stats.wins + cat.stats.losses,
    color: 'purple'
  },
  {
    title: 'Most Championships',
    icon: '👑',
    description: 'Tournament champion',
    getValue: (cat) => cat.stats.championCount,
    color: 'yellow'
  },
  {
    title: 'Highest Earnings',
    icon: '💰',
    description: 'Wealthiest warrior',
    getValue: (cat) => Number(formatEther(cat.stats.lifetimeRewards)),
    color: 'pink'
  }
];

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<Record<string, CatLeader[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch leaderboard');
        }

        if (!Array.isArray(data)) {
          console.error('Invalid leaderboard data format:', data);
          throw new Error('Invalid leaderboard data format');
        }

        // Transform data into CatLeader objects
        const transformedData = data.map((cat: any) => ({
          tokenId: BigInt(cat.tokenId),
          metadata: {
            name: cat.metadata?.name || `Warrior Cat #${cat.tokenId}`,
            image: cat.metadata?.image || '',
          },
          stats: {
            wins: cat.stats?.wins || 0,
            losses: cat.stats?.losses || 0,
            championCount: cat.stats?.championCount || 0,
            lifetimeRewards: BigInt(cat.stats?.lifetimeRewards || 0),
          }
        }));

        // Create category-specific leaderboards
        const categoryLeaders: Record<string, CatLeader[]> = {
          'Most Wins': [...transformedData].sort((a, b) => b.stats.wins - a.stats.wins),
          'Most Battles': [...transformedData].sort((a, b) => 
            (b.stats.wins + b.stats.losses) - (a.stats.wins + a.stats.losses)
          ),
          'Most Championships': [...transformedData].sort((a, b) => 
            b.stats.championCount - a.stats.championCount
          ),
          'Highest Earnings': [...transformedData].sort((a, b) => 
            Number(b.stats.lifetimeRewards - a.stats.lifetimeRewards)
          ),
        };

        setLeaders(categoryLeaders);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  // Add loading state
  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black p-4">
          <div className="max-w-7xl mx-auto text-center text-purple-300 mt-8">
            Loading champions...
          </div>
        </main>
      </>
    );
  }

  // Add empty state
  const hasLeaders = Object.values(leaders).some(list => list.length > 0);
  if (!hasLeaders) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black p-4">
          <div className="max-w-7xl mx-auto text-center text-purple-300 mt-8">
            No champions found yet. Check back after some battles!
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-cinzel font-bold text-center text-purple-300 mb-8">
            Hall of Champions
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CATEGORIES.map((category) => (
              <div 
                key={category.title}
                className={`rounded-lg p-4 backdrop-blur-sm ${
                  category.color === 'emerald' ? 'bg-emerald-500/5 border-emerald-500/20' :
                  category.color === 'purple' ? 'bg-purple-500/5 border-purple-500/20' :
                  category.color === 'yellow' ? 'bg-yellow-500/5 border-yellow-500/20' :
                  'bg-pink-500/5 border-pink-500/20'
                } border`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-purple-300">
                      {category.title}
                    </h2>
                    <p className="text-sm text-purple-300/70">
                      {category.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {leaders[category.title]?.slice(0, 3).map((cat, index) => (
                    <div 
                      key={cat.tokenId.toString()}
                      className="flex items-center gap-4 bg-purple-500/5 rounded-lg p-2"
                    >
                      <div className="text-lg font-bold text-purple-300/70 w-6">
                        #{index + 1}
                      </div>
                      <Link 
                        href={`/cats/${cat.tokenId.toString()}`}
                        className="relative w-12 h-12 rounded-lg overflow-hidden border border-purple-500/30"
                      >
                        <Image
                          src={cat.metadata.image}
                          alt={cat.metadata.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-purple-300 truncate">
                          {cat.metadata.name}
                        </div>
                        <div className="text-sm text-purple-300/70">
                          #{cat.tokenId.toString()}
                        </div>
                      </div>
                      <div className={`font-medium ${
                        category.color === 'emerald' ? 'text-emerald-400' :
                        category.color === 'purple' ? 'text-purple-400' :
                        category.color === 'yellow' ? 'text-yellow-400' :
                        'text-pink-400'
                      }`}>
                        {category.getValue(cat).toLocaleString()}
                        {category.title === 'Highest Earnings' ? ' MOR' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
} 