'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#121212] text-white pb-20">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#202020] to-[#121212] p-6 pb-28">
        <h1 className="text-4xl font-bold mb-2">Sofia Guide</h1>
        <p className="text-[#b3b3b3] mb-6 max-w-sm">
          Your personal AI audio guide to Sofia, Bulgaria.
        </p>
        
        <Link href="/guide" className="inline-block bg-green-500 hover:bg-[#1ed760] text-black font-bold py-3 px-6 rounded-full text-sm">
          ▶ PLAY NOW
        </Link>
      </div>

      {/* Features */}
      <div className="px-6 -mt-16">
        <h2 className="text-2xl font-bold mb-4">Why Sofia Guide?</h2>
        <div className="space-y-2">
          <div className="bg-[#181818] p-4 rounded-md flex items-center gap-4">
            <span className="text-2xl">🎧</span>
            <div>
              <h3 className="font-bold">AI Narration</h3>
              <p className="text-[#b3b3b3] text-sm">Natural-sounding voice guide</p>
            </div>
          </div>
          <div className="bg-[#181818] p-4 rounded-md flex items-center gap-4">
            <span className="text-2xl">🗺️</span>
            <div>
              <h3 className="font-bold">Interactive Map</h3>
              <p className="text-[#b3b3b3] text-sm">GPS navigation to landmarks</p>
            </div>
          </div>
          <div className="bg-[#181818] p-4 rounded-md flex items-center gap-4">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="font-bold">Ask Anything</h3>
              <p className="text-[#b3b3b3] text-sm">Chat with AI about Sofia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured */}
      <div className="px-6 mt-6">
        <h2 className="text-2xl font-bold mb-4">Featured</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Alexander Nevsky', emoji: '⛪' },
            { name: 'St. George Rotunda', emoji: '🏛️' },
            { name: 'National Palace', emoji: '🏢' },
            { name: 'Vitosha Blvd', emoji: '🛍️' },
          ].map((item) => (
            <div key={item.name} className="bg-[#181818] p-4 rounded-md">
              <span className="text-3xl mb-2 block">{item.emoji}</span>
              <p className="font-medium text-sm">{item.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
