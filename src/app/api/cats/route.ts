import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cats } from '@/lib/db/schema';

export async function GET() {
  try {
    const allCats = await db.select().from(cats);
    return NextResponse.json(allCats);
  } catch (error) {
    console.error('Error fetching cats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cats' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newCat = await db.insert(cats).values({
      Id: body.id,
      Name: body.name,
      IPFS: body.ipfs,
      createdAt: Math.floor(Date.now() / 1000)
    }).returning();

    return NextResponse.json(newCat[0]);
  } catch (error) {
    console.error('Error saving cat:', error);
    return NextResponse.json(
      { error: 'Failed to save cat' },
      { status: 500 }
    );
  }
} 