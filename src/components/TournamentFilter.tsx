'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

interface TournamentFilterProps {
  onFilterChange: (filters: FilterState) => void;
}

interface FilterState {
  dateRange: 'all' | 'week' | 'month' | 'year';
  minParticipants: number;
  winnerAddress?: string;
}

export default function TournamentFilter({ onFilterChange }: TournamentFilterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = React.useState<FilterState>({
    dateRange: (searchParams.get('dateRange') as FilterState['dateRange']) || 'all',
    minParticipants: Number(searchParams.get('minParticipants')) || 0,
    winnerAddress: searchParams.get('winner') || undefined,
  });

  const handleFilterChange = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);

    // Update URL
    const params = new URLSearchParams();
    if (newFilters.dateRange !== 'all') params.set('dateRange', newFilters.dateRange);
    if (newFilters.minParticipants > 0) params.set('minParticipants', String(newFilters.minParticipants));
    if (newFilters.winnerAddress) params.set('winner', newFilters.winnerAddress);

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <select
        value={filters.dateRange}
        onChange={(e) => handleFilterChange({ dateRange: e.target.value as FilterState['dateRange'] })}
        className="select select-bordered"
      >
        <option value="all">All Time</option>
        <option value="week">Past Week</option>
        <option value="month">Past Month</option>
        <option value="year">Past Year</option>
      </select>

      <input
        type="number"
        value={filters.minParticipants}
        onChange={(e) => handleFilterChange({ minParticipants: Number(e.target.value) })}
        placeholder="Min. Participants"
        className="input input-bordered"
      />

      <input
        type="text"
        value={filters.winnerAddress || ''}
        onChange={(e) => handleFilterChange({ winnerAddress: e.target.value })}
        placeholder="Winner Address"
        className="input input-bordered"
      />
    </div>
  );
} 