'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ChatBot from '@/components/ChatBot';

const SofiaMap = dynamic(() => import('@/components/SofiaMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-black flex items-center justify-center text-green-500">Loading...</div>
});

type Language = 'en';

const LANDMARKS = [
  { id: 1, name: { en: 'Alexander Nevsky Cathedral' }, lat: 42.6961, lng: 23.3324, desc: { en: 'The iconic gold-domed Orthodox cathedral, built in 1882 in memory of Russian Tsar Alexander II.' }, image: 'https://picsum.photos/seed/nevsky/800/400' },
  { id: 2, name: { en: 'St. George Rotunda' }, lat: 42.6970, lng: 23.3231, desc: { en: 'One of the oldest buildings in Sofia, a 4th-century Roman church.' }, image: 'https://picsum.photos/seed/rotunda/800/400' },
  { id: 3, name: { en: 'National Palace of Culture' }, lat: 42.6850, lng: 23.3190, desc: { en: "Sofia's largest conference and cultural center, built in 1981." }, image: 'https://picsum.photos/seed/ndk/800/400' },
  { id: 4, name: { en: 'St. Sofia Church' }, lat: 42.6967, lng: 23.3316, desc: { en: 'A medieval church from the 6th century, giving the city its name.' }, image: 'https://picsum.photos/seed/stsofa/800/400' },
  { id: 5, name: { en: 'Banya Bashi Mosque' }, lat: 42.7011, lng: 23.3358, desc: { en: 'Ottoman-era mosque now housing the National Archaeological Museum.' }, image: 'https://picsum.photos/seed/mosque/800/400' },
  { id: 6, name: { en: 'City Garden' }, lat: 42.6951, lng: 23.3253, desc: { en: 'The oldest public park in Sofia, opened in 1878.' }, image: 'https://picsum.photos/seed/garden/800/400' },
  { id: 7, name: { en: 'Vitosha Boulevard' }, lat: 42.6947, lng: 23.3208, desc: { en: 'The main shopping street, lined with historic cafes and boutiques.' }, image: 'https://picsum.photos/seed/vitosha/800/400' },
  { id: 8, name: { en: 'Tsar Osvoboditel Monument' }, lat: 42.6938, lng: 23.3320, desc: { en: 'Monument to the Russian Tsar who liberated Bulgaria from Ottoman rule.' }, image: 'https://picsum.photos/seed/monument/800/400' },
];

const TOUR_DURATIONS = [
  { id: 30, label: { en: '30 min' } },
  { id: 60, label: { en: '1 hour' } },
  { id: 120, label: { en: '2 hours' } },
];

