import { NextResponse } from 'next/server';
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OpenAI API Key');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `a single highly detailed realistic looking cat, named ${name} in a themed costume`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    });

    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error('No image generated');
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    );
  }
} 