'use client';

import React from 'react';
import Image from 'next/image';

interface MatchParticipant {
  id: number;
  name: string;
  imageUrl: string;
}

interface Match {
  id: number;
  round: number;
  winner: MatchParticipant;
  loser: MatchParticipant;
  nextMatchId?: number;
}

interface TournamentBracketProps {
  matches: Match[];
  totalRounds: number;
}

export default function TournamentBracket({ matches, totalRounds }: TournamentBracketProps) {
  const matchesByRound = React.useMemo(() => {
    const rounds: Match[][] = Array(totalRounds).fill([]);
    matches.forEach(match => {
      rounds[match.round - 1] = [...(rounds[match.round - 1] || []), match];
    });
    return rounds;
  }, [matches, totalRounds]);

  return (
    <div className="flex gap-8 overflow-x-auto pb-8">
      {matchesByRound.map((roundMatches, roundIndex) => (
        <div
          key={roundIndex}
          className="flex-shrink-0 w-80"
        >
          <h3 className="text-xl font-bold mb-4">
            Round {roundIndex + 1}
          </h3>
          <div className="space-y-8">
            {roundMatches.map((match) => (
              <div
                key={match.id}
                className="card p-4 relative animate-fade-in"
              >
                {/* Winner */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-16 h-16">
                    <Image
                      src={match.winner.imageUrl}
                      alt={match.winner.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full animate-scale-in">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-green-600">Winner</div>
                    <div className="text-lg">{match.winner.name}</div>
                  </div>
                </div>

                {/* Connector Line */}
                {match.nextMatchId && (
                  <div className="absolute -right-8 top-1/2 w-8 h-px bg-gray-300" />
                )}

                {/* Loser */}
                <div className="flex items-center gap-4 opacity-75">
                  <div className="relative w-16 h-16">
                    <Image
                      src={match.loser.imageUrl}
                      alt={match.loser.name}
                      fill
                      className="object-cover rounded-lg grayscale"
                    />
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full animate-scale-in">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Defeated</div>
                    <div>{match.loser.name}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 