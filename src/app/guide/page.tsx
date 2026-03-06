'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ChatBot from '@/components/ChatBot';

const SofiaMap = dynamic(() => import('@/components/SofiaMap'), { ssr: false, loading: () => <div className="w-full h-full bg-[#121212] flex items-center justify-center text-[#00D47E]">Loading...</div> });

type Language = 'en';

const LANDMARKS = [
  { id: 1, name: { en: 'Alexander Nevsky Cathedral' }, lat: 42.6961, lng: 23.3324, desc: { en: 'The iconic gold-domed Orthodox cathedral, built in 1882.' }, image: 'https://picsum.photos/seed/nevsky/300/300' },
  { id: 2, name: { en: 'St. George Rotunda' }, lat: 42.6970, lng: 23.3231, desc: { en: 'One of the oldest buildings in Sofia, a 4th-century Roman church.' }, image: 'https://picsum.photos/seed/rotunda/300/300' },
  { id: 3, name: { en: 'National Palace of Culture' }, lat: 42.6850, lng: 23.3190, desc: { en: "Sofia's largest conference and cultural center." }, image: 'https://picsum.photos/seed/ndk/300/300' },
  { id: 4, name: { en: 'St. Sofia Church' }, lat: 42.6967, lng: 23.3316, desc: { en: 'A medieval church from the 6th century.' }, image: 'https://picsum.photos/seed/stsofa/300/300' },
  { id: 5, name: { en: 'Banya Bashi Mosque' }, lat: 42.7011, lng: 23.3358, desc: { en: 'Ottoman-era mosque.' }, image: 'https://picsum.photos/seed/mosque/300/300' },
  { id: 6, name: { en: 'City Garden' }, lat: 42.6951, lng: 23.3253, desc: { en: 'The oldest public park in Sofia.' }, image: 'https://picsum.photos/seed/garden/300/300' },
  { id: 7, name: { en: 'Vitosha Boulevard' }, lat: 42.6947, lng: 23.3208, desc: { en: 'The main shopping street.' }, image: 'https://picsum.photos/seed/vitosha/300/300' },
  { id: 8, name: { en: 'Tsar Osvoboditel Monument' }, lat: 42.6938, lng: 23.3320, desc: { en: 'Monument to the Russian Tsar.' }, image: 'https://picsum.photos/seed/monument/300/300' },
];

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function GuideContent() {
  const [step, setStep] = useState(1);
  const [currentLandmark, setCurrentLandmark] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [error, setError] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedRef = useRef<number>(-1);

  useEffect(() => {
    if (step !== 2 || !autoPlay) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => { setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }); },
      () => {}, { enableHighAccuracy: true, maximumAge: 10000 }
    );
    const id = navigator.geolocation.watchPosition((p) => setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }), () => {}, { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(id);
  }, [step, autoPlay]);

  useEffect(() => {
    if (!autoPlay || !userLocation || step !== 2) return;
    const dist = getDistance(userLocation.lat, userLocation.lng, LANDMARKS[currentLandmark].lat, LANDMARKS[currentLandmark].lng);
    if (dist < 50 && lastPlayedRef.current !== currentLandmark) {
      lastPlayedRef.current = currentLandmark;
      playAudio();
    }
  }, [userLocation, currentLandmark, autoPlay, step]);

  const playAudio = async () => {
    setIsLoadingAudio(true);
    setError('');
    try {
      const landmark = LANDMARKS[currentLandmark];
      const text = `${landmark.name.en}. ${landmark.desc.en}`.substring(0, 200);
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      if (data.audio) {
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        audio.play();
        setIsPlaying(true);
      }
    } catch (e: any) { setError(e.message); }
    finally { setIsLoadingAudio(false); }
  };

  const handlePlay = () => { if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); } else if (audioRef.current) { audioRef.current.play(); setIsPlaying(true); } else { playAudio(); } };
  const next = () => { if (currentLandmark < LANDMARKS.length - 1) { if (audioRef.current) audioRef.current.pause(); setCurrentLandmark(currentLandmark + 1); lastPlayedRef.current = -1; setIsPlaying(false); } };
  const prev = () => { if (currentLandmark > 0) { if (audioRef.current) audioRef.current.pause(); setCurrentLandmark(currentLandmark - 1); lastPlayedRef.current = -1; setIsPlaying(false); } };
  const currentDist = userLocation ? Math.round(getDistance(userLocation.lat, userLocation.lng, LANDMARKS[currentLandmark].lat, LANDMARKS[currentLandmark].lng)) : null;

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <header className="bg-gradient-to-b from-[#202020] to-transparent p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">🇧🇬 Sofia Guide</h1>
        {step === 2 && <div className="flex gap-2">
          <button onClick={() => setShowRoute(!showRoute)} className={`px-2 py-1 rounded-full text-xs ${showRoute ? 'bg-[#00D47E] text-black' : 'bg-[#282828]'}`}>🛤️</button>
          <button onClick={() => setAutoPlay(!autoPlay)} className={`px-2 py-1 rounded-full text-xs ${autoPlay ? 'bg-[#00D47E] text-black' : 'bg-[#282828]'}`}>📍</button>
        </div>}
      </header>

      {step === 1 && <div className="p-6">
        <h2 className="text-3xl font-bold mb-2">Discover Sofia</h2>
        <p className="text-[#b3b3b3] mb-8">Your personal audio guide</p>
        <button onClick={() => setStep(2)} className="w-full bg-[#00D47E] hover:bg-[#00D47E] text-black font-bold py-3 rounded-full text-sm mb-6">▶ START</button>
        <Link href="/places" className="block bg-[#282828] p-3 rounded-md text-center">🍽️ Places</Link>
      </div>}

      {step === 2 && <div className="flex flex-col h-[calc(100vh-180px)]">
        <div className="flex-1 relative rounded-lg overflow-hidden mx-2 mt-2">
          <SofiaMap landmarks={LANDMARKS.map(l => ({ id: l.id, name: l.name.en, lat: l.lat, lng: l.lng }))} currentLandmark={currentLandmark} onSelectLandmark={(i) => { if (audioRef.current) audioRef.current.pause(); setCurrentLandmark(i); lastPlayedRef.current = -1; setIsPlaying(false); }} userLocation={userLocation} showRoute={showRoute} />
          <div className="absolute top-3 left-3 right-3 bg-[#181818]/90 p-2 rounded-lg flex items-center gap-3">
            <img src={LANDMARKS[currentLandmark].image} className="w-10 h-10 rounded-md" alt="" />
            <div><p className="text-[10px] text-[#b3b3b3]">NOW</p><p className="font-bold text-sm">{LANDMARKS[currentLandmark].name.en}</p></div>
          </div>
        </div>
        <div className="bg-[#181818] p-4 mx-2 mb-2 rounded-lg">
          <input type="range" min="0" max={LANDMARKS.length - 1} value={currentLandmark} onChange={(e) => { if (audioRef.current) audioRef.current.pause(); setCurrentLandmark(parseInt(e.target.value)); lastPlayedRef.current = -1; setIsPlaying(false); }} className="w-full h-1 bg-[#404040] rounded-lg accent-[#00D47E] mb-3" />
          <div className="text-center mb-2"><h3 className="font-bold">{LANDMARKS[currentLandmark].name.en}</h3><p className="text-[#b3b3b3] text-xs">{LANDMARKS[currentLandmark].desc.en}</p></div>
          {error && <p className="text-red-500 text-xs text-center mb-2">{error}</p>}
          <div className="flex items-center justify-center gap-4">
            <button onClick={prev} disabled={currentLandmark === 0} className="text-[#b3b3b3] disabled:opacity-30">⏮</button>
            <button onClick={handlePlay} disabled={isLoadingAudio} className="w-12 h-12 rounded-full bg-white flex items-center justify-center disabled:opacity-50">
              {isLoadingAudio ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : isPlaying ? '⏸' : '▶'}
            </button>
            <button onClick={next} disabled={currentLandmark === LANDMARKS.length - 1} className="text-[#b3b3b3] disabled:opacity-30">⏭</button>
          </div>
        </div>
      </div>}

      <nav className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-[#282828] p-2 flex justify-around">
        <Link href="/" className={`flex flex-col items-center p-2 ${step === 1 ? 'text-[#00D47E]' : 'text-[#b3b3b3]'}`}><span className="text-xl">🏠</span><span className="text-[10px]">Home</span></Link>
        {step === 2 ? <button onClick={() => setIsChatOpen(!isChatOpen)} className={`flex flex-col items-center p-2 ${isChatOpen ? 'text-[#00D47E]' : 'text-[#b3b3b3]'}`}><span className="text-xl">💬</span><span className="text-[10px]">Chat</span></button> : <Link href="/places" className="flex flex-col items-center p-2 text-[#b3b3b3]><span className="text-xl">🍽️</span><span className="text-[10px]">Places</span></Link>}
      </nav>
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

export default function GuidePage() { return <Suspense fallback={<div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">Loading...</div>}><GuideContent /></Suspense>; }
