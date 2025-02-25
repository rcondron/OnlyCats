'use client';

import { useEffect, useState } from 'react';
import { 
  useAccount, 
  useReadContract, 
  useReadContracts, 
  useWriteContract, 
  usePublicClient,
  useWaitForTransactionReceipt
} from 'wagmi';
import { formatEther, createPublicClient, http, parseEther } from 'viem';
import { WARRIOR_CATS_ADDRESS, MOR_TOKEN_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';
import { morTokenABI } from '@/lib/contracts/morTokenABI';
import Image from 'next/image';
import Header from '@/components/Header';
import ReviveButton from '@/components/ReviveButton';
import ClaimTokensButton from '@/components/ClaimTokensButton';
import Modal from '@/components/Modal';
import Link from 'next/link';

interface Cat {
  id: string;
  name: string;
  imageUrl: string;
  state: number;
  wins: number;
  losses: number;
  balance: bigint;
  isStaked: boolean;
  stakedAmount: bigint;
  lifetimeRewards: bigint;
  championCount: number;
}

interface LoadingMessageProps {
  message: string;
}

const LoadingMessage = ({ message }: LoadingMessageProps) => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="animate-spin text-4xl">🌟</div>
    <p className="text-xl text-white/70">{message}</p>
  </div>
);

const ConnectWalletMessage = () => (
  <div className="text-center space-y-6">
    <div className="flex flex-col items-center">
      <span className="text-6xl mb-4">😺</span>
      <h2 className="text-3xl font-cinzel font-bold neon-text mb-2">
        Welcome to Only Cats
      </h2>
      <p className="text-xl text-white/70 mb-2">
        Connect your wallet to view your warrior cats
      </p>
      <p className="text-sm text-white/50">
        Use the connect button in the top right to get started
      </p>
    </div>
    <div className="inline-block bg-gradient-to-r from-purple-500/10 to-blue-500/10 
      border border-purple-500/20 rounded-lg p-4 max-w-md mx-auto">
      <p className="text-sm text-white/60">
        Once connected, you'll be able to:
      </p>
      <ul className="text-sm text-white/70 mt-2 space-y-1">
        <li className="flex items-center gap-2">
          <span>👀</span> View your warrior cat collection
        </li>
        <li className="flex items-center gap-2">
          <span>⚔️</span> Enter battles and earn rewards
        </li>
        <li className="flex items-center gap-2">
          <span>✨</span> Revive fallen warriors
        </li>
        <li className="flex items-center gap-2">
          <span>💰</span> Claim your battle earnings
        </li>
      </ul>
    </div>
  </div>
);

const NoCatsMessage = () => (
  <div className="text-center">
    <p className="text-xl text-white/70 mb-4">You don't have any cats yet</p>
    <a href="/" className="btn-primary inline-block">
      Generate Your First Cat
    </a>
  </div>
);

