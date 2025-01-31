import { NextResponse } from 'next/server';
import { cats } from '@/data/sampleData';

export async function GET() {
  try {
    return NextResponse.json(cats);
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
    const newCat = {
      id: cats.length + 1,
      ...body,
      wins: 0,
      losses: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    // In a real app, we would persist this data
    cats.push(newCat);

    return NextResponse.json(newCat);
  } catch (error) {
    console.error('Error saving cat:', error);
    return NextResponse.json(
      { error: 'Failed to save cat' },
      { status: 500 }
    );
  }
} 