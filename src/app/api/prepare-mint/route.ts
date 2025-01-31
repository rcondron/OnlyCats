import { NextResponse } from 'next/server';
import { pinFileToIPFS, pinJSONToIPFS } from '@/lib/services/pinata';
import { getSignatureForMint } from '@/lib/services/signature';

export async function POST(request: Request) {
  try {
    const { imageUrl, name } = await request.json();

    if (!imageUrl || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Download image and convert to Buffer
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload image to IPFS
    const imageHash = await pinFileToIPFS(buffer, 'warrior-cat.png');
    
    // Create and upload metadata
    const metadata = {
      name,
      description: `A mighty warrior cat named ${name}`,
      image: `ipfs://${imageHash}`,
      attributes: [
        {
          trait_type: 'State',
          value: 'alive'
        },
        {
          trait_type: 'Wins',
          value: '0'
        },
        {
          trait_type: 'Losses',
          value: '0'
        }
      ]
    };

    const metadataHash = await pinJSONToIPFS(metadata);
    const tokenUri = `ipfs://${metadataHash}`;
    const signature = await getSignatureForMint(tokenUri);

    return NextResponse.json({ tokenUri, signature });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to prepare mint' },
      { status: 500 }
    );
  }
} 