'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ChatBot from '@/components/ChatBot';

const SofiaMap = dynamic(() => import('@/components/SofiaMap'), { ssr: false });

const LANDMARKS = [
  { 
    name: 'Sveta Nedelya Cathedral', 
    lat: 42.69636347909931, lng: 23.321646074642466,
    viewingPoint: { lat: 42.69636347909931, lng: 23.321646074642466 },
    waypointsToNext: [
      { lat: 42.6968, lng: 23.3219 },  // Walk toward center
      { lat: 42.6972, lng: 23.3219 },  // Near the square
    ],
    desc: 'Sveta Nedelya Cathedral is one of Sofia\'s oldest churches, dating back to the 10th century. It is an Eastern Orthodox cathedral located in the heart of the city. The current building was constructed in the 19th century and features a distinctive bell tower.',
    image: '/images/sv-nedelya.jpg' 
  },
  { 
    name: 'Statue of Sofia', 
    lat: 42.69756052260627, lng: 23.32193081941887,
    viewingPoint: { lat: 42.69756052260627, lng: 23.32193081941887 },
    desc: 'The Statue of Sofia is an iconic monument depicting the goddess Sofia. Located near St. Sofia Church, this bronze statue symbolizes the wisdom and spirit of the city. It was unveiled in 2000.',
    images: ['/images/statue-sofia-2.jpg', '/images/statue-sofia-1.jpg']
  },
  { 
    name: 'St. Petka of the Saddlemakers', 
    lat: 42.69782671516099, lng: 23.321971822670115,
    viewingPoint: { lat: 42.69782671516099, lng: 23.321971822670115 },
    desc: 'St. Petka of the Saddlemakers is a small medieval church built in the 14th century. It is known for its beautiful frescoes and peaceful atmosphere in the center of Sofia.',
    image: '/images/st-petka.jpg' 
  },
  { 
    name: 'Roman Ruins', 
    lat: 42.69808788410564, lng: 23.322115334036553,
    viewingPoint: { lat: 42.69808788410564, lng: 23.322115334036553 },
    desc: 'The ancient Roman ruins of Serdica are located beneath Sofia\'s modern streets. These remains include portions of the ancient city walls, gates, and foundations from the 2nd-4th century AD.',
    image: '/images/roman-ruins.jpg' 
  },
  { 
    name: 'Square of Tolerance', 
    lat: 42.698976854779225, lng: 23.322591427324415,
    viewingPoint: { lat: 42.698976854779225, lng: 23.322591427324415 },
    waypointsToNext: [
      { lat: 42.6991, lng: 23.3228 },  // Through the square
      { lat: 42.6992, lng: 23.3230 },  // Along the street
    ],
    desc: 'The Square of Tolerance is a unique public space where a mosque, synagogue, and church stand near each other, symbolizing the religious tolerance of Sofia. It is one of the few places in the world where three Abrahamic faiths coexist in such close proximity.',
    images: ['/images/square-tolerance-1.jpg', '/images/square-tolerance-2.jpg', '/images/square-tolerance-3.jpg', '/images/square-tolerance-4.jpg']
  },
  { 
    name: 'Central Public Bath', 
    lat: 42.699339370688044, lng: 23.323233585881997,
    viewingPoint: { lat: 42.699339370688044, lng: 23.323233585881997 },
    waypointsToNext: [
      { lat: 42.6995, lng: 23.3235 },  // Front of the bath
      { lat: 42.7000, lng: 23.3238 },  // Government building backyard
    ],
    desc: 'The Central Public Bath (Kamenitsa) is an historic thermal bath facility in Sofia. Built in the early 20th century, it features beautiful Neo-Byzantine architecture and is still used today.',
    image: '/images/central-public-bath.jpg' 
  },
  { 
    name: 'Mineral Springs', 
    lat: 42.699932703728685, lng: 23.324078481733565,
    viewingPoint: { lat: 42.699932703728685, lng: 23.324078481733565 },
    desc: 'Sofia is built on numerous mineral water springs. The mineral springs location allows visitors to taste the natural thermal water that has been used for healing purposes for centuries.',
    image: '/images/mineral-springs.jpg' 
  },
  { 
    name: 'Triangle of Power', 
    lat: 42.69784662590975, lng: 23.323217549685875,
    viewingPoint: { lat: 42.69784662590975, lng: 23.323217549685875 },
    desc: 'The Triangle of Power is an area between the Presidency, the Council of Ministers, and the National Assembly. It is the administrative heart of Bulgaria.',
    image: '/images/triangle-power.jpg' 
  },
  { 
    name: 'Eastern Gate', 
    lat: 42.69769878101138, lng: 23.324164369455954,
    viewingPoint: { lat: 42.69769878101138, lng: 23.324164369455954 },
    desc: 'The Eastern Gate (Serdica Gate) is an ancient Roman gate in Sofia that was part of the city walls. It dates back to the 2nd century AD and is one of the best-preserved gates.',
    image: '/images/eastern-gate.jpg' 
  },
  { 
    name: 'Presidency', 
    lat: 42.69682238073038, lng: 23.32411115504127,
    viewingPoint: { lat: 42.69682238073038, lng: 23.32411115504127 },
    desc: 'The Presidency of Bulgaria is located in the historic building that once served as the royal palace. It is the official office of the President of Bulgaria.',
    image: '/images/presidency.jpg' 
  },
  { 
    name: 'Rotunda St George', 
    lat: 42.69670312745949, lng: 23.323572973279408,
    viewingPoint: { lat: 42.69670312745949, lng: 23.323572973279408 },
    desc: 'This is one of the oldest buildings in Sofia, dating to the 4th century. Originally built by the Romans in the 2nd century as a pagan temple, it was later converted to a Christian church. The walls still show medieval frescoes from the 16th century.',
    image: '/images/rotunda-st-george.jpg' 
  },
  { 
    name: 'City Garden', 
    lat: 42.69546885661283, lng: 23.325069655129518,
    viewingPoint: { lat: 42.69546885661283, lng: 23.325069655129518 },
    desc: 'The oldest public park in Sofia, opened in 1878 after Bulgaria gained independence. Features the Crystal Fountain from 1916 and monuments to famous Bulgarian writers and revolutionaries.',
    image: '/images/city-garden.jpg' 
  },
  { 
    name: 'National Theatre Ivan Vazov', 
    lat: 42.69470518828565, lng: 23.325643995581537,
    viewingPoint: { lat: 42.69470518828565, lng: 23.325643995581537 },
    desc: 'The Ivan Vazov National Theatre is Bulgaria\'s oldest national theatre. The current building dates to 1907 and is considered one of the most beautiful buildings in Sofia.',
    image: '/images/national-theatre.jpg' 
  },
  { 
    name: 'National Art Gallery', 
    lat: 42.695816585768064, lng: 23.326975133144987,
    viewingPoint: { lat: 42.695816585768064, lng: 23.326975133144987 },
    desc: 'The National Art Gallery is housed in the former royal palace. It contains over 50,000 works of Bulgarian art from the 19th and 20th centuries.',
    image: '/images/national-art-gallery.jpg' 
  },
  { 
    name: 'St. Sofia Church', 
    lat: 42.69630350171713, lng: 23.330998446655048,
    viewingPoint: { lat: 42.69630350171713, lng: 23.330998446655048 },
    desc: 'This 6th century Byzantine church gave Sofia its name. Before being called Sofia, the city was known as Serdica. The church is famous for beautiful golden mosaics inside. It has survived many earthquakes and reconstructions over the centuries.',
    image: '/images/st-sofia-church.jpg' 
  },
  { 
    name: 'St. Alexander Nevski Cathedral', 
    lat: 42.696077239187964, lng: 23.33183063486182,
    viewingPoint: { lat: 42.696077239187964, lng: 23.33183063486182 },
    desc: 'This magnificent cathedral was built in 1882 in memory of Russian Tsar Alexander II who helped free Bulgaria from Ottoman rule. It is one of the biggest Eastern Orthodox cathedrals in the world. The golden dome is 45 meters high and can be seen from across the city.',
    image: '/images/alexander-nevski.jpg' 
  },
];

