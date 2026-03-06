'use client';

import { useEffect, useRef, useState } from 'react';
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
  showRoute?: boolean;
  onRouteShown?: (shown: boolean) => void;
};

export default function SofiaMap({ landmarks, currentLandmark, onSelectLandmark, userLocation, showRoute, onRouteShown }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const routeLayerId = 'route';

  useEffect(() => {
    if (!mapContainer.current) return;

     mapboxgl.accessToken = 'process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [23.3218, 42.6977],
      zoom: 13,
      interactive: true,
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!map.current) return;

    markers.current.forEach(m => m.remove());
    markers.current = [];

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

    if (landmarks[currentLandmark]) {
      map.current.flyTo({
        center: [landmarks[currentLandmark].lng, landmarks[currentLandmark].lat],
        zoom: 15,
        duration: 1500,
      });
    }
  }, [currentLandmark, landmarks, onSelectLandmark]);

  // Show route when toggle is on
  useEffect(() => {
    if (!map.current || !showRoute || !userLocation) return;

    const current = landmarks[currentLandmark];
    if (!current) return;

    // Remove existing route
    if (map.current.getLayer(routeLayerId)) {
      map.current.removeLayer(routeLayerId);
    }
    if (map.current.getSource(routeLayerId)) {
      map.current.removeSource(routeLayerId);
    }

    // Get directions from user location to current landmark
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${userLocation.lng},${userLocation.lat};${current.lng},${current.lat}?geometries=geojson&access_token=process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes[0]) {
          const route = data.routes[0].geometry;

          map.current?.addSource(routeLayerId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route
            }
          });

          map.current?.addLayer({
            id: routeLayerId,
            type: 'line',
            source: routeLayerId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#00D47E',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });

          onRouteShown?.(true);

          // Fit bounds to show entire route
          const coords = route.coordinates;
          const bounds = coords.reduce((b, coord) => {
            return b.extend(coord);
          }, new mapboxgl.LngLatBounds(coords[0], coords[0]));

          map.current?.fitBounds(bounds, { padding: 50 });
        }
      })
      .catch(err => console.error('Route error:', err));

    return () => {
      if (map.current?.getLayer(routeLayerId)) {
        map.current.removeLayer(routeLayerId);
      }
      if (map.current?.getSource(routeLayerId)) {
        map.current.removeSource(routeLayerId);
      }
    };
  }, [showRoute, userLocation, currentLandmark, landmarks, onRouteShown]);

  // User location marker
  useEffect(() => {
    if (!map.current || !userLocation) return;

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
