export const cats = [
  {
    id: 1,
    tokenId: "1",
    name: "Shadow Warrior",
    imageUrl: "https://picsum.photos/seed/cat1/400",
    ipfsHash: "QmXxxx1",
    owner: "0x123...abc",
    wins: 10,
    losses: 2,
    isActive: true,
    createdAt: "2024-01-08T00:00:00Z"
  },
  {
    id: 2,
    tokenId: "2",
    name: "Mystic Paw",
    imageUrl: "https://picsum.photos/seed/cat2/400",
    ipfsHash: "QmXxxx2",
    owner: "0x456...def",
    wins: 8,
    losses: 3,
    isActive: true,
    createdAt: "2024-01-08T00:00:00Z"
  },
  {
    id: 3,
    tokenId: "3",
    name: "Cosmic Whiskers",
    imageUrl: "https://picsum.photos/seed/cat3/400",
    ipfsHash: "QmXxxx3",
    owner: "0x789...ghi",
    wins: 6,
    losses: 4,
    isActive: true,
    createdAt: "2024-01-08T00:00:00Z"
  },
  {
    id: 4,
    tokenId: "4",
    name: "Thunder Pounce",
    imageUrl: "https://picsum.photos/seed/cat4/400",
    ipfsHash: "QmXxxx4",
    owner: "0xabc...jkl",
    wins: 5,
    losses: 5,
    isActive: true,
    createdAt: "2024-01-08T00:00:00Z"
  }
];

export const battles = [
  {
    id: 1,
    winnerId: 1,
    loserId: 2,
    tournamentId: 1,
    round: 1,
    createdAt: "2024-01-08T00:00:00Z"
  },
  // Add more sample battles...
];

export const tournaments = [
  {
    id: 1,
    date: "2024-01-08T00:00:00Z",
    winnerId: 1,
    totalParticipants: 8,
    totalRounds: 3,
    bracketData: [],
    rewardsDistributed: true,
    createdAt: "2024-01-08T00:00:00Z"
  },
  // Add more sample tournaments...
];

export const brackets = [
  {
    id: 1,
    date: "2024-01-08T00:00:00Z",
    round: 1,
    matches: [
      {
        id: 1,
        winnerId: 1,
        loserId: 2,
        roundNumber: 1
      },
      {
        id: 2,
        winnerId: 3,
        loserId: 4,
        roundNumber: 1
      }
    ],
    isComplete: true
  },
  {
    id: 2,
    date: "2024-01-09T00:00:00Z",
    round: 2,
    matches: [
      {
        id: 3,
        winnerId: 1,
        loserId: 3,
        roundNumber: 2
      }
    ],
    isComplete: true
  }
];

export const leaderboard = [
  {
    catId: 1,
    name: "Shadow the Unstoppable",
    owner: "0x123...abc",
    wins: 10,
    losses: 2,
    winRate: 0.833,
    tournamentWins: 2
  },
  {
    catId: 2,
    name: "Mystic Paw",
    owner: "0x456...def",
    wins: 8,
    losses: 3,
    winRate: 0.727,
    tournamentWins: 1
  },
  // Add more sample leaderboard entries...
]; 