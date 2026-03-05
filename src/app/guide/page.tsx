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
  { id: 1, name: { en: 'Alexander Nevsky Cathedral' }, lat: 42.6961, lng: 23.3324, desc: { en: 'The iconic gold-domed Orthodox cathedral, built in 1882 in memory of Russian Tsar Alexander II.' } },
  { id: 2, name: { en: 'St. George Rotunda' }, lat: 42.6970, lng: 23.3231, desc: { en: 'One of the oldest buildings in Sofia, a 4th-century Roman church.' } },
  { id: 3, name: { en: 'National Palace of Culture' }, lat: 42.6850, lng: 23.3190, desc: { en: "Sofia's largest conference and cultural center, built in 1981." } },
  { id: 4, name: { en: 'St. Sofia Church' }, lat: 42.6967, lng: 23.3316, desc: { en: 'A medieval church from the 6th century, giving the city its name.' } },
  { id: 5, name: { en: 'Banya Bashi Mosque' }, lat: 42.7011, lng: 23.3358, desc: { en: 'Ottoman-era mosque now housing the National Archaeological Museum.' } },
  { id: 6, name: { en: 'City Garden' }, lat: 42.6951, lng: 23.3253, desc: { en: 'The oldest public park in Sofia, opened in 1878.' } },
  { id: 7, name: { en: 'Vitosha Boulevard' }, lat: 42.6947, lng: 23.3208, desc: { en: 'The main shopping street, lined with historic cafes and boutiques.' } },
  { id: 8, name: { en: 'Tsar Osvoboditel Monument' }, lat: 42.6938, lng: 23.3320, desc: { en: 'Monument to the Russian Tsar who liberated Bulgaria from Ottoman rule.' } },
];

const TOUR_DURATIONS = [
  { id: 30, label: { en: '30 min' } },
  { id: 60, label: { en: '1 hour' } },
  { id: 120, label: { en: '2 hours' } },
];

function GuideContent() {
  const searchParams = useSearchParams();
  const [lang] = useState<Language>('en');
  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState(60);
  const [currentLandmark, setCurrentLandmark] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const t = (obj: Record<Language, string>) => obj[lang];

  // Auto-play when landmark changes
  useEffect(() => {
    if (step === 2 && currentLandmark >= 0) {
      generateAndPlayAudio();
    }
  }, [currentLandmark, step]);

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
    }
  };

  const prevLandmark = () => {
    if (currentLandmark > 0) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      setCurrentLandmark(currentLandmark - 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">🇧🇬 Sofia Audio Guide</h1>
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
            />
            
            <div className="absolute top-4 left-4 bg-slate-900/80 p-4 rounded-lg">
              <p className="text-sm text-slate-400">Now Visiting</p>
              <p className="font-bold">{t(LANDMARKS[currentLandmark].name)}</p>
            </div>
          </div>

          <div className="bg-slate-800 p-6">
            <div className="mb-4">
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

            <h3 className="text-2xl font-bold mb-2">{t(LANDMARKS[currentLandmark].name)}</h3>
            <p className="text-slate-300 mb-4">
              {t(LANDMARKS[currentLandmark].desc)}
            </p>
            <p className="text-slate-500 mb-6 text-sm">
              {isLoadingAudio ? '🎧 Generating audio...' : isPlaying ? '🔊 Playing...' : '▶️ Click play to start'}
            </p>

            <div className="flex items-center justify-center gap-6">
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
                className="p-6 bg-amber-500 hover:bg-amber-400 rounded-full text-slate-900 text-2xl disabled:opacity-50"
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

      {/* Chat Button */}
      {step === 2 && (
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-6 right-6 bg-amber-500 hover:bg-amber-400 text-slate-900 p-4 rounded-full shadow-lg text-2xl z-40"
        >
          {isChatOpen ? '💬' : '🤖'}
        </button>
      )}

      {/* Places Link */}
      {step === 2 && (
        <Link
          href="/places"
          className="fixed bottom-6 left-6 bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-full shadow-lg text-2xl z-40"
        >
          🍽️
        </Link>
      )}

      {/* Chat Bot */}
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
