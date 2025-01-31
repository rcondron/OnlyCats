import { base } from 'viem/chains';

export const config = {
  chain: base,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org',
  explorerUrl: 'https://basescan.org',
}; 