// Calculate distance between two coordinates in meters
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function GuideContent() {
  const searchParams = useSearchParams();
  const [lang] = useState<Language>('en');
  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState(60);
  const [currentLandmark, setCurrentLandmark] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedRef = useRef<number>(-1);

  const t = (obj: Record<Language, string>) => obj[lang];

  useEffect(() => {
    if (step !== 2 || !autoPlay) return;

    if (!navigator.geolocation) {
      setLocationError('GPS not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationError('');
      },
      (error) => { setLocationError('Location denied'); },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [step, autoPlay]);

  useEffect(() => {
    if (!autoPlay || !userLocation || step !== 2) return;

    const current = LANDMARKS[currentLandmark];
    const distance = getDistance(userLocation.lat, userLocation.lng, current.lat, current.lng);

    if (distance < 50 && lastPlayedRef.current !== currentLandmark) {
      lastPlayedRef.current = currentLandmark;
      generateAndPlayAudio();
    }
  }, [userLocation, currentLandmark, autoPlay, step]);

  const generateAndPlayAudio = async () => {
    setIsLoadingAudio(true);
    try {
      const landmark = LANDMARKS[currentLandmark];
      const text = `${landmark.name.en}. ${landmark.desc.en}`;
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      
      if (data.audio) {
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Audio error:', error);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleLandmarkSelect = (index: number) => {
    if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
    setCurrentLandmark(index);
    lastPlayedRef.current = -1;
  };

  const handlePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      generateAndPlayAudio();
    }
  };

  const nextLandmark = () => {
    if (currentLandmark < LANDMARKS.length - 1) {
      if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
      setCurrentLandmark(currentLandmark + 1);
      lastPlayedRef.current = -1;
    }
  };

  const prevLandmark = () => {
    if (currentLandmark > 0) {
      if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
      setCurrentLandmark(currentLandmark - 1);
      lastPlayedRef.current = -1;
    }
  };

  const currentDistance = userLocation ? Math.round(getDistance(userLocation.lat, userLocation.lng, LANDMARKS[currentLandmark].lat, LANDMARKS[currentLandmark].lng)) : null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Bar */}
      <header className="bg-gradient-to-b from-gray-900 to-black p-4 flex justify-between items-center sticky top-0 z-30">
        <h1 className="text-xl font-bold">🇧🇬 Sofia Guide</h1>
        {step === 2 && (
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 ${
              autoPlay ? 'bg-green-500 text-black' : 'bg-gray-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-white"></span>
            {autoPlay ? 'GPS On' : 'GPS Off'}
          </button>
        )}
      </header>

      {step === 1 && (
        <div className="p-6">
          <h2 className="text-3xl font-bold mb-2">Discover Sofia</h2>
          <p className="text-gray-400 mb-8">Your personal audio guide</p>
          
          {/* Duration Cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {TOUR_DURATIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDuration(d.id)}
                className={`p-4 rounded-lg transition-all ${
                  duration === d.id 
                    ? 'bg-green-500 text-black font-bold' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {t(d.label)}
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-4 rounded-full text-lg mb-6"
          >
            ▶ Start Tour
          </button>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/places" className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg flex items-center gap-3">
              <span className="text-2xl">🍽️</span>
              <span>Restaurants & Bars</span>
            </Link>
            <Link href="/mission-control" className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <span>Progress</span>
            </Link>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col h-[calc(100vh-140px)]">
          {/* Map */}
          <div className="flex-1 relative">
            <SofiaMap 
              landmarks={LANDMARKS.map(l => ({ id: l.id, name: t(l.name), lat: l.lat, lng: l.lng }))}
              currentLandmark={currentLandmark}
              onSelectLandmark={handleLandmarkSelect}
              userLocation={userLocation}
            />
            
            {/* Now Playing Card */}
            <div className="absolute top-4 left-4 right-4 bg-black/80 backdrop-blur-md p-3 rounded-xl">
              <div className="flex items-center gap-3">
                <img 
                  src={LANDMARKS[currentLandmark].image}
                  alt={t(LANDMARKS[currentLandmark].name)}
                  className="w-14 h-14 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">NOW PLAYING</p>
                  <p className="font-bold truncate">{t(LANDMARKS[currentLandmark].name)}</p>
                  {currentDistance !== null && (
                    <p className="text-xs text-green-500">{currentDistance}m away</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Player */}
          <div className="bg-gray-900 p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <input 
                type="range" 
                min="0" 
                max={LANDMARKS.length - 1} 
                value={currentLandmark}
                onChange={(e) => handleLandmarkSelect(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Landmark {currentLandmark + 1}</span>
                <span>{Math.round(((currentLandmark + 1) / LANDMARKS.length) * 100)}%</span>
              </div>
            </div>

            {/* Info */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold">{t(LANDMARKS[currentLandmark].name)}</h3>
              <p className="text-gray-400 text-sm">{t(LANDMARKS[currentLandmark].desc)}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              <button onClick={prevLandmark} disabled={currentLandmark === 0} className="text-gray-400 disabled:opacity-30">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
              </button>
              
              <button 
                onClick={handlePlay} 
                disabled={isLoadingAudio}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center disabled:opacity-50"
              >
                {isLoadingAudio ? (
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : isPlaying ? (
                  <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                  <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>
              
              <button onClick={nextLandmark} disabled={currentLandmark === LANDMARKS.length - 1} className="text-gray-400 disabled:opacity-30">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-2 flex justify-around items-center">
        <Link href="/" className={`flex flex-col items-center p-2 ${step === 1 ? 'text-green-500' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          <span className="text-xs">Home</span>
        </Link>
        {step === 2 ? (
          <button onClick={() => setIsChatOpen(!isChatOpen)} className={`flex flex-col items-center p-2 ${isChatOpen ? 'text-green-500' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            <span className="text-xs">Chat</span>
          </button>
        ) : (
          <Link href="/places" className="flex flex-col items-center p-2 text-gray-400">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>
            <span className="text-xs">Places</span>
          </Link>
        )}
        <Link href="/mission-control" className="flex flex-col items-center p-2 text-gray-400">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
          <span className="text-xs">Progress</span>
        </Link>
      </nav>

      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

export default function GuidePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <GuideContent />
    </Suspense>
  );
}
