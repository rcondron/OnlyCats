'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full 
      bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/10
      shadow-[0_0_20px_rgba(0,0,0,0.3)]
    ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link 
              href="/" 
              className="text-2xl font-cinzel font-bold 
                bg-gradient-to-r from-[#ff2d55] via-[#ff9f0a] to-[#ff2d55]
                bg-clip-text text-transparent
                animate-gradient
                hover:scale-105 transition-transform
                drop-shadow-[0_0_10px_rgba(255,45,85,0.3)]
              "
            >
              OCFC
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-4">
            <Link 
              href="/" 
              className={`nav-link ${pathname === '/' ? 'nav-link-active' : ''}`}
            >
              Home
            </Link>
            <Link 
              href="/my-cats" 
              className={`nav-link ${pathname === '/my-cats' ? 'nav-link-active' : ''}`}
            >
              My Cats
            </Link>
            <Link 
              href="/brackets" 
              className={`nav-link ${pathname === '/brackets' ? 'nav-link-active' : ''}`}
            >
              Fight Brackets
            </Link>
            <Link 
              href="/leaderboard" 
              className={`nav-link ${pathname === '/leaderboard' ? 'nav-link-active' : ''}`}
            >
              Leaderboard
            </Link>
          </nav>

          {/* Wallet Connection */}
          <div className="flex-shrink-0">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button 
                            onClick={openConnectModal} 
                            className="btn-primary"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button 
                            onClick={openChainModal}
                            className="btn-primary bg-red-500"
                          >
                            Wrong network
                          </button>
                        );
                      }

                      return (
                        <div className="flex gap-3">
                          <button
                            onClick={openChainModal}
                            className="bg-[#13131a] px-4 py-2 rounded-lg
                              border border-white/10 hover:border-white/20
                              transition-colors duration-200
                              flex items-center gap-2
                            "
                          >
                            {chain.hasIcon && (
                              <div className="w-5 h-5">
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    className="w-5 h-5"
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </button>

                          <button
                            onClick={openAccountModal}
                            className="bg-[#13131a] px-4 py-2 rounded-lg
                              border border-white/10 hover:border-white/20
                              transition-colors duration-200
                            "
                          >
                            {account.displayName}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </header>
  );
} 