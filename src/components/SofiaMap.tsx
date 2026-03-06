'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type Landmark = {
  id: number;
  name: string;
  lat: number;
  lng: number;
};

type Props = {
  landmarks: Landmark[];
  currentLandmark: number;
  onSelectLandmark: (index: number) => void;
  userLocation?: { lat: number; lng: number } | null;
};

export default function SofiaMap({ landmarks, currentLandmark, onSelectLandmark, userLocation }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

     mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [23.3218, 42.6977], // Sofia center
      zoom: 13,
      interactive: true, // Enable map movement/zoom
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update markers when landmarks or current changes
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    // Add markers for each landmark
    landmarks.forEach((landmark, index) => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.cssText = `
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: ${index === currentLandmark ? '#00D47E' : '#475569'};
        border: 3px solid ${index === currentLandmark ? '#00D47E' : '#94a3b8'};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: all 0.3s;
      `;
      el.innerHTML = String(index + 1);
      el.onclick = () => onSelectLandmark(index);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([landmark.lng, landmark.lat])
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Fly to current landmark
    if (landmarks[currentLandmark]) {
      map.current.flyTo({
        center: [landmarks[currentLandmark].lng, landmarks[currentLandmark].lat],
        zoom: 15,
        duration: 1500,
      });
    }
  }, [currentLandmark, landmarks, onSelectLandmark]);

  // Add user location marker
  useEffect(() => {
    if (!map.current || !userLocation) return;

    // Add or update user location marker
    const userEl = document.createElement('div');
    userEl.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #3b82f6;
      border: 3px solid #00D47E;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
    `;

    const userMarker = new mapboxgl.Marker(userEl)
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current!);

    return () => {
      userMarker.remove();
    };
  }, [userLocation]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full"
      style={{ minHeight: '300px' }}
    />
  );
}
