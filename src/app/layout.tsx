import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientProviders from './client-providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Only Cats Fight Club',
  description: 'A decentralized cat fighting game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
} 