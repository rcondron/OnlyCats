import { NextResponse } from 'next/server';
import { cats, battles, tournaments } from '@/data/sampleData';

export async function GET() {
  try {
    const stats = {
      totalTournaments: tournaments.length,
      totalBattles: battles.length,
      totalParticipants: tournaments.reduce((sum, t) => sum + t.totalParticipants, 0),
      averageParticipants: tournaments.reduce((sum, t) => sum + t.totalParticipants, 0) / tournaments.length,
      mostWins: cats.reduce((max, cat) => cat.wins > (max?.wins || 0) ? cat : max, cats[0]),
      lastTournament: tournaments[tournaments.length - 1]?.date,
      upcomingTournament: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching tournament stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament stats' },
      { status: 500 }
    );
  }
} 