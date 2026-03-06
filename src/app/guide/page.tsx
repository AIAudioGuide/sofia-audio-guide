'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ChatBot from '@/components/ChatBot';

const SofiaMap = dynamic(() => import('@/components/SofiaMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">Loading map...</div>
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
  const R = 6371000; // Earth's radius in meters
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

  // Request location permission and track position
  useEffect(() => {
    if (step !== 2 || !autoPlay) return;

    if (!navigator.geolocation) {
      setLocationError('GPS not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError('');
      },
      (error) => {
        setLocationError('Location access denied');
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    // Watch position
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [step, autoPlay]);

  // Check distance to landmarks and auto-play when close
  useEffect(() => {
    if (!autoPlay || !userLocation || step !== 2) return;

    const current = LANDMARKS[currentLandmark];
    const distance = getDistance(
      userLocation.lat, userLocation.lng,
      current.lat, current.lng
    );

    // Auto-play if within 50 meters and haven't just played this one
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
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsPlaying(false);
        };
        
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
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setCurrentLandmark(index);
    lastPlayedRef.current = -1; // Reset so it can auto-play again
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
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      setCurrentLandmark(currentLandmark + 1);
      lastPlayedRef.current = -1;
    }
  };

  const prevLandmark = () => {
    if (currentLandmark > 0) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      setCurrentLandmark(currentLandmark - 1);
      lastPlayedRef.current = -1;
    }
  };

  // Get distance to current landmark
  const currentDistance = userLocation ? Math.round(
    getDistance(
      userLocation.lat, userLocation.lng,
      LANDMARKS[currentLandmark].lat, LANDMARKS[currentLandmark].lng
    )
  ) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">🇧🇬 Sofia Audio Guide</h1>
        <div className="flex items-center gap-2">
          {step === 2 && (
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                autoPlay ? 'bg-green-500 text-white' : 'bg-slate-600'
              }`}
            >
              📍 {autoPlay ? 'Auto' : 'Manual'}
            </button>
          )}
        </div>
      </header>

      {step === 1 && (
        <div className="max-w-2xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8">Configure Your Tour</h2>
          
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Tour Duration</h3>
            <div className="flex gap-4">
              {TOUR_DURATIONS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDuration(d.id)}
                  className={`px-6 py-3 rounded-lg transition-all ${
                    duration === d.id 
                      ? 'bg-amber-500 text-slate-900 font-bold' 
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {t(d.label)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-4 rounded-xl text-lg"
          >
            Start Tour →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col h-[calc(100vh-73px)]">
          <div className="flex-1 bg-slate-800 relative">
            <SofiaMap 
              landmarks={LANDMARKS.map(l => ({ id: l.id, name: t(l.name), lat: l.lat, lng: l.lng }))}
              currentLandmark={currentLandmark}
              onSelectLandmark={handleLandmarkSelect}
              userLocation={userLocation}
            />
            
            <div className="absolute top-4 left-4 bg-slate-900/80 p-4 rounded-lg">
              <p className="text-sm text-slate-400">Now Visiting</p>
              <p className="font-bold">{t(LANDMARKS[currentLandmark].name)}</p>
              {currentDistance !== null && (
                <p className="text-xs text-slate-400 mt-1">
                  📍 {currentDistance}m away
                </p>
              )}
            </div>

            {locationError && (
              <div className="absolute bottom-4 left-4 bg-red-500/80 p-2 rounded-lg text-xs">
                {locationError}
              </div>
            )}
          </div>

          <div className="bg-slate-800 p-4">
            {LANDMARKS[currentLandmark].image && (
              <img 
                src={LANDMARKS[currentLandmark].image}
                alt={t(LANDMARKS[currentLandmark].name)}
                className="w-full h-32 object-cover rounded-xl mb-4"
              />
            )}

            <div className="mb-3">
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Landmark {currentLandmark + 1} of {LANDMARKS.length}</span>
                <span>{Math.round(((currentLandmark + 1) / LANDMARKS.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${((currentLandmark + 1) / LANDMARKS.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-2">{t(LANDMARKS[currentLandmark].name)}</h3>
            <p className="text-slate-300 mb-3 text-sm">
              {t(LANDMARKS[currentLandmark].desc)}
            </p>
            <p className="text-slate-500 mb-4 text-sm">
              {isLoadingAudio ? '🎧 Loading...' : isPlaying ? '🔊 Playing...' : autoPlay ? '📍 Auto-play enabled' : '▶️ Tap to play'}
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={prevLandmark}
                disabled={currentLandmark === 0}
                className="p-3 bg-slate-700 rounded-full disabled:opacity-50"
              >
                ⏮️
              </button>
              
              <button
                onClick={handlePlay}
                disabled={isLoadingAudio}
                className="p-5 bg-amber-500 hover:bg-amber-400 rounded-full text-slate-900 text-xl disabled:opacity-50"
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              
              <button
                onClick={nextLandmark}
                disabled={currentLandmark === LANDMARKS.length - 1}
                className="p-3 bg-slate-700 rounded-full disabled:opacity-50"
              >
                ⏭️
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-6 right-6 bg-amber-500 hover:bg-amber-400 text-slate-900 p-4 rounded-full shadow-lg text-2xl z-40"
        >
          {isChatOpen ? '💬' : '🤖'}
        </button>
      )}

      {step === 2 && (
        <Link
          href="/places"
          className="fixed bottom-6 left-6 bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-full shadow-lg text-2xl z-40"
        >
          🍽️
        </Link>
      )}

      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

export default function GuidePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>}>
      <GuideContent />
    </Suspense>
  );
}
