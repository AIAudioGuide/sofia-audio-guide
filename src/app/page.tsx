'use client';

import { useState } from 'react';
import Link from 'next/link';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  // Future: Spanish, Italian, Greek, Turkish
];

export default function Home() {
  const [selectedLang, setSelectedLang] = useState('en');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920')] bg-cover bg-center opacity-20"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-24">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Discover Sofia
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl">
            Your personal AI audio guide to Sofia, Bulgaria. 
            Explore the city's history, culture, and hidden gems at your own pace.
          </p>
          
          <Link 
            href={`/guide?lang=${selectedLang}`}
            className="inline-block bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-4 px-8 rounded-full text-lg transition-all"
          >
            🎧 Start Free Tour
          </Link>
        </div>
      </header>

      {/* Language Selection */}
      <section className="py-16 bg-slate-800/50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Choose Your Language
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`p-4 rounded-xl transition-all ${
                  selectedLang === lang.code
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <span className="text-3xl block mb-2">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Why Our Audio Guide?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800 p-8 rounded-2xl">
              <div className="text-4xl mb-4">🎧</div>
              <h3 className="text-xl font-bold mb-3">AI-Powered</h3>
              <p className="text-slate-400">
                Natural-sounding narration in multiple languages, powered by ElevenLabs AI.
              </p>
            </div>
            <div className="bg-slate-800 p-8 rounded-2xl">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-xl font-bold mb-3">Interactive Map</h3>
              <p className="text-slate-400">
                Visual route with all landmarks, showing your progress in real-time.
              </p>
            </div>
            <div className="bg-slate-800 p-8 rounded-2xl">
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="text-xl font-bold mb-3">Your Pace</h3>
              <p className="text-slate-400">
                Choose your tour length and interests. Skip what you want, dive deeper into what interests you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Landmarks Preview */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">
            What You'll See
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Alexander Nevsky Cathedral', desc: 'Iconic gold-domed Orthodox cathedral' },
              { name: 'St. George Rotunda', desc: 'Ancient Roman church from the 4th century' },
              { name: 'National Palace of Culture', desc: 'Sofia\'s modern architectural landmark' },
              { name: 'Tsar Osvoboditel Monument', desc: 'Monument to the liberation of Sofia' },
              { name: 'Vitosha Boulevard', desc: 'Main shopping street with historic cafes' },
              { name: 'City Garden', desc: 'Beautiful park in the city center' },
            ].map((landmark) => (
              <div key={landmark.name} className="bg-slate-700/50 p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-2">{landmark.name}</h3>
                <p className="text-slate-400 text-sm">{landmark.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-500">
        <p>Made with ❤️ for Sofia explorers</p>
      </footer>
    </div>
  );
}