export default function MyCats() {
  const { address, isConnected } = useAccount();
  const [cats, setCats] = useState<Cat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRevivingAll, setIsRevivingAll] = useState(false);
  const [reviveAllFee, setReviveAllFee] = useState<bigint | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [stakingTxHash, setStakingTxHash] = useState<`0x${string}` | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(null);
  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}` | null>(null);
  const [isClaimingAll, setIsClaimingAll] = useState(false);
  const [claimAllTxHash, setClaimAllTxHash] = useState<`0x${string}` | null>(null);

  // Add new state for initial loading
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const { data: stakeRequirement } = useReadContract({
    address: WARRIOR_CATS_ADDRESS,
    abi: warriorCatsABI,
    functionName: 'reqStake',
  });

  const STAKE_REQUIREMENT = stakeRequirement || 10000000000000000n;

  const { writeContractAsync } = useWriteContract();

  const publicClient = usePublicClient();

  const { isLoading: isWaitingForTx } = useWaitForTransactionReceipt({
    hash: txHash,
    onSuccess: (receipt) => {
      //console.log('Revive all transaction successful');
      alert(`Transaction successful! Hash: ${receipt.transactionHash}`);
      refetch();
      setTxHash(null);
      setIsRevivingAll(false);
    },
    onError: (error) => {
      console.error('Revive all transaction failed:', error);
      setErrorModalMessage('Unable to complete revival process');
      setTxHash(null);
      setIsRevivingAll(false);
    }
  });

  const { isLoading: isWaitingForStakeTx } = useWaitForTransactionReceipt({
    hash: stakingTxHash,
    onSuccess: (receipt) => {
      //console.log('Stake transaction successful');
      alert(`Transaction successful! Hash: ${receipt.transactionHash}`);
      refetch();
      setStakingTxHash(null);
    },
    onError: (error) => {
      console.error('Stake transaction failed:', error);
      setStakingTxHash(null);
    }
  });

  const { isLoading: isWaitingForClaimAllTx } = useWaitForTransactionReceipt({
    hash: claimAllTxHash,
    onSuccess: (receipt) => {
      //console.log('Claim all transaction successful');
      alert(`Transaction successful! Hash: ${receipt.transactionHash}`);
      refetch();
      setClaimAllTxHash(null);
      setIsClaimingAll(false);
    },
    onError: (error) => {
      console.error('Claim all transaction failed:', error);
      setErrorModalMessage('Unable to complete claim process');
      setClaimAllTxHash(null);
      setIsClaimingAll(false);
    }
  });

  // Get cats owned by the user
  const { data: tokenIds, refetch } = useReadContract({
    address: WARRIOR_CATS_ADDRESS,
    abi: warriorCatsABI,
    functionName: 'getCatsByOwner',
    args: [address as `0x${string}`],
    enabled: !!address,
  });

  // Get URIs, states and balances for all cats
  const { data: catData } = useReadContracts({
    contracts: tokenIds?.flatMap((tokenId) => [
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'tokenURI',
        args: [tokenId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'getCatState',
        args: [tokenId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'catBalances',
        args: [tokenId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'getStakedAmount',
        args: [tokenId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'lifetimeRewards',
        args: [tokenId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'getBattlesByCat',
        args: [tokenId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'champsByCat',
        args: [tokenId],
      }
    ]) ?? [],
  });

  // Add new read contract for allowance
  const { data: morAllowance } = useReadContract({
    address: MOR_TOKEN_ADDRESS,
    abi: morTokenABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, WARRIOR_CATS_ADDRESS],
    enabled: !!address,
  });

  // Add max approval constant
  const MAX_APPROVAL = 2n ** 256n - 1n; // Max uint256 value

  // Add new contract read for battles
  const { data: catBattlesData } = useReadContracts({
    contracts: tokenIds?.map((tokenId) => ({
      address: WARRIOR_CATS_ADDRESS,
      abi: warriorCatsABI,
      functionName: 'getBattlesByCat',
      args: [tokenId],
    })) ?? [],
  });

  useEffect(() => {
    async function fetchCatsData() {
      if (!tokenIds || !catData || !address) {
        setIsLoading(false);
        return;
      }

      //console.log('Token IDs:', tokenIds);
      //console.log('Cat Data:', catData);

      try {
        const processedCats = await Promise.all(
          tokenIds.map(async (tokenId, index) => {
            try {
              const dataIndex = index * 7;
              const battles = catData?.[dataIndex + 5]?.result;
              const championCount = Number(catData?.[dataIndex + 6]?.result || 0n);
              
              // Calculate wins and losses
              let wins = 0;
              let losses = 0;
              
              // Check if battles is an array before using forEach
              if (Array.isArray(battles)) {
                battles.forEach((battle: any) => {
                  // Make sure to compare BigInts properly
                  if (battle.winnerId === tokenId) {
                    wins++;
                  } else if (battle.loserId === tokenId) {
                    losses++;
                  }
                });
              }

              const uri = catData[dataIndex]?.result;
              const state = catData[dataIndex + 1]?.result;
              const balance = catData[dataIndex + 2]?.result ?? 0n;
              const stakedAmount = catData[dataIndex + 3]?.result ?? 0n;
              const lifetimeRewards = catData[dataIndex + 4]?.result ?? 0n;

              /*console.log(`Processing cat ${tokenId}:`, {
                uri,
                state,
                balance,
                stakedAmount,
                dataIndex
              });*/

              if (!uri || state === undefined) {
                console.error(`Missing data for cat ${tokenId}:`, {
                  uri,
                  state,
                  balance,
                  stakedAmount,
                  dataIndex
                });
                return null;
              }

              // Check if uri is a string before using replace
              const ipfsUrl = typeof uri === 'string' 
                ? uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
                : String(uri).replace('ipfs://', 'https://ipfs.io/ipfs/');

              const response = await fetch(ipfsUrl);
              
              if (!response.ok) {
                throw new Error(`Failed to fetch metadata: ${response.statusText}`);
              }
              
              const metadata = await response.json();

              if (!metadata?.name || !metadata?.image) {
                throw new Error('Invalid metadata format');
              }

              const imageUrl = typeof metadata.image === 'string'
                ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
                : String(metadata.image).replace('ipfs://', 'https://ipfs.io/ipfs/');

              return {
                id: tokenId.toString(),
                name: metadata.name,
                imageUrl,
                state: Number(state),
                balance: balance as bigint,
                isStaked: false,
                wins,
                losses,
                stakedAmount: stakedAmount as bigint,
                lifetimeRewards,
                championCount,
              };
            } catch (error) {
              console.error(`Error processing cat ${tokenId}:`, error);
              return null;
            }
          })
        );

        const validCats = processedCats.filter((cat): cat is Cat => cat !== null);
        //console.log('Processed cats:', validCats);
        setCats(validCats);
      } catch (error) {
        console.error('Error fetching cats:', error);
        setError('Failed to load cats. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCatsData();
  }, [tokenIds, catData, address]);

  useEffect(() => {
    async function fetchReviveAllFee() {
      try {
        const data = await publicClient.readContract({
          address: WARRIOR_CATS_ADDRESS,
          abi: warriorCatsABI,
          functionName: 'reviveAllFee',
        });
        setReviveAllFee(data);
      } catch (error) {
        console.error('Error fetching revive all fee:', error);
      }
    }

    if (isConnected) {
      fetchReviveAllFee();
    }
  }, [isConnected, publicClient]);

  const handleRevive = async (tokenId: string, index: number) => {
    try {
      // First check MOR balance
      const morBalance = await publicClient.readContract({
        address: MOR_TOKEN_ADDRESS,
        abi: morTokenABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });
  
      if (morBalance < STAKE_REQUIREMENT) {
        setErrorModalMessage('Insufficient MOR balance for revival');
        return;
      }

      // First check MOR balance
      const isValid = await validateAllowanceBalance();
      if(!isValid)
        return;

      // Now revive the cat
      const reviveHash = await writeContractAsync({
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'reviveCat',
        args: [BigInt(tokenId)],
      });

      if (!reviveHash) {
        throw new Error('Unable to process revival transaction');
      }

      setStakingTxHash(reviveHash);
    } catch (error) {
      console.error('Error reviving cat:', error);
      if (error instanceof Error) {
        if (error.message.includes('insufficient allowance')) {
          setErrorModalMessage('Only Cats needs approval to manage your MOR balance');
        } else if (error.message.includes('insufficient balance')) {
          setErrorModalMessage('Insufficient MOR balance for revival');
        } else if (error.message.includes('user rejected')) {
          setErrorModalMessage('Transaction was cancelled');
        } else {
          setErrorModalMessage('Unable to process revival at this time');
        }
      } else {
        setErrorModalMessage('Unable to process revival at this time');
      }
      setIsApproving(false);
    }
  };

  const handleReviveAll = async () => {
    if (isRevivingAll || !reviveAllFee || isWaitingForTx) return;
    setIsRevivingAll(true);
    
    try {
      // First check if we have enough ETH for the fee
      const balance = await publicClient.getBalance({ address: address as `0x${string}` });
      if (balance < reviveAllFee) {
        setErrorModalMessage('Insufficient ETH balance for reviving all cats');
        setIsRevivingAll(false);
        return;
      }

      const hash = await writeContractAsync({
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'reviveAllCats',
        value: reviveAllFee,
      });

      if (!hash) {
        throw new Error('Unable to process revival transaction');
      }

      setTxHash(hash);
    } catch (error) {
      console.error('Error reviving all cats:', error);
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          setErrorModalMessage('Insufficient ETH balance for reviving all cats');
        } else if (error.message.includes('user rejected')) {
          setErrorModalMessage('Transaction was cancelled');
        } else {
          setErrorModalMessage('Unable to process revival at this time');
        }
      } else {
        setErrorModalMessage('Unable to process revival at this time');
      }
      setIsRevivingAll(false);
    }
  };

  const validateAllowanceBalance = async () => {
    // Check allowance
    const currentAllowance = await publicClient.readContract({
      address: MOR_TOKEN_ADDRESS,
      abi: morTokenABI,
      functionName: 'allowance',
      args: [address as `0x${string}`, WARRIOR_CATS_ADDRESS],
    });

    // Only show approval modal if allowance is insufficient
    if (currentAllowance < STAKE_REQUIREMENT) {
      setIsApproving(true);
      setShowApprovalModal(true);
      
      try {
        const approveHash = await writeContractAsync({
          address: MOR_TOKEN_ADDRESS,
          abi: morTokenABI,
          functionName: 'approve',
          args: [WARRIOR_CATS_ADDRESS, MAX_APPROVAL],
        });

        if (!approveHash) {
          throw new Error('Only Cats needs approval to manage your MOR balance');
        }

        setApprovalTxHash(approveHash);
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        setShowApprovalModal(false);
        setIsApproving(false);
      } catch (error) {
        console.error('Approval error:', error);
        setShowApprovalModal(false);
        setIsApproving(false);
        setErrorModalMessage('Only Cats needs approval to manage your MOR balance');
        return;
      }
    }

    return true;
  }

  const handleClaimAll = async () => {
    if (isClaimingAll || isWaitingForClaimAllTx) return;
    setIsClaimingAll(true);
    
    try {
      const catsWithBalance = cats.filter(cat => cat.balance > 0n);
      if (catsWithBalance.length === 0) {
        setErrorModalMessage('No rewards to claim');
        setIsClaimingAll(false);
        return;
      }

      const hash = await writeContractAsync({
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'claimAllTokens',
        args: [catsWithBalance.map(cat => BigInt(cat.id))],
      });

      if (!hash) {
        throw new Error('Unable to process claim transaction');
      }

      setClaimAllTxHash(hash);
    } catch (error) {
      console.error('Error claiming all rewards:', error);
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          setErrorModalMessage('Transaction was cancelled');
        } else {
          setErrorModalMessage('Unable to process claim at this time');
        }
      } else {
        setErrorModalMessage('Unable to process claim at this time');
      }
      setIsClaimingAll(false);
    }
  };

  const hasDeadCats = cats.some(cat => cat.state === 0);

  useEffect(() => {
    // Set initial loading to false after a short delay
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-screen px-4 py-8">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-xl text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => {
                setIsLoading(true);
                setError(null);
                refetch();
              }}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Only show title and buttons if wallet is connected and has cats */}
          {isConnected && !isInitialLoading && cats.length > 0 && (
            <div className="flex items-center justify-between mb-12">
              <h1 className="text-4xl font-cinzel font-bold neon-text">
                My Cats
              </h1>
              
              <div className="flex items-center gap-4">
                {cats.some(cat => cat.balance > 0n) && (
                  <button
                    onClick={handleClaimAll}
                    disabled={isClaimingAll || isWaitingForClaimAllTx}
                    className={`px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 
                      text-white/90 hover:from-yellow-500/20 hover:to-orange-500/20 transition-colors
                      border border-yellow-500/20 hover:border-orange-500/30
                      flex items-center gap-1.5
                      ${(isClaimingAll || isWaitingForClaimAllTx) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="text-base">
                      {isClaimingAll ? '⌛' : isWaitingForClaimAllTx ? '⏳' : '💰'}
                    </span>
                    <span>
                      {isClaimingAll 
                        ? 'Initiating...' 
                        : isWaitingForClaimAllTx
                          ? 'Confirming...'
                          : 'Claim All Rewards'}
                    </span>
                  </button>
                )}
                
                {hasDeadCats && (
                  <button
                    onClick={handleReviveAll}
                    disabled={isRevivingAll || !reviveAllFee || isWaitingForTx || !hasDeadCats}
                    className={`px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-emerald-500/10 to-purple-500/10 
                      text-white/90 hover:from-emerald-500/20 hover:to-purple-500/20 transition-colors
                      border border-emerald-500/20 hover:border-purple-500/30
                      flex items-center gap-1.5
                      ${(isRevivingAll || !reviveAllFee || isWaitingForTx || !hasDeadCats) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="text-base">
                      {isRevivingAll ? '⌛' : isWaitingForTx ? '⏳' : '✨'}
                    </span>
                    <span>
                      {isRevivingAll 
                        ? 'Initiating...' 
                        : isWaitingForTx
                          ? 'Confirming...'
                          : !reviveAllFee 
                            ? 'Loading...'
                            : !hasDeadCats
                              ? 'No Dead Cats'
                              : `Revive All (${formatEther(reviveAllFee)} ETH)`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center min-h-[400px]">
            {isInitialLoading ? (
              <LoadingMessage message="Loading your warrior cats from the blockchain..." />
            ) : !isConnected ? (
              <ConnectWalletMessage />
            ) : isLoading ? (
              <LoadingMessage message="Fetching your cats..." />
            ) : cats.length === 0 && !isLoading ? (
              <NoCatsMessage />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cats.map((cat, index) => (
                  <div key={cat.id} className="card p-6 backdrop-blur-lg">
                    <Link href={`/cats/${cat.id}`} className="block relative aspect-square mb-4 rounded-lg overflow-hidden 
                      hover:scale-105 transition-transform duration-300">
                      <Image
                        src={cat.imageUrl}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </Link>

                    <h2 className="text-2xl font-bold mb-2 neon-text">
                      {cat.name}
                    </h2>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
                          cat.state === 1
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            cat.state === 1 ? 'bg-emerald-400' : 'bg-red-400'
                          }`} />
                          {cat.state === 1 ? 'Alive' : 'Fallen'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-blue-500/5 p-2 rounded-lg">
                        <div className="flex gap-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-blue-400/70">Wins</span>
                            <span className="text-sm text-blue-400/90 font-medium">
                              {cat.wins}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-red-400/70">Losses</span>
                            <span className="text-sm text-red-400/90 font-medium">
                              {cat.losses}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-yellow-400/70 flex items-center gap-1">
                              <span>🏆</span>
                              <span>Champion</span>
                            </span>
                            <span className="text-sm text-yellow-400/90 font-medium">
                              {cat.championCount}x
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-purple-400/70">Win Rate</span>
                          <span className="text-sm text-purple-400/90 font-medium">
                            {cat.wins + cat.losses > 0 
                              ? `${Math.round((cat.wins / (cat.wins + cat.losses)) * 100)}%`
                              : '0%'}
                          </span>
                        </div>
                      </div>

                      {cat.state === 0 && (
                        <div className="flex items-center justify-between bg-purple-500/5 p-2 rounded-lg">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-purple-400/70">Revival Cost</span>
                            <span className="text-xs text-purple-400">
                              {formatEther(STAKE_REQUIREMENT)} MOR
                            </span>
                          </div>
                          <button
                            onClick={() => handleRevive(cat.id, index)}
                            disabled={isApproving || isWaitingForStakeTx}
                            className="px-3 py-1 text-xs rounded-full bg-emerald-500/10 
                              text-emerald-400 hover:bg-emerald-500/20 transition-colors
                              border border-emerald-500/20 hover:border-emerald-500/30
                              flex items-center gap-1
                              disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span>{isApproving ? '⌛' : isWaitingForStakeTx ? '⏳' : '✨'}</span>
                            <span>
                              {isApproving 
                                ? 'Approving...' 
                                : isWaitingForStakeTx 
                                  ? 'Reviving...' 
                                  : 'Revive Cat'}
                            </span>
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between bg-yellow-500/5 p-2 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-xs text-yellow-400/70">Battle Earnings</span>
                          <span className="text-sm text-yellow-400/90 font-medium">
                            {formatEther(cat.balance || 0n)} MOR
                          </span>
                        </div>
                        {cat.balance > 0n && (
                          <ClaimTokensButton 
                            tokenId={cat.id}
                            className="px-3 py-1 text-xs rounded-full bg-yellow-500/10 
                              text-yellow-400 hover:bg-yellow-500/20 transition-colors
                              border border-yellow-500/20 hover:border-yellow-500/30
                              flex items-center gap-1"
                          >
                            <span>💰</span>
                            <span>Claim Rewards</span>
                          </ClaimTokensButton>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Modal 
        isOpen={showApprovalModal} 
        onClose={() => {
          setShowApprovalModal(false);
          setIsApproving(false);
        }}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">💎</div>
          <h3 className="text-xl font-bold mb-4 text-purple-400">
            One-Time Approval Required
          </h3>
          <p className="text-white/70 mb-6">
            To enable cat revival, you need to approve Only Cats to manage your MOR tokens. 
            This is a one-time approval that will allow the contract to handle your MOR tokens 
            for all future transactions.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setShowApprovalModal(false);
                setIsApproving(false);
              }}
              className="px-4 py-2 rounded-lg bg-purple-500/10 
                text-purple-400 hover:bg-purple-500/20 transition-colors
                border border-purple-500/20 hover:border-purple-500/30"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowApprovalModal(false)}
              className="px-4 py-2 rounded-lg bg-emerald-500/10 
                text-emerald-400 hover:bg-emerald-500/20 transition-colors
                border border-emerald-500/20 hover:border-emerald-500/30"
            >
              Proceed
            </button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={!!errorModalMessage} 
        onClose={() => setErrorModalMessage(null)}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">💎</div>
          <h3 className="text-xl font-bold mb-4 text-purple-400">
            Approval Needed
          </h3>
          <p className="text-white/70 mb-6">
            {errorModalMessage}
          </p>
          <button
            onClick={() => setErrorModalMessage(null)}
            className="px-4 py-2 rounded-lg bg-purple-500/10 
              text-purple-400 hover:bg-purple-500/20 transition-colors
              border border-purple-500/20 hover:border-purple-500/30"
          >
            Got it
          </button>
        </div>
      </Modal>
    </>
  );
} 