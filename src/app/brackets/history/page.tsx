'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import TournamentBracket from '@/components/TournamentBracket';
import { format } from 'date-fns';

interface Tournament {
  id: number;
  date: string;
  winner: {
    id: number;
    name: string;
    imageUrl: string;
  };
  totalParticipants: number;
  totalRounds: number;
  matches: any[];
}

export default function TournamentHistory() {
  const [selectedTournament, setSelectedTournament] = React.useState<Tournament | null>(null);
  
  const { data: tournaments, isLoading } = useQuery<Tournament[]>({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const response = await fetch('/api/tournaments');
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      return response.json();
    },
  });

  return (
    <>
      <Header />
      <main className="min-h-screen px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-cinzel font-bold text-center mb-8">
            Tournament History
          </h1>

          {isLoading ? (
            <div className="text-center">Loading tournaments...</div>
          ) : tournaments && tournaments.length > 0 ? (
            <div className="space-y-8">
              {/* Tournament Selector */}
              <div className="flex gap-4 overflow-x-auto pb-4">
                {tournaments.map((tournament) => (
                  <button
                    key={tournament.id}
                    onClick={() => setSelectedTournament(tournament)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedTournament?.id === tournament.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {format(new Date(tournament.date), 'MMM d, yyyy')}
                  </button>
                ))}
              </div>

              {/* Tournament Details */}
              {selectedTournament && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">
                      Tournament Winner: {selectedTournament.winner.name}
                    </h2>
                    <p className="text-gray-600">
                      {selectedTournament.totalParticipants} Participants • {selectedTournament.totalRounds} Rounds
                    </p>
                  </div>

                  {/* Bracket Visualization */}
                  <TournamentBracket
                    matches={selectedTournament.matches}
                    totalRounds={selectedTournament.totalRounds}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-600">
              No tournament history available
            </div>
          )}
        </div>
      </main>
    </>
  );
} 