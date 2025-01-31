import { NextResponse } from 'next/server';
import { db, cats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { tokenId: string } }
) {
  try {
    const cat = await db.query.cats.findFirst({
      where: eq(cats.tokenId, params.tokenId),
    });

    if (!cat) {
      return NextResponse.json(
        { error: 'Cat not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ state: cat.isActive ? 'alive' : 'dead' });
  } catch (error) {
    console.error('Error fetching cat state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cat state' },
      { status: 500 }
    );
  }
} 