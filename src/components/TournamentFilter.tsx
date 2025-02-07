'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type FilterState = {
  dateRange: 'all' | 'today' | 'week' | 'month';
  minParticipants: number;
  winnerAddress?: string;
};

export default function TournamentFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = React.useState<FilterState>({
    dateRange: (searchParams?.get('dateRange') as FilterState['dateRange']) || 'all',
    minParticipants: Number(searchParams?.get('minParticipants')) || 0,
    winnerAddress: searchParams?.get('winner') || undefined,
  });

  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Update URL with new filters
    const params = new URLSearchParams();
    params.set('dateRange', newFilters.dateRange);
    params.set('minParticipants', newFilters.minParticipants.toString());
    if (newFilters.winnerAddress) {
      params.set('winner', newFilters.winnerAddress);
    }

    router.push(`/tournaments?${params.toString()}`);
  };

  return (
    <div className="tournament-filters">
      <select
        value={filters.dateRange}
        onChange={(e) => handleFilterChange('dateRange', e.target.value)}
      >
        <option value="all">All Time</option>
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
      </select>

      <input
        type="number"
        value={filters.minParticipants}
        onChange={(e) => handleFilterChange('minParticipants', parseInt(e.target.value))}
        placeholder="Min Participants"
      />

      <input
        type="text"
        value={filters.winnerAddress || ''}
        onChange={(e) => handleFilterChange('winnerAddress', e.target.value)}
        placeholder="Winner Address"
      />
    </div>
  );
} 