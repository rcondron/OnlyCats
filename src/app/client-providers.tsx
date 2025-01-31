'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config, chains } from '@/utils/rainbow';
import { useEffect, useState } from 'react';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          chains={chains}
          theme={darkTheme({
            accentColor: '#ff2d55',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            overlayBlur: 'small',
          })}
        >
          {mounted ? children : null}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 