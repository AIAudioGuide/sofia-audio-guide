'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ChatBot from '@/components/ChatBot';

const SofiaMap = dynamic(() => import('@/components/SofiaMap'), { ssr: false });

const LANDMARKS = [
  { name: 'Sveti Alexander Nevski Cathedral', lat: 42.6961, lng: 23.3324, desc: 'The cathedral was built in 1882 in memory of the Russian Tsar Alexander II who helped free Bulgaria from Ottoman rule. It is one of the biggest Eastern Orthodox cathedrals in the world. The golden dome is 45m high.', image: 'https://picsum.photos/seed/nevsky/300/300' },
  { name: 'Sveti Georgi Rotunda', lat: 42.6970, lng: 23.3231, desc: 'A 4th-century Roman church, one of the oldest buildings in Sofia. It was built by the Romans in the 2nd century as a pagan temple and later converted to a Christian church.', image: 'https://picsum.photos/seed/rotunda/300/300' },
  { name: 'National Palace of Culture', lat: 42.6850, lng: 23.3190, desc: 'The NDK is the largest congress center in Southeast Europe. Built in 1981, it has 9 halls and over 3,000 seats.', image: 'https://picsum.photos/seed/ndk/300/300' },
  { name: 'Sveta Sofia Church', lat: 42.6967, lng: 23.3316, desc: 'A 6th-century Byzantine church that gave Sofia its name. The church is famous for its golden mosaics inside.', image: 'https://picsum.photos/seed/stsofa/300/300' },
  { name: 'Banya Bashi Mosque', lat: 42.7011, lng: 23.3358, desc: 'Built in 1576, this is the only functioning mosque in Sofia. The name means many baths because its minarets look like bathhouses.', image: 'https://picsum.photos/seed/mosque/300/300' },
  { name: 'City Garden', lat: 42.6951, lng: 23.3253, desc: 'The oldest public park in Sofia, opened in 1878. Features monuments to Bulgarian writers and revolutionaries.', image: 'https://picsum.photos/seed/garden/300/300' },
  { name: 'Vitosha Boulevard', lat: 42.6947, lng: 23.3208, desc: 'Sofias main shopping street since the 1890s. Lined with historic cafes, restaurants, and shops.', image: 'https://picsum.photos/seed/vitosha/300/300' },
  { name: 'Monument of the Unknown Soldier', lat: 42.6938, lng: 23.3320, desc: 'Built in 1981 to honor Bulgarian soldiers who died in war. The eternal flame burns 24/7.', image: 'https://picsum.photos/seed/monument/300/300' },
];

// Browser TTS function
function speakText(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    return utterance;
  }
  return null;
}

export default function GuidePage() {
  const [step, setStep] = useState(1);
  const [current, setCurrent] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const next = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setCurrent(c => c < LANDMARKS.length - 1 ? c + 1 : c);
  };

  const prev = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setCurrent(c => c > 0 ? c - 1 : c);
  };

  const playAudio = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      const utterance = speakText(LANDMARKS[current].desc);
      if (utterance) {
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

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
            <SofiaMap landmarks={LANDMARKS.map((l, i) => ({id: i, name: l.name, lat: l.lat, lng: l.lng}))} currentLandmark={current} onSelectLandmark={(i) => { window.speechSynthesis.cancel(); setCurrent(i); setSpeaking(false); }} userLocation={null} showRoute={showRoute} />
            <div className="absolute top-3 left-3 bg-[#181818] p-2 rounded-lg flex items-center gap-2">
              <img src={LANDMARKS[current].image} className="w-10 h-10 rounded" alt="" />
              <div>
                <p className="text-[10px] text-[#b3b3b3]">NOW</p>
                <p className="font-bold text-sm">{current + 1}/{LANDMARKS.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#181818] p-4 mx-2 mb-2 rounded-lg">
            <input type="range" min="0" max={LANDMARKS.length - 1} value={current} onChange={(e) => { window.speechSynthesis.cancel(); setCurrent(parseInt(e.target.value)); setSpeaking(false); }} className="w-full h-1 bg-[#404040] rounded accent-[#00D47E] mb-3" />
            <div className="text-center">
              <h3 className="font-bold text-lg">{LANDMARKS[current].name}</h3>
              <p className="text-[#b3b3b3] text-sm mt-2">{LANDMARKS[current].desc}</p>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <button onClick={prev} disabled={current === 0} className="text-[#b3b3b3] disabled:opacity-30">Prev</button>
              <button onClick={playAudio} className="w-12 h-12 rounded-full bg-[#00D47E] text-black font-bold">
                {speaking ? '⏹' : '▶'}
              </button>
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
