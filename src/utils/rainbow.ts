import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';
import { http } from 'viem';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
if (!projectId) {
  throw new Error('Missing NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID');
}

// Define Base Sepolia if not available in wagmi/chains
const baseSepoliaChain = {
  ...baseSepolia,
  iconUrl: 'https://raw.githubusercontent.com/ethereum-optimism/brand-kit/main/assets/svg/Base-Token.svg',
  blockExplorers: {
    default: {
      name: 'BaseScan Sepolia',
      url: 'https://sepolia.basescan.org',
    },
  },
};

export const chains = [baseSepoliaChain];

export const config = getDefaultConfig({
  appName: 'Only Cats Fight Club',
  projectId,
  chains: [baseSepoliaChain],
  transports: {
    [baseSepoliaChain.id]: http(process.env.NEXT_PUBLIC_RPC_URL)
  },
}); 