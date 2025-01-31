'use client';

import { useState, useEffect } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { WARRIOR_CATS_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';
import Header from '@/components/Header';
import Image from 'next/image';
import { formatEther } from 'viem';
import Link from 'next/link';

interface Battle {
  roundId: bigint;
  winnerId: bigint;
  loserId: bigint;
}

interface CatMetadata {
  name: string;
  image: string;
}

interface CatStats {
  wins: number;
  losses: number;
  championCount: number;
  lifetimeRewards: bigint;
}

interface BracketMatch extends Battle {
  hour: number;
  bracketRound: number;
  matchIndex: number;
  winnerMetadata?: CatMetadata;
  loserMetadata?: CatMetadata;
  winnerStats?: CatStats;
  loserStats?: CatStats;
}

interface Tournament {
  hour: number;
  matches: BracketMatch[];
}

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%234B5563'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

const fetchMetadata = async (uri: string | undefined): Promise<CatMetadata> => {
  try {
    if (!uri) {
      throw new Error('No URI provided');
    }

    const url = uri.startsWith('ipfs://')
      ? `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`
      : uri;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const metadata = await response.json();
    if (!metadata.image) {
      throw new Error('No image in metadata');
    }
    
    const imageUrl = metadata.image.startsWith('ipfs://')
      ? `https://ipfs.io/ipfs/${metadata.image.replace('ipfs://', '')}`
      : metadata.image;

    return {
      name: metadata.name || 'Unknown Cat',
      image: imageUrl
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return {
      name: 'Unknown Cat',
      image: PLACEHOLDER_IMAGE
    };
  }
};

export default function Brackets() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get selected date at 00:00:00 GMT
  const startOfDay = new Date(selectedDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const dayTimestamp = BigInt(Math.floor(startOfDay.getTime() / 1000));

  // Fetch battles for selected date
  const { data: battles, refetch: refetchBattles } = useReadContract({
    address: WARRIOR_CATS_ADDRESS,
    abi: warriorCatsABI,
    functionName: 'getBattlesByDate',
    args: [dayTimestamp],
  });

  // Add contract reads for cat URIs
  const { data: catData, refetch: refetchCatData } = useReadContracts({
    contracts: battles?.flatMap((battle: Battle) => [
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'tokenURI',
        args: [battle.winnerId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'tokenURI',
        args: [battle.loserId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'getBattlesByCat',
        args: [battle.winnerId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'champsByCat',
        args: [battle.winnerId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'lifetimeRewards',
        args: [battle.winnerId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'getBattlesByCat',
        args: [battle.loserId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'champsByCat',
        args: [battle.loserId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'lifetimeRewards',
        args: [battle.loserId],
      },
    ]) ?? [],
  });

  // Handle date change
  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
    setIsLoading(true);
    
    // Refetch data for new date
    await Promise.all([
      refetchBattles(),
      refetchCatData()
    ]);
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (!battles || !catData) {
      setIsLoading(false);
      return;
    }

    async function processBattles() {
      try {
        const hourlyBattles = new Map<number, BracketMatch[]>();

        for (let i = 0; i < battles.length; i++) {
          const battle = battles[i];
          const dataIndex = i * 8;
          
          // Parse roundId once at the start
          const roundIdStr = battle.roundId.toString().padStart(12, '0');
          const hour = parseInt(roundIdStr.slice(0, 2));
          const bracketRound = parseInt(roundIdStr.slice(2, 4));
          const matchIndex = parseInt(roundIdStr.slice(4));
          
          // Debug logging for Round 1
          /*if (bracketRound === 1) {
            console.log('Processing Round 1 Battle:', {
              roundId: roundIdStr,
              winnerId: battle.winnerId.toString(),
              loserId: battle.loserId.toString(),
              dataIndex,
              winnerUri: catData[dataIndex]?.result,
              loserUri: catData[dataIndex + 1]?.result
            });
          }*/

          // Process metadata sequentially to avoid race conditions
          const winnerMetadata = await fetchMetadata(catData[dataIndex]?.result);
          const loserMetadata = await fetchMetadata(catData[dataIndex + 1]?.result);

          // Get stats data
          const winnerBattles = catData?.[dataIndex + 2]?.result || [];
          const winnerChampCount = Number(catData?.[dataIndex + 3]?.result || 0n);
          const winnerRewards = catData?.[dataIndex + 4]?.result || 0n;
          
          const loserBattles = catData?.[dataIndex + 5]?.result || [];
          const loserChampCount = Number(catData?.[dataIndex + 6]?.result || 0n);
          const loserRewards = catData?.[dataIndex + 7]?.result || 0n;

          // Calculate wins and losses
          const calculateStats = (battles: any[], catId: bigint) => {
            let wins = 0;
            let losses = 0;
            if (Array.isArray(battles)) {
              battles.forEach((b: any) => {
                if (b.winnerId === catId) wins++;
                if (b.loserId === catId) losses++;
              });
            }
            return { wins, losses };
          };

          const winnerStats = calculateStats(winnerBattles, battle.winnerId);
          const loserStats = calculateStats(loserBattles, battle.loserId);

          const bracketMatch: BracketMatch = {
            ...battle,
            hour,
            bracketRound,
            matchIndex,
            winnerMetadata,
            loserMetadata,
            winnerStats: {
              ...winnerStats,
              championCount: winnerChampCount,
              lifetimeRewards: winnerRewards
            },
            loserStats: {
              ...loserStats,
              championCount: loserChampCount,
              lifetimeRewards: loserRewards
            }
          };

          const hourBattles = hourlyBattles.get(hour) || [];
          hourBattles.push(bracketMatch);
          hourlyBattles.set(hour, hourBattles);
        }

        // Sort and set tournaments
        const sortedTournaments = Array.from(hourlyBattles.entries())
          .map(([hour, matches]) => ({
            hour,
            matches: matches.sort((a, b) => 
              a.bracketRound === b.bracketRound 
                ? a.matchIndex - b.matchIndex 
                : a.bracketRound - b.bracketRound
            )
          }))
          .sort((a, b) => a.hour - b.hour);

        setTournaments(sortedTournaments);
      } catch (error) {
        console.error('Error processing battles:', error);
      } finally {
        setIsLoading(false);
      }
    }

    processBattles();
  }, [battles, catData]);

  // Add debug logging to track Round 1 data
  useEffect(() => {
    if (!battles || !catData) return;

    async function processBattles() {
      const hourlyBattles = new Map<number, BracketMatch[]>();

      for (let i = 0; i < battles.length; i++) {
        const battle = battles[i];
        const dataIndex = i * 8;
        
        // Debug logging
        const roundIdStr = battle.roundId.toString().padStart(12, '0');
        const bracketRound = parseInt(roundIdStr.slice(2, 4));
        
       /* if (bracketRound === 1) {
          console.log('Round 1 Battle:', {
            roundId: roundIdStr,
            winnerId: battle.winnerId.toString(),
            loserId: battle.loserId.toString(),
            winnerUri: catData?.[dataIndex]?.result,
            loserUri: catData?.[dataIndex + 1]?.result,
          });
        }*/

        // ... rest of the processing ...
      }

      // Debug logging for processed tournaments
      /*console.log('Processed Tournaments:', 
        Array.from(hourlyBattles.entries()).map(([hour, matches]) => ({
          hour,
          round1Matches: matches.filter(m => m.bracketRound === 1).length,
          totalMatches: matches.length
        }))
      );*/

      // ... rest of the function ...
    }

    processBattles();
  }, [battles, catData]);

  // Add error boundary for image loading
  const ImageWithFallback = ({ 
    src, 
    alt, 
    priority = false,
    ...props 
  }: { 
    src: string; 
    alt: string; 
    priority?: boolean;
    [key: string]: any;
  }) => {
    const [error, setError] = useState(false);

    useEffect(() => {
      setError(false);
    }, [src]);

    if (error || !src) {
      return (
        <Image
          src={PLACEHOLDER_IMAGE}
          alt={alt}
          unoptimized
          {...props}
        />
      );
    }

    return (
      <Image
        src={src}
        alt={alt}
        onError={() => setError(true)}
        priority={priority}
        {...props}
      />
    );
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black p-4">
        <div className="max-w-[1920px] mx-auto">
          {/* Date Selector */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-cinzel font-bold text-purple-300">
              Daily Tournaments
            </h1>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={handleDateChange}
              className="px-3 py-1 rounded-lg bg-purple-500/5 
                text-white/90 border border-purple-500/20
                focus:outline-none focus:border-purple-500/40
                text-sm [color-scheme:light]"
              style={{
                colorScheme: 'light'
              }}
            />
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center text-purple-300/70 py-12">
              Loading tournaments...
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center text-purple-300/70 py-12">
              No tournaments found for this date
            </div>
          ) : (
            // Tournament Grid
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tournaments.map((tournament) => (
                <div key={tournament.hour} className="bg-purple-500/5 rounded-lg backdrop-blur-sm border border-purple-500/10">
                  {/* Tournament Header */}
                  <div className="p-2 border-b border-purple-500/20">
                    <h2 className="text-lg font-medium text-center text-purple-300">
                      {tournament.hour.toString().padStart(2, '0')}:00 UTC
                    </h2>
                  </div>

                  {/* Rounds */}
                  <div className="p-3 space-y-3">
                    {Array.from(new Set(tournament.matches.map(m => m.bracketRound)))
                      .sort((a, b) => a - b)
                      .map((round) => {
                        const roundMatches = tournament.matches
                          .filter(match => match.bracketRound === round)
                          .sort((a, b) => a.matchIndex - b.matchIndex);

                        return (
                          <div key={round} className="relative">
                            {/* Round Label */}
                            <div className="text-xs font-medium text-purple-300/70 mb-2 pb-1 border-b border-purple-500/10">
                              Round {round.toString().padStart(2, '0')}
                            </div>

                            {/* Matches */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {roundMatches.map((match) => (
                                <div 
                                  key={`${match.hour}-${match.bracketRound}-${match.matchIndex}`}
                                  className="relative w-full h-[160px] group perspective"
                                >
                                  {/* Front Card */}
                                  <div className="absolute inset-0 rounded-md p-2
                                    bg-purple-500/5 border border-purple-500/20
                                    transition-all duration-500 ease-out
                                    flex flex-col preserve-3d backface-hidden
                                    group-hover:[transform:rotateY(180deg)]"
                                  >
                                    {/* Match Number */}
                                    <div className="text-[10px] text-white/30">
                                      Match #{Number(match.matchIndex)}
                                    </div>

                                    {/* Compact Winner */}
                                    <div className="flex items-center gap-2 mt-1">
                                      <Link 
                                        href={`/cats/${match.winnerId.toString()}`}
                                        className="relative w-12 h-12 shrink-0 rounded overflow-hidden border border-emerald-500/30"
                                      >
                                        <ImageWithFallback
                                          src={match.winnerMetadata?.image || PLACEHOLDER_IMAGE}
                                          alt={match.winnerMetadata?.name || 'Unknown Cat'}
                                          fill
                                          sizes="48px"
                                          className="object-cover"
                                          priority={match.bracketRound === 1}
                                        />
                                      </Link>
                                      <div className="min-w-0">
                                        <div className="text-[10px] text-emerald-400/70">Winner</div>
                                        <div className="text-xs text-emerald-400 truncate">
                                          #{match.winnerId.toString()}
                                        </div>
                                        <div className="text-[10px] text-emerald-400/50 truncate">
                                          {match.winnerMetadata?.name}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Compact Loser */}
                                    <div className="flex items-center gap-2 mt-2">
                                      <Link 
                                        href={`/cats/${match.loserId.toString()}`}
                                        className="relative w-12 h-12 shrink-0 rounded overflow-hidden border border-red-500/30"
                                      >
                                        <ImageWithFallback
                                          src={match.loserMetadata?.image || PLACEHOLDER_IMAGE}
                                          alt={match.loserMetadata?.name || 'Unknown Cat'}
                                          fill
                                          sizes="48px"
                                          className="object-cover"
                                          priority={match.bracketRound === 1}
                                        />
                                      </Link>
                                      <div className="min-w-0">
                                        <div className="text-[10px] text-red-400/70">Loser</div>
                                        <div className="text-xs text-red-400 truncate">
                                          #{match.loserId.toString()}
                                        </div>
                                        <div className="text-[10px] text-red-400/50 truncate">
                                          {match.loserMetadata?.name}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Back Card - Stats with Images */}
                                  <div className="absolute inset-0 rounded-md p-2
                                    bg-purple-500/5 border border-purple-500/20
                                    transition-all duration-500 ease-out
                                    flex flex-col preserve-3d backface-hidden [transform:rotateY(-180deg)]
                                    group-hover:[transform:rotateY(0deg)] text-[10px]"
                                  >
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-1 h-full">
                                      {/* Winner Stats */}
                                      <div className="space-y-1 border-r border-purple-500/20 pr-1">
                                        <div className="flex items-center gap-1 pb-1 border-b border-purple-500/10">
                                          <Link 
                                            href={`/cats/${match.winnerId.toString()}`}
                                            className="relative w-8 h-8 shrink-0 rounded overflow-hidden border border-emerald-500/30"
                                          >
                                            <ImageWithFallback
                                              src={match.winnerMetadata?.image || PLACEHOLDER_IMAGE}
                                              alt={match.winnerMetadata?.name || 'Unknown Cat'}
                                              fill
                                              sizes="32px"
                                              className="object-cover"
                                            />
                                          </Link>
                                          <div className="text-emerald-400 font-medium truncate">
                                            #{match.winnerId.toString()}
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-2">
                                          <div>W: {match.winnerStats?.wins}</div>
                                          <div>L: {match.winnerStats?.losses}</div>
                                          <div>🏆: {match.winnerStats?.championCount}</div>
                                          <div>💰: {Number(formatEther(match.winnerStats?.lifetimeRewards || 0n)).toFixed(1)}</div>
                                        </div>
                                      </div>

                                      {/* Loser Stats */}
                                      <div className="space-y-1 pl-1">
                                        <div className="flex items-center gap-1 pb-1 border-b border-purple-500/10">
                                          <Link 
                                            href={`/cats/${match.loserId.toString()}`}
                                            className="relative w-8 h-8 shrink-0 rounded overflow-hidden border border-red-500/30"
                                          >
                                            <ImageWithFallback
                                              src={match.loserMetadata?.image || PLACEHOLDER_IMAGE}
                                              alt={match.loserMetadata?.name || 'Unknown Cat'}
                                              fill
                                              sizes="32px"
                                              className="object-cover"
                                            />
                                          </Link>
                                          <div className="text-red-400 font-medium truncate">
                                            #{match.loserId.toString()}
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-2">
                                          <div>W: {match.loserStats?.wins}</div>
                                          <div>L: {match.loserStats?.losses}</div>
                                          <div>🏆: {match.loserStats?.championCount}</div>
                                          <div>💰: {Number(formatEther(match.loserStats?.lifetimeRewards || 0n)).toFixed(1)}</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add required CSS */}
      <style jsx global>{`
        .perspective {
          perspective: 2000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        
        /* Date picker icon color */
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.5;
          cursor: pointer;
        }
        
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 0.8;
        }
      `}</style>
    </>
  );
} 