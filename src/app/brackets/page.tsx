'use client';

import { useState, useEffect, useRef } from 'react';
import { useReadContracts } from 'wagmi';
import { WARRIOR_CATS_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';
import Header from '@/components/Header';
import Image from 'next/image';
import Link from 'next/link';
import { formatEther } from 'viem';

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
  matchId: string;
}

interface Tournament {
  hour: number;
  matches: BracketMatch[];
}

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%234B5563'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function Brackets() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    return date;
  });
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Move the contract read to the component level
  const { data: tokenURIs, isLoading: isLoadingURIs } = useReadContracts({
    contracts: Array.from({ length: 1000 }).map((_, i) => ({
      address: WARRIOR_CATS_ADDRESS,
      abi: warriorCatsABI,
      functionName: 'tokenURI',
      args: [BigInt(i + 1)],
    })),
  });

  // Cache metadata to avoid duplicate fetches
  const metadataCache = useRef<Map<number, CatMetadata>>(new Map());

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(event.target.value));
  };

  const fetchMetadata = async (tokenId: number) => {
    try {
      // Check cache first
      if (metadataCache.current.has(tokenId)) {
        return metadataCache.current.get(tokenId);
      }

      const tokenUri = tokenURIs?.[tokenId - 1]?.result;
      if (!tokenUri) return null;

      const url = tokenUri.startsWith('ipfs://')
        ? `https://ipfs.io/ipfs/${tokenUri.replace('ipfs://', '')}`
        : tokenUri;

      const response = await fetch(url);
      const metadata = await response.json();

      if (metadata.image.startsWith('ipfs://')) {
        metadata.image = `https://ipfs.io/ipfs/${metadata.image.replace('ipfs://', '')}`;
      }

      // Cache the result
      metadataCache.current.set(tokenId, metadata);
      return metadata;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  };

  useEffect(() => {
    async function fetchTournaments() {
      setIsLoading(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        console.log('Fetching tournaments for date:', dateStr);

        const response = await fetch(`/api/brackets?date=${dateStr}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch tournaments');
        }

        const data = await response.json();
        console.log('Received tournament data:', data);

        if (!Array.isArray(data)) {
          console.error('Invalid tournament data format:', data);
          setTournaments([]);
          return;
        }

        // Wait for URIs to load before fetching metadata
        if (isLoadingURIs) {
          console.log('Waiting for URIs to load...');
          return;
        }

        // Fetch metadata for each cat
        const tournamentsWithMetadata = await Promise.all(
          data.map(async (tournament: any) => {
            console.log('Processing tournament:', tournament);
            return {
              ...tournament,
              matches: await Promise.all(
                (tournament.matches || []).map(async (match: any) => ({
                  ...match,
                  winnerMetadata: await fetchMetadata(match.winnerId),
                  loserMetadata: await fetchMetadata(match.loserId)
                }))
              )
            };
          })
        );

        console.log('Tournaments with metadata:', tournamentsWithMetadata);
        setTournaments(tournamentsWithMetadata);
      } catch (error) {
        console.error('Error:', error);
        setTournaments([]); // Set empty tournaments on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchTournaments();
  }, [selectedDate, tokenURIs, isLoadingURIs]);

  // Add debug logging to track Round 1 data
  useEffect(() => {
    if (!tournaments.length) return;

    async function processTournaments() {
      const hourlyBattles = new Map<number, BracketMatch[]>();

      for (const tournament of tournaments) {
        for (const match of tournament.matches) {
          const hour = new Date(match.hour * 1000).getUTCHours();
          const hourBattles = hourlyBattles.get(hour) || [];
          hourBattles.push(match);
          hourlyBattles.set(hour, hourBattles);
        }
      }

      // Debug logging for processed tournaments
      console.log('Processed Tournaments:', 
        Array.from(hourlyBattles.entries()).map(([hour, matches]) => ({
          hour,
          round1Matches: matches.filter(m => m.bracketRound === 1).length,
          totalMatches: matches.length
        }))
      );
    }

    processTournaments();
  }, [tournaments]);

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
              className="px-3 py-1 rounded-lg bg-purple-500/5 text-white/90 border border-purple-500/20 focus:outline-none focus:border-purple-500/40"
              style={{
                colorScheme: 'light'
              }}
            />
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin text-4xl mb-4">🌟</div>
              <p className="text-xl text-white/70">Loading tournaments...</p>
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
                                  key={match.matchId}
                                  className="relative w-full h-[160px] group perspective"
                                >
                                  {/* Front Card */}
                                  <div className={`absolute inset-0 rounded-md p-2 
                                    bg-purple-500/5 border border-purple-500/20
                                    transition-all duration-500 ease-out
                                    flex flex-col preserve-3d backface-hidden
                                    group-hover:[transform:rotateY(180deg)]`}
                                  >
                                    {/* Match Number */}
                                    <div className="text-[10px] text-white/30 mb-2">
                                      Match #{match.matchIndex}
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
                                        <Link 
                                          href={`/cats/${match.winnerId.toString()}`}
                                          className="text-xs text-emerald-400 truncate hover:text-emerald-300 transition-colors"
                                        >
                                          #{match.winnerId.toString()}
                                        </Link>
                                        &nbsp;
                                        <Link 
                                          href={`/cats/${match.winnerId.toString()}`}
                                          className="text-[10px] text-emerald-400/50 truncate hover:text-emerald-300/70 transition-colors"
                                        >
                                          {match.winnerMetadata?.name}
                                        </Link>
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
                                        <Link 
                                          href={`/cats/${match.loserId.toString()}`}
                                          className="text-xs text-red-400 truncate hover:text-red-300 transition-colors"
                                        >
                                          #{match.loserId.toString()}
                                        </Link>
                                        &nbsp;
                                        <Link 
                                          href={`/cats/${match.loserId.toString()}`}
                                          className="text-[10px] text-red-400/50 truncate hover:text-red-300/70 transition-colors"
                                        >
                                          {match.loserMetadata?.name}
                                        </Link>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Back Card - Stats with Images */}
                                  <div className={`absolute inset-0 rounded-md p-2
                                    bg-purple-500/5 border border-purple-500/20
                                    transition-all duration-500 ease-out
                                    flex flex-col preserve-3d backface-hidden [transform:rotateY(-180deg)]
                                    group-hover:[transform:rotateY(0deg)] text-[10px]`}
                                  >
                                    {/* Stats Layout */}
                                    <div className="grid grid-cols-2 gap-2 h-full">
                                      {/* Winner Stats */}
                                      <div className="space-y-2 border-r border-purple-500/20 pr-2">
                                        <div className="flex items-center gap-1">
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
                                            <Link 
                                              href={`/cats/${match.winnerId.toString()}`}
                                              className="hover:text-emerald-300 transition-colors"
                                            >
                                              #{match.winnerId.toString()}
                                            </Link>
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          <div>Wins: {match.winnerStats?.wins}</div>
                                          <div>Losses: {match.winnerStats?.losses}</div>
                                          <div>🏆: {match.winnerStats?.championCount}</div>
                                          <div>💰: {Number(formatEther(match.winnerStats?.lifetimeRewards || 0n)).toFixed(2)} ETH</div>
                                        </div>
                                      </div>

                                      {/* Loser Stats */}
                                      <div className="space-y-2 pl-2">
                                        <div className="flex items-center gap-1">
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
                                            <Link 
                                              href={`/cats/${match.loserId.toString()}`}
                                              className="hover:text-red-300 transition-colors"
                                            >
                                              #{match.loserId.toString()}
                                            </Link>
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          <div>Wins: {match.loserStats?.wins}</div>
                                          <div>Losses: {match.loserStats?.losses}</div>
                                          <div>🏆: {match.loserStats?.championCount}</div>
                                          <div>💰: {Number(formatEther(match.loserStats?.lifetimeRewards || 0n)).toFixed(2)} ETH</div>
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