'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TournamentBracket from '../../components/TournamentBracket';
import { parseBattleId, formatBattleTime } from '../../utils/battleId';

interface Bracket {
  id: string;
  battleID: string;
  matches: {
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
    nextMatchId?: number;
  }[];
  totalRounds: number;
}

export default function BracketsPage() {
  const [groupedBrackets, setGroupedBrackets] = useState<{ [key: string]: Bracket[] }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBrackets() {
      try {
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
      } catch (error) {
        console.error("Error fetching brackets:", error);
        setError("Failed to load tournament brackets. Please try again later.");
      }
    }
    fetchBrackets();
  }, []);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="brackets-container">
      <h1>Hourly Tournament Brackets</h1>
      {Object.entries(groupedBrackets)
        .sort(([a], [b]) => b.localeCompare(a)) // Sort by most recent
        .map(([hourKey, brackets]) => (
          <div key={hourKey} className="hour-group">
            <h2>Tournament {formatBattleTime(hourKey)}</h2>
            <div className="brackets-grid">
              {brackets.map((bracket) => (
                <TournamentBracket
                  key={bracket.id}
                  matches={bracket.matches}
                  totalRounds={bracket.totalRounds}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
} 