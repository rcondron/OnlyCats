import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { battles } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const latestBattles = await db
      .select()
      .from(battles)
      .orderBy(desc(battles.timestamp))
      .limit(10);

    return NextResponse.json(latestBattles);
  } catch (error) {
    console.error('Error fetching latest battles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest battles' },
      { status: 500 }
    );
  }
} 