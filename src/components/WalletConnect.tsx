'use client';

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export default function WalletConnect() {
  const { address } = useAccount();

  return (
    <div>
      <ConnectButton
        chainStatus="icon"
        accountStatus="full"
      />
      {address && <p>Connected Wallet: {address}</p>}
    </div>
  );
} 