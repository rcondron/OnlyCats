import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { battles, cats } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

// Helper function to convert IPFS URL to gateway URL
function convertIpfsUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`;
  }
  return url;
}

// Helper function to fetch metadata and extract image URL
async function getMetadataImage(ipfsUrl: string) {
  try {
    const response = await fetch(convertIpfsUrl(ipfsUrl));
    const metadata = await response.json();
    return convertIpfsUrl(metadata.image);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return '';
  }
}

export async function GET() {
  try {
    // Get wins, losses, championships, and rewards for each cat
    const leaderboard = await db
      .select({
        catId: battles.WinnerId,
        wins: sql<number>`count(*) as wins`,
        championCount: sql<number>`sum(CASE WHEN "IsChamp" = 1 THEN 1 ELSE 0 END) as champion_count`,
        totalRewards: sql<number>`COALESCE(sum("Reward"), 0) as total_rewards`
      })
      .from(battles)
      .where(sql`"WinnerId" IS NOT NULL`)
      .groupBy(battles.WinnerId);

    // Get losses for each cat
    const losses = await db
      .select({
        catId: battles.LoserId,
        losses: sql<number>`count(*) as losses`
      })
      .from(battles)
      .where(sql`"LoserId" IS NOT NULL`)
      .groupBy(battles.LoserId);

    // Get cat metadata
    const catMetadata = await db
      .select({
        id: cats.Id,
        name: cats.Name,
        image: cats.IPFS
      })
      .from(cats);

    // Create maps for quick lookups
    const metadataMap = new Map(catMetadata.map(cat => [cat.id, cat]));
    const lossesMap = new Map(losses.map(l => [l.catId, l.losses]));
    
    // Combine all the data
    const combinedStats = await Promise.all(
      leaderboard
        .filter((cat): cat is typeof cat & { catId: number } => cat.catId !== null)
        .map(async cat => {
          const metadata = metadataMap.get(cat.catId);
          const imageUrl = metadata?.image ? await getMetadataImage(metadata.image) : '';
          
          return {
            tokenId: cat.catId,
            metadata: {
              name: metadata?.name ?? `Warrior Cat #${cat.catId}`,
              image: imageUrl
            },
            stats: {
              wins: cat.wins ?? 0,
              losses: lossesMap.get(cat.catId) ?? 0,
              championCount: cat.championCount ?? 0,
              lifetimeRewards: BigInt(Math.floor((cat.totalRewards ?? 0) * 1e18)).toString()
            }
          };
        })
    );

    if (!combinedStats.length) {
      return NextResponse.json([]);
    }

    return NextResponse.json(combinedStats);

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
} 