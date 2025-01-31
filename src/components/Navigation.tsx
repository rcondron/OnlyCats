'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="w-full max-w-2xl mx-auto mb-8 p-4">
      <div className="flex justify-center gap-4 bg-card rounded-2xl p-2">
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
      </div>
    </nav>
  );
} 