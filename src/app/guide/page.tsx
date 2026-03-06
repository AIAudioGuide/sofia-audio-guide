'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ChatBot from '@/components/ChatBot';

const SofiaMap = dynamic(() => import('@/components/SofiaMap'), { ssr: false });

const LANDMARKS = [
  { name: 'Alexander Nevsky Cathedral', lat: 42.6961, lng: 23.3324, desc: 'Iconic gold-domed cathedral built in 1882.', image: 'https://picsum.photos/seed/nevsky/300/300' },
  { name: 'St. George Rotunda', lat: 42.6970, lng: 23.3231, desc: '4th-century Roman church.', image: 'https://picsum.photos/seed/rotunda/300/300' },
  { name: 'National Palace of Culture', lat: 42.6850, lng: 23.3190, desc: 'Largest conference center.', image: 'https://picsum.photos/seed/ndk/300/300' },
  { name: 'St. Sofia Church', lat: 42.6967, lng: 23.3316, desc: '6th-century church.', image: 'https://picsum.photos/seed/stsofa/300/300' },
  { name: 'Banya Bashi Mosque', lat: 42.7011, lng: 23.3358, desc: 'Ottoman-era mosque.', image: 'https://picsum.photos/seed/mosque/300/300' },
  { name: 'City Garden', lat: 42.6951, lng: 23.3253, desc: 'Oldest park in Sofia.', image: 'https://picsum.photos/seed/garden/300/300' },
  { name: 'Vitosha Boulevard', lat: 42.6947, lng: 23.3208, desc: 'Main shopping street.', image: 'https://picsum.photos/seed/vitosha/300/300' },
  { name: 'Tsar Osvoboditel Monument', lat: 42.6938, lng: 23.3320, desc: 'Monument to Russian Tsar.', image: 'https://picsum.photos/seed/monument/300/300' },
];

export default function GuidePage() {
  const [step, setStep] = useState(1);
  const [current, setCurrent] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [showRoute, setShowRoute] = useState(false);

  const next = () => setCurrent(c => c < LANDMARKS.length - 1 ? c + 1 : c);
  const prev = () => setCurrent(c => c > 0 ? c - 1 : c);

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Sofia Guide</h1>
        {step === 2 && (
          <button onClick={() => setShowRoute(!showRoute)} className={showRoute ? "px-2 py-1 rounded text-xs bg-[#00D47E] text-black" : "px-2 py-1 rounded text-xs bg-[#282828]"}>Route</button>
        )}
      </header>

      {step === 1 && (
        <div className="p-6">
          <h2 className="text-3xl font-bold mb-2">Discover Sofia</h2>
          <p className="text-[#b3b3b3] mb-8">Your personal guide</p>
          <button onClick={() => setStep(2)} className="w-full bg-[#00D47E] text-black font-bold py-3 rounded-full mb-6">START</button>
          <Link href="/places" className="block bg-[#282828] p-3 rounded-md text-center">Places</Link>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col h-[calc(100vh-120px)]">
          <div className="flex-1 relative mx-2 mt-2 rounded-lg overflow-hidden">
            <SofiaMap 
              landmarks={LANDMARKS.map((l, i) => ({id: i, name: l.name, lat: l.lat, lng: l.lng}))} 
              currentLandmark={current} 
              onSelectLandmark={setCurrent} 
              userLocation={null} 
              showRoute={showRoute} 
            />
            <div className="absolute top-3 left-3 bg-[#181818] p-2 rounded-lg flex items-center gap-2">
              <img src={LANDMARKS[current].image} className="w-10 h-10 rounded" alt="" />
              <div>
                <p className="text-[10px] text-[#b3b3b3]">NOW</p>
                <p className="font-bold text-sm">{LANDMARKS[current].name}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#181818] p-4 mx-2 mb-2 rounded-lg">
            <input 
              type="range" 
              min="0" 
              max={LANDMARKS.length - 1} 
              value={current} 
              onChange={(e) => setCurrent(parseInt(e.target.value))} 
              className="w-full h-1 bg-[#404040] rounded accent-[#00D47E] mb-3" 
            />
            <div className="text-center">
              <h3 className="font-bold">{LANDMARKS[current].name}</h3>
              <p className="text-[#b3b3b3] text-xs">{LANDMARKS[current].desc}</p>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <button onClick={prev} disabled={current === 0} className="text-[#b3b3b3] disabled:opacity-30">Prev</button>
              <div className="w-12 h-12 rounded-full bg-[#282828] flex items-center justify-center">🎧</div>
              <button onClick={next} disabled={current === LANDMARKS.length - 1} className="text-[#b3b3b3] disabled:opacity-30">Next</button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-[#282828] p-2 flex justify-around">
        <Link href="/" className={step === 1 ? "flex flex-col items-center p-2 text-[#00D47E]" : "flex flex-col items-center p-2 text-[#b3b3b3]"}>Home</Link>
        {step === 2 ? (
          <button onClick={() => setChatOpen(!chatOpen)} className={chatOpen ? "flex flex-col items-center p-2 text-[#00D47E]" : "flex flex-col items-center p-2 text-[#b3b3b3]"}>Chat</button>
        ) : (
          <Link href="/places" className="flex flex-col items-center p-2 text-[#b3b3b3]">Places</Link>
        )}
      </nav>
      <ChatBot isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
