'use client';

import Link from 'next/link';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="bg-gradient-to-b from-gray-900 to-black p-8 pb-32">
        <h1 className="text-4xl font-bold mb-4">Sofia Guide</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          Your personal AI audio guide to Sofia, Bulgaria. 
          Explore the city's history, culture, and hidden gems at your own pace.
        </p>
        
        <Link 
          href="/guide"
          className="inline-block bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-8 rounded-full"
        >
          ▶ Play Now
        </Link>
      </div>

      {/* Features */}
      <div className="p-6 -mt-20">
        <h2 className="text-2xl font-bold mb-6">Why Sofia Guide?</h2>
        <div className="space-y-3">
          <div className="bg-gray-900 p-4 rounded-lg flex items-center gap-4">
            <span className="text-2xl">🎧</span>
            <div>
              <h3 className="font-bold">AI Narration</h3>
              <p className="text-gray-400 text-sm">Natural-sounding voice guide</p>
            </div>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg flex items-center gap-4">
            <span className="text-2xl">🗺️</span>
            <div>
              <h3 className="font-bold">Interactive Map</h3>
              <p className="text-gray-400 text-sm">GPS navigation to landmarks</p>
            </div>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg flex items-center gap-4">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="font-bold">Ask Anything</h3>
              <p className="text-gray-400 text-sm">Chat with AI about Sofia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Landmarks */}
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Featured</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'Alexander Nevsky Cathedral', emoji: '⛪' },
            { name: 'St. George Rotunda', emoji: '🏛️' },
            { name: 'National Palace of Culture', emoji: '🏢' },
            { name: 'Vitosha Boulevard', emoji: '🛍️' },
          ].map((item) => (
            <div key={item.name} className="bg-gray-900 p-4 rounded-lg">
              <span className="text-2xl mb-2 block">{item.emoji}</span>
              <p className="font-medium">{item.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav Spacer */}
      <div className="h-20"></div>
    </div>
  );
}
