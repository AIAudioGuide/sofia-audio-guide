'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type Landmark = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  viewingPoint?: { lat: number; lng: number };
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

     mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [23.3218, 42.6977],
      zoom: 13,
      interactive: true,
    });

    map.current.on('load', () => {
      // Map style loaded, ready for route additions
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!map.current) return;

    const addMarkers = () => {
      markers.current.forEach(m => m.remove());
      markers.current = [];

      landmarks.forEach((landmark, index) => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.cssText = `
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: ${index === currentLandmark ? '#00D47E' : '#1a1a1a'};
          border: 3px solid ${index === currentLandmark ? '#00D47E' : '#475569'};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          color: ${index === currentLandmark ? '#000' : '#fff'};
          transition: all 0.3s;
          box-shadow: ${index === currentLandmark ? '0 0 15px rgba(0,212,126,0.6)' : 'none'};
        `;
        el.innerHTML = String(index + 1);
        el.onclick = () => onSelectLandmark(index);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([landmark.viewingPoint?.lng || landmark.lng, landmark.viewingPoint?.lat || landmark.lat])
          .addTo(map.current!);

        markers.current.push(marker);
      });

      if (landmarks[currentLandmark]) {
        const vp = landmarks[currentLandmark].viewingPoint;
        map.current!.flyTo({
          center: [vp?.lng || landmarks[currentLandmark].lng, vp?.lat || landmarks[currentLandmark].lat],
          zoom: 14,
          duration: 1000,
        });
      }
    };

    if (map.current.isStyleLoaded()) {
      addMarkers();
    } else {
      map.current.once('load', addMarkers);
    }
  }, [currentLandmark, landmarks, onSelectLandmark]);

  // Show route connecting all stops
  useEffect(() => {
    if (!map.current || !showRoute) return;

    const addRoute = () => {
      // Remove existing route
      if (map.current!.getLayer(routeLayerId)) {
        map.current!.removeLayer(routeLayerId);
      }
      if (map.current!.getSource(routeLayerId)) {
        map.current!.removeSource(routeLayerId);
      }

      // Build route coordinates from all landmarks (using viewingPoint)
      const coordinates = landmarks.map(l => [l.viewingPoint?.lng || l.lng, l.viewingPoint?.lat || l.lat] as [number, number]);

      // Add user location if available
      if (userLocation) {
        coordinates.unshift([userLocation.lng, userLocation.lat]);
      }

      // Create a simple straight-line route (in production, you'd use Mapbox Directions API)
      map.current!.addSource(routeLayerId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      });

      map.current!.addLayer({
        id: routeLayerId,
        type: 'line',
        source: routeLayerId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#00D47E',
          'line-width': 3,
          'line-opacity': 0.7,
          'line-dasharray': [2, 1]
        }
      });

      onRouteShown?.(true);

      // Fit bounds to show entire route
      if (coordinates.length > 1) {
        const bounds = coordinates.reduce((b, coord) => {
          return b.extend(coord as [number, number]);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current!.fitBounds(bounds, { padding: 40, duration: 1000 });
      }
    };

    // Wait for map style to be loaded before adding route
    if (map.current.isStyleLoaded()) {
      addRoute();
    } else {
      map.current.once('load', addRoute);
    }

  }, [showRoute, landmarks, userLocation, onRouteShown]);

  // User location marker
  useEffect(() => {
    if (!map.current || !userLocation) return;

    const userEl = document.createElement('div');
    userEl.style.cssText = `
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #3b82f6;
      border: 3px solid white;
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
