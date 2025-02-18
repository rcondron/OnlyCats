'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Image from 'next/image';
import { generateCatName } from '@/utils/nameGenerator';
import Header from '@/components/Header';
import MintButton from '@/components/MintButton';

export default function Home() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [catName, setCatName] = useState<string | null>(null);

  // Clear generated cat data when component mounts
  useEffect(() => {
    localStorage.removeItem('generatedCatImage');
    localStorage.removeItem('generatedCatName');
    setGeneratedImage(null);
    setCatName(null);
  }, []);

  // Update localStorage when state changes
  useEffect(() => {
    if (generatedImage) {
      localStorage.setItem('generatedCatImage', generatedImage);
    } else {
      localStorage.removeItem('generatedCatImage');
    }
  }, [generatedImage]);

  useEffect(() => {
    if (catName) {
      localStorage.setItem('generatedCatName', catName);
    } else {
      localStorage.removeItem('generatedCatName');
    }
  }, [catName]);

  // Handle page leave warning
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (generatedImage && catName) {
      const message = 'Your generated warrior cat will be lost forever if you leave without minting. Are you sure you want to continue?';
      e.preventDefault();
      e.returnValue = message;
      return message;
    }
  }, [generatedImage, catName]);

  // Add warning when trying to leave with unminted cat
  React.useEffect(() => {
    if (generatedImage && catName) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Handle client-side navigation
      const handleBeforeNavigate = () => {
        const shouldLeave = window.confirm(
          'Your generated warrior cat will be lost forever if you leave without minting. Are you sure you want to continue?'
        );
        if (!shouldLeave) {
          throw 'Route Cancelled';
        }
      };

      window.addEventListener('popstate', handleBeforeNavigate);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handleBeforeNavigate);
      };
    }
  }, [generatedImage, catName, handleBeforeUnload]);

  const generateCat = async () => {
    if (!isConnected) return;
    
    setGeneratedImage(null);
    setCatName(null);
    setIsGenerating(true);

    try {
      const generatedName = generateCatName();
      
      const response = await fetch('/api/generate-cat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: generatedName
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate image');
      }
      
      const data = await response.json();
      if (!data.imageUrl) {
        throw new Error('No image URL received');
      }
      
      setGeneratedImage(data.imageUrl);
      setCatName(generatedName);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to generate cat image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMintSuccess = async (tokenId: string) => {
    try {
      console.log('Minting cat:', tokenId, catName, generatedImage);
      await fetch('/api/cats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId,
          name: catName,
          imageUrl: generatedImage,
        }),
      });

      setGeneratedImage(null);
      setCatName(null);
      localStorage.removeItem('generatedCatImage');
      localStorage.removeItem('generatedCatName');
      
    } catch (error) {
      alert('Error saving cat data');
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen px-4 py-8">
        {/* Hero Section with Generate Button */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="text-center mb-12 py-8">
            <h1 className="text-6xl md:text-7xl font-cinzel font-bold mb-8
              neon-text
              animate-float
              relative
              z-10
              !leading-[100px]
            ">
              Only Cats Fight Club
            </h1>
            <p className="text-2xl text-white/70 max-w-2xl mx-auto mb-12
              font-light tracking-wide
            ">
              Enter a realm where legendary feline warriors battle for glory, honor, and catnip.
            </p>
            
            {isConnected ? (
              <button 
                onClick={generateCat} 
                disabled={isGenerating}
                className="btn-primary text-xl px-12 py-4 transform hover:scale-105"
              >
                {isGenerating ? 'Summoning Warrior...' : '⚔️ Generate Warrior Cat ⚔️'}
              </button>
            ) : (
              <p className="text-xl text-white/50 animate-pulse">
                Connect your wallet to begin your journey
              </p>
            )}
          </div>

          {/* Generated Cat Display */}
          {isGenerating && (
            <div className="text-center animate-bounce">
              <p className="text-2xl mb-2 text-white/90">🐱 Summoning your warrior... 🐱</p>
              <p className="text-white/60">
                <span className="inline-block animate-[wiggle_1s_ease-in-out_infinite]">
                  ฅ^•ﻌ•^ฅ
                </span>
              </p>
            </div>
          )}
          
          {generatedImage && catName && (
            <div className="max-w-xl mx-auto">
              <div className="w-full p-6
                bg-gradient-to-br from-[#13131a] via-[#1a1a23] to-[#13131a]
                rounded-xl
                shadow-[0_0_30px_rgba(255,45,85,0.2)]
                neon-border
              ">
                <h2 className="font-cinzel text-3xl md:text-4xl text-center mb-6 
                  bg-gradient-to-r from-[#ff2d55] via-[#ff9f0a] to-[#ff2d55]
                  bg-clip-text text-transparent 
                  font-bold tracking-wider
                  drop-shadow-[0_0_10px_rgba(255,45,85,0.5)]
                  uppercase
                  transform hover:scale-105 transition-transform
                  animate-pulse
                ">
                  {catName}
                </h2>
                <div className="relative aspect-square mb-6 p-4
                  bg-gradient-to-b from-gray-800 to-gray-900
                  rounded-xl overflow-hidden
                  shadow-[0_0_15px_rgba(0,0,0,0.2)]
                  border border-gray-700
                  group
                  hover:shadow-[0_0_25px_rgba(0,0,0,0.3)]
                  transition-all duration-300
                ">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Image 
                    src={generatedImage} 
                    alt="Generated Warrior Cat" 
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    priority
                    className="object-contain p-2 hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white text-sm
                    bg-gradient-to-t from-black/80 to-transparent
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-300
                  ">
                    <p className="text-center font-medium">
                      A mighty warrior emerges from the shadows...
                    </p>
                  </div>
                </div>
                <div className="w-full">
                  <MintButton
                    imageUrl={generatedImage}
                    name={catName}
                    onSuccess={handleMintSuccess}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Links Section */}
        <div className="max-w-6xl mx-auto mb-24 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#ff2d55]/10 to-[#ff9f0a]/10 rounded-3xl blur-3xl" />
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
            <div className="card p-8 backdrop-blur-lg hover:transform hover:scale-105 transition-all">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold mb-4 neon-text">Daily Tournaments</h3>
              <p className="text-white/70 mb-6">
                Join daily tournaments to prove your warrior's worth and earn rewards.
              </p>
              <a href="/brackets" className="text-[#ff2d55] hover:text-[#ff9f0a] transition-colors">
                View Brackets →
              </a>
            </div>
            <div className="card p-8 backdrop-blur-lg hover:transform hover:scale-105 transition-all">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-bold mb-4 neon-text">Leaderboard</h3>
              <p className="text-white/70 mb-6">
                See the most fearsome warriors and their battle records.
              </p>
              <a href="/leaderboard" className="text-[#ff2d55] hover:text-[#ff9f0a] transition-colors">
                View Rankings →
              </a>
            </div>
            <div className="card p-8 backdrop-blur-lg hover:transform hover:scale-105 transition-all">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-2xl font-bold mb-4 neon-text">My Warriors</h3>
              <p className="text-white/70 mb-6">
                Manage your collection of battle-hardened feline fighters.
              </p>
              <a href="/my-cats" className="text-[#ff2d55] hover:text-[#ff9f0a] transition-colors">
                View Collection →
              </a>
            </div>
          </div>
        </div>

        {/* Lore Section */}
        <div className="max-w-4xl mx-auto mb-24">
          <h2 className="text-4xl font-cinzel font-bold text-center mb-12 neon-text">
            The Legend
          </h2>
          <div className="prose prose-lg prose-invert max-w-none">
            <div className="card p-8 backdrop-blur-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff2d55] to-[#ff9f0a] opacity-50" />
              <p className="text-white/80 mb-6 text-lg leading-relaxed">
                In the shadows of the digital realm, an ancient society of warrior cats has emerged. 
                These aren't your ordinary house cats – they are mighty warriors, each possessing 
                unique powers and fighting styles passed down through generations.
              </p>
              <p className="text-white/80 text-lg leading-relaxed">
                Every day at midnight, the sacred tournament begins. Warriors from across the 
                blockchain gather to test their might, with only one emerging victorious. The 
                winners not only gain glory but also earn precious rewards and climb the ranks 
                of the legendary leaderboard.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-6xl mx-auto mb-24">
          <h2 className="text-4xl font-cinzel font-bold text-center mb-12 neon-text">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: "🎨", title: "Generate", desc: "Create your unique warrior cat using AI magic" },
              { icon: "💎", title: "Mint", desc: "Mint your warrior as an NFT on Base Sepolia" },
              { icon: "⚔️", title: "Battle", desc: "Enter daily tournaments and fight other warriors" },
              { icon: "🏆", title: "Earn", desc: "Win battles to earn rewards and climb ranks" }
            ].map((step, i) => (
              <div key={i} className="card p-8 text-center backdrop-blur-lg
                hover:transform hover:scale-105 transition-all
                relative overflow-hidden group
              ">
                <div className="absolute inset-0 bg-gradient-to-b from-[#ff2d55]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-5xl mb-6">{step.icon}</div>
                <h3 className="text-2xl font-bold mb-4 neon-text">{`${i + 1}. ${step.title}`}</h3>
                <p className="text-white/70">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8">
          <div className="max-w-6xl mx-auto px-4 text-center text-white/50">
            <p>Only Cats Fight Club © 2024</p>
            <p className="text-sm mt-2">Built with ❤️ for Base Sepolia</p>
          </div>
        </footer>
      </main>
    </>
  );
} 