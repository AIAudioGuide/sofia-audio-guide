'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ChatBot from '@/components/ChatBot';

const SofiaMap = dynamic(() => import('@/components/SofiaMap'), { ssr: false });

const LANDMARKS = [
  { 
    name: 'Introduction to Sofia and Bulgaria', 
    lat: 42.6977, lng: 23.3333,
    desc: 'Welcome to Sofia, capital of Bulgaria! This city has over 7000 years of history. Let us start with the history of Bulgaria. The earliest inhabitants were the Thracians, ancient tribes who lived here since 1000 BC. Then came the Romans in 29 BC, founding the city of Serdica, which became an important trading hub. In 681 AD, the First Bulgarian Empire was founded by Khan Asparuh, one of the greatest medieval European states. The Second Bulgarian Empire followed in 1185. In 1396, Bulgaria fell under Ottoman rule for nearly 500 years. In 1878, Bulgaria gained independence, and in 1908 became a kingdom. Communism ruled from 1944 to 1989. Since 1989, Bulgaria is a democratic republic. In 2007, Bulgaria joined the European Union. Today, Sofia has 1.3 million people. Bulgarians are known for hospitality, folk music, and delicious cuisine. The currency is the Lev. Let us explore the city!',
    image: 'https://picsum.photos/seed/sofia/300/300' 
  },
  { 
    name: 'Sveti Alexander Nevski Cathedral', 
    lat: 42.6961, lng: 23.3324, 
    desc: 'This magnificent cathedral was built in 1882 in memory of Russian Tsar Alexander II who helped free Bulgaria from Ottoman rule. It is one of the biggest Eastern Orthodox cathedrals in the world. The golden dome is 45 meters high and can be seen from across the city. Inside, you will find beautiful icons and the crypt houses artifacts from the Bulgarian Revival period. The cathedral is named after Saint Alexander Nevski, a Russian prince and national hero.',
    image: 'https://picsum.photos/seed/nevsky/300/300' 
  },
  { 
    name: 'Sveti Georgi Rotunda', 
    lat: 42.6970, lng: 23.3231, 
    desc: 'This is one of the oldest buildings in Sofia, dating to the 4th century. Originally built by the Romans in the 2nd century as a pagan temple, it was later converted to a Christian church. The walls still show medieval frescoes from the 16th century. This圆形 building has survived earthquakes and invasions throughout centuries.',
    image: 'https://picsum.photos/seed/rotunda/300/300' 
  },
  { 
    name: 'National Palace of Culture', 
    lat: 42.6850, lng: 23.3190, 
    desc: 'The NDK is the largest congress center in Southeast Europe. Built in 1981 during communist times, it has 9 main halls and over 3000 seats. Today it hosts concerts, conferences, fashion shows, and cultural events year round. The underground level connects to the metro. This is truly the heart of Sofia modern cultural life.',
    image: 'https://picsum.photos/seed/ndk/300/300' 
  },
  { 
    name: 'Sveta Sofia Church', 
    lat: 42.6967, lng: 23.3316, 
    desc: 'This 6th century Byzantine church gave Sofia its name. Before being called Sofia, the city was known as Serdica. The church is famous for beautiful golden mosaics inside. According to Orthodox tradition, the altar always faces east. It has survived many earthquakes and reconstructions over the centuries.',
    image: 'https://picsum.photos/seed/stsofa/300/300' 
  },
  { 
    name: 'Banya Bashi Mosque', 
    lat: 42.7011, lng: 23.3358, 
    desc: 'Built in 1576 during Ottoman rule by the famous architect Mimar Sinan, this is the only functioning mosque in Sofia today. The name Banya Bashi translates to Many Baths because the minarets looked like bathhouses to locals. It serves the Muslim community and is an important cultural landmark.',
    image: 'https://picsum.photos/seed/mosque/300/300' 
  },
  { 
    name: 'City Garden', 
    lat: 42.6951, lng: 23.3253, 
    desc: 'The oldest public park in Sofia, opened in 1878 after Bulgaria gained independence. Features the Crystal Fountain from 1916 and monuments to famous Bulgarian writers and revolutionaries. A peaceful oasis in the city center where locals come to relax.',
    image: 'https://picsum.photos/seed/garden/300/300' 
  },
  { 
    name: 'Vitosha Boulevard', 
    lat: 42.6947, lng: 23.3208, 
    desc: 'Sofia main shopping street since the 1890s. Lined with historic cafes, restaurants, and shops. It has been the heart of Sofia social life for over a century. Stop at a traditional coffee house for Bulgarian coffee and people watching.',
    image: 'https://picsum.photos/seed/vitosha/300/300' 
  },
  { 
    name: 'Monument of the Unknown Soldier', 
    lat: 42.6938, lng: 23.3320, 
    desc: 'Built in 1981 to honor Bulgarian soldiers who died in wars. The eternal flame burns 24/7. The monument represents the medieval Bulgarian army led by Tsar Ivan Asen II. It is a place of remembrance and national pride, located next to Saint Alexander Nevski Cathedral.',
    image: 'https://picsum.photos/seed/monument/300/300' 
  },
];

export default function GuidePage() {
  const [step, setStep] = useState(1);
  const [current, setCurrent] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = async () => {
    setLoading(true);
    setError('');
    try {
      const fullText = `${LANDMARKS[current].name}. ${LANDMARKS[current].desc}`;
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
      }
    } catch (e: any) { setError(e.message); } 
    finally { setLoading(false); }
  };

  const next = () => { if (audioRef.current) audioRef.current.pause(); setCurrent(c => c < LANDMARKS.length - 1 ? c + 1 : c); setError(''); };
  const prev = () => { if (audioRef.current) audioRef.current.pause(); setCurrent(c => c > 0 ? c - 1 : c); setError(''); };

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
              onSelectLandmark={(i) => { if (audioRef.current) audioRef.current.pause(); setCurrent(i); }} 
              userLocation={null} 
              showRoute={showRoute} 
            />
            <div className="absolute top-3 left-3 bg-[#181818] p-2 rounded-lg flex items-center gap-2">
              <img src={LANDMARKS[current].image} className="w-10 h-10 rounded" alt="" />
              <div>
                <p className="text-[10px] text-[#b3b3b3]">NOW</p>
                <p className="font-bold text-sm">{current + 1}/{LANDMARKS.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#181818] p-4 mx-2 mb-2 rounded-lg">
            <input 
              type="range" 
              min="0" 
              max={LANDMARKS.length - 1} 
              value={current} 
              onChange={(e) => { if (audioRef.current) audioRef.current.pause(); setCurrent(parseInt(e.target.value)); }} 
              className="w-full h-1 bg-[#404040] rounded accent-[#00D47E] mb-3" 
            />
            <div className="text-center">
              <h3 className="font-bold text-lg">{LANDMARKS[current].name}</h3>
              <p className="text-[#b3b3b3] text-sm mt-2">{LANDMARKS[current].desc.substring(0, 100)}...</p>
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <button onClick={prev} disabled={current === 0} className="text-[#b3b3b3] disabled:opacity-30">Prev</button>
              <button onClick={playAudio} disabled={loading} className="w-12 h-12 rounded-full bg-[#00D47E] text-black font-bold">
                {loading ? '...' : '▶'}
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
