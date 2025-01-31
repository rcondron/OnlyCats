import { db } from './index';
import { cats } from './schema';

async function seed() {
  // Clear existing data
  await db.delete(cats);

  // Insert test data
  await db.insert(cats).values([
    {
      tokenId: '1',
      name: 'Champion Cat',
      image: 'https://ipfs.io/ipfs/QmPKnnTQGDC3WKJYuhTYTRBXwE2LBVrzFLUR9FYsmfSGJG',
      wins: 15,
      losses: 5,
      championCount: 3,
      lifetimeRewards: '1000000000000000000', // 1 MOR
      lastBattleTimestamp: Math.floor(Date.now() / 1000),
    },
    {
      tokenId: '2',
      name: 'Battle Hardened',
      image: 'https://ipfs.io/ipfs/QmPKnnTQGDC3WKJYuhTYTRBXwE2LBVrzFLUR9FYsmfSGJG',
      wins: 10,
      losses: 20,
      championCount: 1,
      lifetimeRewards: '500000000000000000', // 0.5 MOR
      lastBattleTimestamp: Math.floor(Date.now() / 1000),
    },
    {
      tokenId: '3',
      name: 'Rich Cat',
      image: 'https://ipfs.io/ipfs/QmPKnnTQGDC3WKJYuhTYTRBXwE2LBVrzFLUR9FYsmfSGJG',
      wins: 5,
      losses: 2,
      championCount: 0,
      lifetimeRewards: '2000000000000000000', // 2 MOR
      lastBattleTimestamp: Math.floor(Date.now() / 1000),
    },
    {
      tokenId: '4',
      name: 'Tournament King',
      image: 'https://ipfs.io/ipfs/QmPKnnTQGDC3WKJYuhTYTRBXwE2LBVrzFLUR9FYsmfSGJG',
      wins: 8,
      losses: 3,
      championCount: 5,
      lifetimeRewards: '1500000000000000000', // 1.5 MOR
      lastBattleTimestamp: Math.floor(Date.now() / 1000),
    },
  ]);
}

seed().catch(() => {
  process.exit(1);
}); 