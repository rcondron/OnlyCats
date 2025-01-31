'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface TournamentStats {
  totalTournaments: number;
  totalBattles: number;
  totalParticipants: number;
  averageParticipants: number;
  mostWins: {
    name: string;
    wins: number;
    imageUrl: string;
  };
  lastTournament: string;
  upcomingTournament: string;
}

export default function TournamentStats() {
  const { data: stats, isLoading } = useQuery<TournamentStats>({
    queryKey: ['tournament-stats'],
    queryFn: async () => {
      const response = await fetch('/api/tournaments/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  if (isLoading) return <div>Loading statistics...</div>;
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="card p-4">
        <h3 className="text-lg font-bold mb-2">Total Tournaments</h3>
        <p className="text-3xl font-bold text-primary">{stats.totalTournaments}</p>
      </div>

      <div className="card p-4">
        <h3 className="text-lg font-bold mb-2">Total Battles</h3>
        <p className="text-3xl font-bold text-primary">{stats.totalBattles}</p>
      </div>

      <div className="card p-4">
        <h3 className="text-lg font-bold mb-2">Average Participants</h3>
        <p className="text-3xl font-bold text-primary">
          {stats.averageParticipants.toFixed(1)}
        </p>
      </div>

      <div className="card p-4">
        <h3 className="text-lg font-bold mb-2">Most Wins</h3>
        <div className="flex items-center gap-2">
          <img
            src={stats.mostWins.imageUrl}
            alt={stats.mostWins.name}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <p className="font-bold">{stats.mostWins.name}</p>
            <p className="text-sm text-gray-600">{stats.mostWins.wins} wins</p>
          </div>
        </div>
      </div>

      <div className="card p-4 md:col-span-2">
        <h3 className="text-lg font-bold mb-2">Tournament Schedule</h3>
        <div className="space-y-2">
          <p>
            <span className="text-gray-600">Last Tournament:</span>{' '}
            {formatDistanceToNow(new Date(stats.lastTournament), { addSuffix: true })}
          </p>
          <p>
            <span className="text-gray-600">Next Tournament:</span>{' '}
            {formatDistanceToNow(new Date(stats.upcomingTournament), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
} 