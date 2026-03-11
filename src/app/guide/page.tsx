'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ChatBot from '@/components/ChatBot';

const SofiaMap = dynamic(() => import('@/components/SofiaMap'), { ssr: false });

const LANDMARKS = [
  { 
    name: 'Introduction to Sofia', 
    lat: 42.6977, lng: 23.3333,
    desc: 'Welcome to Sofia, capital of Bulgaria! This city has over 7000 years of history. The earliest inhabitants were the Thracians, ancient tribes who lived here since 1000 BC. Then came the Romans in 29 BC, founding the city of Serdica, which became an important trading hub. In 681 AD, the First Bulgarian Empire was founded by Khan Asparuh. Today, Sofia has 1.3 million people.',
    image: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=400&h=300&fit=crop' 
  },
  { 
    name: 'Sveti Alexander Nevski Cathedral', 
    lat: 42.6961, lng: 23.3324, 
    desc: 'This magnificent cathedral was built in 1882 in memory of Russian Tsar Alexander II who helped free Bulgaria from Ottoman rule. It is one of the biggest Eastern Orthodox cathedrals in the world. The golden dome is 45 meters high and can be seen from across the city.',
    image: 'https://images.unsplash.com/photo-1568322503950-72d8a10a8e1b?w=400&h=300&fit=crop' 
  },
  { 
    name: 'Sveti Georgi Rotunda', 
    lat: 42.6970, lng: 23.3231, 
    desc: 'This is one of the oldest buildings in Sofia, dating to the 4th century. Originally built by the Romans in the 2nd century as a pagan temple, it was later converted to a Christian church. The walls still show medieval frescoes from the 16th century.',
    image: 'https://images.unsplash.com/photo-1559631658-138a58455267?w=400&h=300&fit=crop' 
  },
  { 
    name: 'National Palace of Culture', 
    lat: 42.6850, lng: 23.3190, 
    desc: 'The NDK is the largest congress center in Southeast Europe. Built in 1981 during communist times, it has 9 main halls and over 3000 seats. Today it hosts concerts, conferences, fashion shows, and cultural events year round.',
    image: 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=400&h=300&fit=crop' 
  },
  { 
    name: 'Sveta Sofia Church', 
    lat: 42.6967, lng: 23.3316, 
    desc: 'This 6th century Byzantine church gave Sofia its name. Before being called Sofia, the city was known as Serdica. The church is famous for beautiful golden mosaics inside. It has survived many earthquakes and reconstructions over the centuries.',
    image: 'https://images.unsplash.com/photo-1548625361-ec8f121df36f?w=400&h=300&fit=crop' 
  },
  { 
    name: 'Banya Bashi Mosque', 
    lat: 42.7011, lng: 23.3358, 
    desc: 'Built in 1576 during Ottoman rule by the famous architect Mimar Sinan, this is the only functioning mosque in Sofia today. The name Banya Bashi translates to Many Baths because the minarets looked like bathhouses to locals.',
    image: 'https://images.unsplash.com/photo-1564975446207-5f6b5f7a1b8d?w=400&h=300&fit=crop' 
  },
  { 
    name: 'City Garden', 
    lat: 42.6951, lng: 23.3253, 
    desc: 'The oldest public park in Sofia, opened in 1878 after Bulgaria gained independence. Features the Crystal Fountain from 1916 and monuments to famous Bulgarian writers and revolutionaries.',
    image: 'https://images.unsplash.com/photo-1591191057090-519e645c0677?w=400&h=300&fit=crop' 
  },
  { 
    name: 'Vitosha Boulevard', 
    lat: 42.6947, lng: 23.3208, 
    desc: 'Sofia main shopping street since the 1890s. Lined with historic cafes, restaurants, and shops. It has been the heart of Sofia social life for over a century.',
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&h=300&fit=crop' 
  },
  { 
    name: 'Monument of the Unknown Soldier', 
    lat: 42.6938, lng: 23.3320, 
    desc: 'Built in 1981 to honor Bulgarian soldiers who died in wars. The eternal flame burns 24/7. The monument represents the medieval Bulgarian army led by Tsar Ivan Asen II.',
    image: 'https://images.unsplash.com/photo-1605126717621-7fb98d1a80ca?w=400&h=300&fit=crop' 
  },
];

