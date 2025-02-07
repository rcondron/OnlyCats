'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TournamentBracket from '../../components/TournamentBracket';
import { parseBattleId, formatBattleTime } from '../../utils/battleId';

interface Match {
  id: number;
  round: number;
  winner: {
    id: number;
    name: string;
    imageUrl: string;
  };
  loser: {
    id: number;
    name: string;
    imageUrl: string;
  };
}

interface Bracket {
  id: string;
  battleID: string;
  matches: Match[];
  totalRounds: number;
  prizePool: string;
  participantCount: number;
  timestamp: string;
}

export default function BracketsPage() {
  const [groupedBrackets, setGroupedBrackets] = useState<{ [key: string]: Bracket[] }>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBrackets() {
      try {
        setIsLoading(true);
        const response = await axios.get<Bracket[]>('/api/brackets');
        const brackets: Bracket[] = response.data;

        // Group brackets by hour using the battleID pattern
        const groups = brackets.reduce((acc, bracket) => {
          const parsed = parseBattleId(bracket.battleID);
          if (!parsed.valid) {
            console.warn(`Skipping invalid battleID: ${bracket.battleID}`);
            return acc;
          }

          const hourKey = bracket.battleID;
          if (!acc[hourKey]) {
            acc[hourKey] = [];
          }
          acc[hourKey].push(bracket);
          return acc;
        }, {} as { [key: string]: Bracket[] });

        setGroupedBrackets(groups);
        setError(null);
      } catch (error) {
        console.error("Error fetching brackets:", error);
        setError("Failed to load tournament brackets. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchBrackets();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-purple-300 mb-6">Loading Tournaments...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-300">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-300 mb-6">Tournament Brackets</h1>
        {Object.entries(groupedBrackets)
          .sort(([a], [b]) => b.localeCompare(a)) // Sort by most recent
          .map(([hourKey, brackets]) => (
            <div key={hourKey} className="mb-8">
              <h2 className="text-xl font-semibold text-purple-200 mb-4">
                Tournament {formatBattleTime(hourKey)}
              </h2>
              <div className="space-y-6">
                {brackets.map((bracket) => (
                  <div key={bracket.id} className="bg-purple-500/5 rounded-lg p-6 backdrop-blur-sm border border-purple-500/20">
                    <div className="mb-4">
                      <p className="text-purple-300">Prize Pool: {bracket.prizePool} MOR</p>
                      <p className="text-purple-300">Participants: {bracket.participantCount}</p>
                    </div>
                    <TournamentBracket
                      matches={bracket.matches}
                      totalRounds={bracket.totalRounds}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
} 