export default function GuidePage() {
  const [step, setStep] = useState(1);
  const [current, setCurrent] = useState(0);
  const [selectVersion, setSelectVersion] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [showRoute, setShowRoute] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [imageIndexMap, setImageIndexMap] = useState<{[key: number]: number}>({});
  const [routeInfo, setRouteInfo] = useState<{distance: number; duration: number}[]>([]);
  const [totalWalkingDistance, setTotalWalkingDistance] = useState(0);
  const [totalWalkingTime, setTotalWalkingTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopsListRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  // Stable landmarks array — prevents addRoute fitBounds from re-running on every render
  const mapLandmarks = useMemo(() => LANDMARKS.map((l, i) => ({
    id: i, name: l.name, lat: l.lat, lng: l.lng,
    viewingPoint: l.viewingPoint, waypointsToNext: l.waypointsToNext,
  })), []);

  // Fetch real walking route from Mapbox
  useEffect(() => {
    const fetchRoute = async () => {
      // Build coordinates array with waypoints between each stop
      const allCoords: string[] = [];
      for (let i = 0; i < LANDMARKS.length; i++) {
        allCoords.push(`${LANDMARKS[i].lng},${LANDMARKS[i].lat}`);
        // Add waypoints to next stop if they exist
        if (LANDMARKS[i].waypointsToNext) {
          for (const wp of LANDMARKS[i].waypointsToNext) {
            allCoords.push(`${wp.lng},${wp.lat}`);
          }
        }
      }
      const coordinates = allCoords.join(';');
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}?overview=full&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`;
      
      try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.routes && data.routes[0]) {
          const legs = data.routes[0].legs;
          const routeData = legs.map((leg: any) => ({
            distance: leg.distance, // meters
            duration: leg.duration  // seconds
          }));
          setRouteInfo(routeData);
          
          // Calculate totals
          const totalDist = legs.reduce((sum: number, leg: any) => sum + leg.distance, 0);
          const totalDur = legs.reduce((sum: number, leg: any) => sum + leg.duration, 0);
          setTotalWalkingDistance(totalDist);
          setTotalWalkingTime(totalDur);
        }
      } catch (e) {
        console.error('Failed to fetch route:', e);
      }
    };
    
    fetchRoute();
  }, []);

  // Image slideshow: for multi-image stops, show first image for 20s then switch to next
  useEffect(() => {
    const landmark = LANDMARKS[current];
    if (landmark.images && landmark.images.length > 1) {
      setImageIndexMap(prev => ({ ...prev, [current]: 0 }));
      const timer = setTimeout(() => {
        setImageIndexMap(prev => ({ ...prev, [current]: 1 }));
      }, 35000);
      return () => clearTimeout(timer);
    }
  }, [current]);

  // Track audio time - separate effect that runs more frequently
  useEffect(() => {
    if (playingIndex === null) {
      setAudioTime(0);
      setAudioDuration(0);
      return;
    }
    
    const interval = setInterval(() => {
      if (currentAudioRef.current) {
        setAudioTime(currentAudioRef.current.currentTime);
        setAudioDuration(currentAudioRef.current.duration || 0);
      }
    }, 250);
    
    return () => clearInterval(interval);
  }, [playingIndex]);

  const stopAudio = () => {
    isPlayingRef.current = false;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setPlayingIndex(null);
    setAudioTime(0);
    setAudioDuration(0);
  };

  const seekAudio = (seconds: number) => {
    if (currentAudioRef.current) {
      const newTime = Math.max(0, Math.min(currentAudioRef.current.duration || 0, currentAudioRef.current.currentTime + seconds));
      currentAudioRef.current.currentTime = newTime;
      setAudioTime(newTime);
    }
  };

  const playAudio = async (index: number) => {
    // Stop any currently playing audio immediately
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    isPlayingRef.current = true;
    setLoading(true);
    setError('');
    setPlayingIndex(index);
    try {
      // Check if there's a local audio file for this stop
      const audioFiles = ['sv-nedelya', 'statue-sofia', 'st-petka', 'intro-enhanced', 'intro', 'stop-1', 'stop-2', 'stop-3', 'stop-4', 'stop-5', 'stop-6', 'stop-7', 'stop-8', 'stop-9', 'stop-10', 'stop-11', 'stop-12', 'stop-13', 'stop-14', 'stop-15', 'stop-16', 'stop-17'];
      
      // For first stop, play both intro and sv-nedelya recordings
      if (index === 0) {
        if (currentAudioRef.current) currentAudioRef.current.pause();
        
        // Play intro first, then sv-nedelya
        const introAudio = new Audio('/audio/intro.m4a');
        currentAudioRef.current = introAudio;
        introAudio.play();
        
        introAudio.onended = () => {
          const svNedelyaAudio = new Audio('/audio/sv-nedelya.m4a');
          currentAudioRef.current = svNedelyaAudio;
          svNedelyaAudio.play();
          svNedelyaAudio.onended = () => {
            setPlayingIndex(null);
            setAudioTime(0);
            setAudioDuration(0);
          };
        };
        
        setLoading(false);
        return;
      }
      
      const audioFile = audioFiles[index];
      
      if (audioFile) {
        const audioRes = await fetch(`/audio/${audioFile}.m4a`);
        if (audioRes.ok) {
          if (currentAudioRef.current) currentAudioRef.current.pause();
          currentAudioRef.current = new Audio(`/audio/${audioFile}.m4a`);
          currentAudioRef.current.play();
          currentAudioRef.current.onended = () => {
            setPlayingIndex(null);
            setAudioTime(0);
            setAudioDuration(0);
          };
          setLoading(false);
          return;
        }
      }
      
      // Fall back to TTS
      const fullText = `${LANDMARKS[index].name}. ${LANDMARKS[index].desc}`;
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText })
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else if (data.audio) {
        if (currentAudioRef.current) currentAudioRef.current.pause();
        currentAudioRef.current = new Audio('data:audio/mpeg;base64,' + data.audio);
        currentAudioRef.current.play();
        currentAudioRef.current.onended = () => {
          setPlayingIndex(null);
          setAudioTime(0);
          setAudioDuration(0);
        };
      }
    } catch (e: any) { setError(e.message); } 
    finally { setLoading(false); }
  };

  // Stable callback — map marker click is always an explicit selection that should zoom
  const handleSelectLandmark = useCallback((i: number) => {
    stopAudio();
    setCurrent(i);
    setSelectVersion(v => v + 1);
    scrollToStop(i);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const next = () => {
    stopAudio();
    setCurrent(c => c < LANDMARKS.length - 1 ? c + 1 : c);
    setSelectVersion(v => v + 1);
    scrollToStop(current + 1);
  };
  
  const prev = () => { 
    stopAudio();
    setCurrent(c => c > 0 ? c - 1 : c);
    setSelectVersion(v => v + 1);
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

  // Format distance for display
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return (meters / 1000).toFixed(1) + ' km';
    }
    return Math.round(meters) + ' m';
  };

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return hours + 'h ' + remainingMins + 'm';
    }
    return mins + ' min';
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <header className="p-3 flex justify-between items-center border-b border-[#282828]">
        <h1 className="text-lg font-bold">Sofia Guide</h1>
        <div className="text-sm text-[#b3b3b3]">
          {LANDMARKS.length} stops • {totalWalkingDistance > 0 ? formatDistance(totalWalkingDistance) + ' • ' + formatDuration(totalWalkingTime) : 'Loading...'}
        </div>
      </header>

      {step === 1 && (
        <div className="p-6">
          <h2 className="text-3xl font-bold mb-2">Discover Sofia</h2>
          <p className="text-[#b3b3b3] mb-8">Your personal audio guide</p>
          <button onClick={() => setStep(2)} className="w-full bg-[#8DC63F] text-black font-bold py-3 rounded-full mb-6">START</button>
          <Link href="/places" className="block bg-[#282828] p-3 rounded-md text-center">Places</Link>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col h-[calc(100dvh-52px-48px)]">
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
                  onClick={() => { stopAudio(); setCurrent(index); setSelectVersion(v => v + 1); }}
                  className={`mb-3 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    current === index 
                      ? 'bg-[#282828] ring-2 ring-[#8DC63F]' 
                      : 'bg-[#1a1a1a] hover:bg-[#222]'
                  }`}
                >
                  {/* Image with number overlay */}
                  <div className="relative">
                    {(landmark.images && landmark.images.length > 0) ? (
                      <img
                        key={imageIndexMap[index] ?? 0}
                        src={landmark.images[imageIndexMap[index] ?? 0]}
                        alt={landmark.name}
                        className="w-full h-44 object-cover transition-opacity duration-700 opacity-100"
                      />
                    ) : (
                      <img
                        src={landmark.image}
                        alt={landmark.name}
                        className="w-full h-44 object-cover"
                      />
                    )}
                    <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-[#8DC63F] text-black font-bold flex items-center justify-center text-sm">
                      {index + 1}
                    </div>

                  </div>
                  
                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-bold text-sm mb-2 line-clamp-1">{landmark.name}</h3>
                    
                    {/* Play button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (playingIndex === index) {
                          stopAudio();
                        } else {
                          // Only change current if clicking a different stop; do NOT zoom (no selectVersion bump)
                          if (current !== index) {
                            setCurrent(index);
                            scrollToStop(index);
                          }
                          playAudio(index);
                        }
                      }}
                      disabled={loading}
                      className={`w-full py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                        playingIndex === index 
                          ? 'bg-red-500 text-white' 
                          : 'bg-[#8DC63F] text-black'
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
                  landmarks={mapLandmarks}
                  currentLandmark={current}
                  onSelectLandmark={handleSelectLandmark}
                  userLocation={null}
                  showRoute={showRoute}
                  isPlaying={playingIndex !== null}
                  selectVersion={selectVersion}
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
                className="flex-1 h-1.5 bg-[#404040] rounded accent-[#8DC63F]" 
              />
              <span className="text-xs text-[#b3b3b3] w-10 text-right">{LANDMARKS.length}</span>
            </div>
            
            {/* Current stop info */}
            <div className="text-center mb-3">
              <h3 className="font-bold">{LANDMARKS[current].name}</h3>
              {current < LANDMARKS.length - 1 && routeInfo[current] && (
                <p className="text-xs text-[#8DC63F] mt-1">
                  → {formatDistance(routeInfo[current].distance)} to next stop ({formatDuration(routeInfo[current].duration)})
                </p>
              )}
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
                className="w-14 h-14 rounded-full bg-[#8DC63F] text-black font-bold flex items-center justify-center hover:scale-105 transition-transform"
              >
                {loading ? '...' : playingIndex === current ? '⏹' : '▶'}
              </button>

              {playingIndex !== null && (
                <div className="flex items-center gap-2 mt-2 w-full max-w-xs">
                  <span className="text-xs text-[#888]">
                    {Math.floor(audioTime / 60)}:{(Math.floor(audioTime % 60)).toString().padStart(2, '0')}
                  </span>
                  <input 
                    type="range" 
                    min="0" 
                    max={audioDuration || 100} 
                    value={audioTime} 
                    onChange={(e) => {
                      const newTime = parseFloat(e.target.value);
                      if (currentAudioRef.current) {
                        currentAudioRef.current.currentTime = newTime;
                        setAudioTime(newTime);
                      }
                    }}
                    className="flex-1 h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#8DC63F]"
                  />
                  <span className="text-xs text-[#888]">
                    {Math.floor(audioDuration / 60)}:{(Math.floor(audioDuration % 60)).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              
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
        <Link href="/" className={step === 1 ? "flex flex-col items-center p-2 text-[#8DC63F]" : "flex flex-col items-center p-2 text-[#b3b3b3]"}>Home</Link>
        {step === 2 ? (
          <button onClick={() => setChatOpen(!chatOpen)} className={chatOpen ? "flex flex-col items-center p-2 text-[#8DC63F]" : "flex flex-col items-center p-2 text-[#b3b3b3]"}>Chat</button>
        ) : (
          <Link href="/places" className="flex flex-col items-center p-2 text-[#b3b3b3]">Places</Link>
        )}
      </nav>
      <ChatBot isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