export default function GuidePage() {
  const [step, setStep] = useState(1);
  const [current, setCurrent] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [showRoute, setShowRoute] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopsListRef = useRef<HTMLDivElement>(null);

  const playAudio = async (index: number) => {
    setLoading(true);
    setError('');
    setPlayingIndex(index);
    try {
      const fullText = `${LANDMARKS[index].name}. ${LANDMARKS[index].desc}`;
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText })
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else if (data.audio) {
        if (audioRef.current) audioRef.current.pause();
        audioRef.current = new Audio('data:audio/mpeg;base64,' + data.audio);
        audioRef.current.play();
        audioRef.current.onended = () => setPlayingIndex(null);
      }
    } catch (e: any) { setError(e.message); } 
    finally { setLoading(false); }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingIndex(null);
  };

  const next = () => { 
    stopAudio();
    setCurrent(c => c < LANDMARKS.length - 1 ? c + 1 : c); 
    scrollToStop(current + 1);
  };
  
  const prev = () => { 
    stopAudio();
    setCurrent(c => c > 0 ? c - 1 : c); 
    scrollToStop(current - 1);
  };

  const scrollToStop = (index: number) => {
    if (stopsListRef.current) {
      const stopElement = stopsListRef.current.children[index] as HTMLElement;
      if (stopElement) {
        stopElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Calculate total distance
  const calculateTotalDistance = () => {
    let total = 0;
    for (let i = 0; i < LANDMARKS.length - 1; i++) {
      const from = LANDMARKS[i];
      const to = LANDMARKS[i + 1];
      const dist = Math.sqrt(
        Math.pow(to.lat - from.lat, 2) + Math.pow(to.lng - from.lng, 2)
      ) * 111; // rough km conversion
      total += dist;
    }
    return total.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <header className="p-3 flex justify-between items-center border-b border-[#282828]">
        <h1 className="text-lg font-bold">Sofia Guide</h1>
        <div className="text-sm text-[#b3b3b3]">
          {LANDMARKS.length} stops • {calculateTotalDistance()} km
        </div>
      </header>

      {step === 1 && (
        <div className="p-6">
          <h2 className="text-3xl font-bold mb-2">Discover Sofia</h2>
          <p className="text-[#b3b3b3] mb-8">Your personal audio guide</p>
          <button onClick={() => setStep(2)} className="w-full bg-[#00D47E] text-black font-bold py-3 rounded-full mb-6">START</button>
          <Link href="/places" className="block bg-[#282828] p-3 rounded-md text-center">Places</Link>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col h-[calc(100vh-120px)]">
          {/* Split View: Stops List + Map */}
          <div className="flex flex-1 overflow-hidden mx-2 mt-2 rounded-lg">
            
            {/* Stops List - Left Side */}
            <div 
              ref={stopsListRef}
              className="w-1/2 overflow-y-auto pr-2"
            >
              {LANDMARKS.map((landmark, index) => (
                <div 
                  key={index}
                  onClick={() => { stopAudio(); setCurrent(index); }}
                  className={`mb-3 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    current === index 
                      ? 'bg-[#282828] ring-2 ring-[#00D47E]' 
                      : 'bg-[#1a1a1a] hover:bg-[#222]'
                  }`}
                >
                  {/* Image with number overlay */}
                  <div className="relative h-32">
                    <img 
                      src={landmark.image} 
                      alt={landmark.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-[#00D47E] text-black font-bold flex items-center justify-center text-sm">
                      {index + 1}
                    </div>
                    {current === index && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-[#00D47E] flex items-center justify-center">
                          <span className="text-black text-lg">▶</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-bold text-sm mb-1 line-clamp-1">{landmark.name}</h3>
                    <p className="text-[#888] text-xs line-clamp-2 mb-2">{landmark.desc}</p>
                    
                    {/* Play button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        playingIndex === index ? stopAudio() : playAudio(index);
                      }}
                      disabled={loading}
                      className={`w-full py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                        playingIndex === index 
                          ? 'bg-red-500 text-white' 
                          : 'bg-[#00D47E] text-black'
                      }`}
                    >
                      {loading && playingIndex === index ? (
                        '...'
                      ) : playingIndex === index ? (
                        <>⏹ Stop</>
                      ) : (
                        <>▶ Play Audio</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Map - Right Side */}
            <div className="w-1/2 pl-2">
              <div className="rounded-lg overflow-hidden h-full">
                <SofiaMap 
                  landmarks={LANDMARKS.map((l, i) => ({id: i, name: l.name, lat: l.lat, lng: l.lng}))} 
                  currentLandmark={current} 
                  onSelectLandmark={(i) => { stopAudio(); setCurrent(i); scrollToStop(i); }} 
                  userLocation={null} 
                  showRoute={showRoute} 
                />
              </div>
            </div>
          </div>
          
          {/* Bottom Controls */}
          <div className="bg-[#181818] p-3 mx-2 mb-2 rounded-lg">
            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-[#b3b3b3] w-10">{current + 1}</span>
              <input 
                type="range" 
                min="0" 
                max={LANDMARKS.length - 1} 
                value={current} 
                onChange={(e) => { 
                  stopAudio(); 
                  const idx = parseInt(e.target.value);
                  setCurrent(idx); 
                  scrollToStop(idx);
                }} 
                className="flex-1 h-1.5 bg-[#404040] rounded accent-[#00D47E]" 
              />
              <span className="text-xs text-[#b3b3b3] w-10 text-right">{LANDMARKS.length}</span>
            </div>
            
            {/* Current stop info */}
            <div className="text-center mb-3">
              <h3 className="font-bold">{LANDMARKS[current].name}</h3>
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              <button 
                onClick={prev} 
                disabled={current === 0} 
                className="text-[#b3b3b3] disabled:opacity-30 hover:text-white"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>
              
              <button 
                onClick={() => playingIndex === current ? stopAudio() : playAudio(current)}
                disabled={loading}
                className="w-14 h-14 rounded-full bg-[#00D47E] text-black font-bold flex items-center justify-center hover:scale-105 transition-transform"
              >
                {loading ? '...' : playingIndex === current ? '⏹' : '▶'}
              </button>
              
              <button 
                onClick={next} 
                disabled={current === LANDMARKS.length - 1} 
                className="text-[#b3b3b3] disabled:opacity-30 hover:text-white"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                </svg>
              </button>
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
