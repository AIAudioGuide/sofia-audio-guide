'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type Landmark = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  viewingPoint?: { lat: number; lng: number };
  waypointsToNext?: { lat: number; lng: number }[];
  // When true, waypointsToNext are used as-is (exact polyline), Mapbox routing skipped
  exactPath?: boolean;
};


type Props = {
  landmarks: Landmark[];
  currentLandmark: number;
  onSelectLandmark: (index: number) => void;
  userLocation?: { lat: number; lng: number } | null;
  showRoute?: boolean;
  onRouteShown?: (shown: boolean) => void;
  isPlaying?: boolean;
  // Incremented each time the user explicitly selects a stop (triggers zoom)
  selectVersion?: number;
};

export default function SofiaMap({ landmarks, currentLandmark, onSelectLandmark, userLocation, showRoute, onRouteShown, isPlaying, selectVersion = 0 }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const landmarksRef = useRef(landmarks);
  landmarksRef.current = landmarks;
  const routeLayerId = 'route';
  
  // Track last selectVersion to detect explicit user selections
  const lastSelectVersionRef = useRef<number>(-1);

  useEffect(() => {
    if (!mapContainer.current) return;

     mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [23.3218, 42.6977],
      zoom: 16,
      interactive: true,
    });

    map.current.on('load', () => {
      // Map style loaded, ready for route additions
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Initialize markers only once
  useEffect(() => {
    if (!map.current) return;

    const addMarkers = () => {
      // Don't recreate if already have markers
      if (markers.current.length > 0) return;
      
      landmarks.forEach((landmark, index) => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.cssText = `
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #1a1a1a;
          border: 3px solid #475569;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          color: #fff;
        `;
        el.innerHTML = String(index + 1);
        el.onclick = () => onSelectLandmark(index);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([landmark.viewingPoint?.lng || landmark.lng, landmark.viewingPoint?.lat || landmark.lat])
          .addTo(map.current!);

        markers.current.push(marker);
      });
    };

    if (map.current.isStyleLoaded()) {
      addMarkers();
    } else {
      map.current.once('load', addMarkers);
    }
  }, [landmarks, onSelectLandmark]);

  // Update marker styles when currentLandmark changes (without recreating)
  useEffect(() => {
    markers.current.forEach((marker, index) => {
      const el = marker.getElement();
      const isActive = index === currentLandmark;
      el.style.background = isActive ? '#8DC63F' : '#1a1a1a';
      el.style.borderColor = isActive ? '#8DC63F' : '#475569';
      el.style.color = isActive ? '#000' : '#fff';
      el.style.boxShadow = isActive ? '0 0 15px rgba(0,212,126,0.6)' : 'none';
    });
  }, [currentLandmark]);

  // Zoom to landmark ONLY when user explicitly selects a stop (selectVersion increments)
  useEffect(() => {
    if (!map.current || currentLandmark < 0) return;
    if (selectVersion <= lastSelectVersionRef.current) return;

    lastSelectVersionRef.current = selectVersion;

    const landmark = landmarksRef.current[currentLandmark];
    if (!landmark) return;

    const vp = landmark.viewingPoint;
    const center = [vp?.lng || landmark.lng, vp?.lat || landmark.lat] as [number, number];

    setTimeout(() => {
      if (!map.current) return;
      map.current.flyTo({ center, zoom: 17, duration: 800 });
    }, 50);
  }, [currentLandmark, selectVersion]);


  // Show route connecting all stops
  useEffect(() => {
    if (!map.current || !showRoute || !landmarks.length) return;

    const addRoute = async () => {
      // Wait for map to be loaded
      if (!map.current!.isStyleLoaded()) {
        await new Promise(resolve => map.current!.once('load', resolve));
      }
      // Remove existing route
      if (map.current!.getLayer(routeLayerId)) {
        map.current!.removeLayer(routeLayerId);
      }
      if (map.current!.getSource(routeLayerId)) {
        map.current!.removeSource(routeLayerId);
      }

      // Build the full route by calling Mapbox Directions per segment.
      // waypointsToNext are passed as Mapbox routing hints (not straight lines),
      // letting us nudge specific segments without affecting others.
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

      // Build stop list: optional user location + all landmark viewingPoints
      const stops: [number, number][] = landmarks.map(l => {
        const vp = l.viewingPoint;
        return [vp?.lng || l.lng, vp?.lat || l.lat] as [number, number];
      });
      if (userLocation) {
        stops.unshift([userLocation.lng, userLocation.lat]);
      }

      // Fetch one segment from Mapbox walking directions
      const fetchSegment = async (segCoords: [number, number][]): Promise<[number, number][]> => {
        const coordString = segCoords.map(c => `${c[0]},${c[1]}`).join(';');
        const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${encodeURIComponent(coordString)}?geometries=geojson&overview=full&access_token=${token}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (data.routes?.[0]) return data.routes[0].geometry.coordinates as [number, number][];
          }
        } catch { /* fall through */ }
        // Fallback: straight line for this segment
        return segCoords;
      };

      // Determine which landmark index corresponds to each stop index
      // (offset by 1 if userLocation is prepended)
      const offset = userLocation ? 1 : 0;

      // Fetch all segments in parallel
      const segmentPromises = stops.slice(0, -1).map((start, i) => {
        const end = stops[i + 1];
        const landmarkIdx = i - offset; // index into landmarks array
        const landmark = landmarkIdx >= 0 ? landmarks[landmarkIdx] : null;
        const wpts: [number, number][] = landmark?.waypointsToNext
          ? landmark.waypointsToNext.map(wp => [wp.lng, wp.lat] as [number, number])
          : [];
        // exactPath: skip Mapbox, use waypoints as a direct polyline (guaranteed path)
        if (landmark?.exactPath && wpts.length > 0) {
          console.log(`[route] segment ${i} (${landmark.name}): EXACT PATH`, wpts);
          return Promise.resolve([start, ...wpts, end] as [number, number][]);
        }
        console.log(`[route] segment ${i} (${landmark?.name ?? 'user→stop1'}): Mapbox, exactPath=${landmark?.exactPath}, wpts=${wpts.length}`);
        return fetchSegment([start, ...wpts, end]);
      });

      const segments = await Promise.all(segmentPromises);

      // Stitch segments together (skip duplicate first point of each subsequent segment)
      const allCoords: [number, number][] = [];
      segments.forEach((seg, i) => {
        allCoords.push(...(i === 0 ? seg : seg.slice(1)));
      });

      const fallbackCoords = stops; // straight lines as last resort
      map.current!.addSource(routeLayerId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: allCoords.length > 1 ? allCoords : fallbackCoords
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
          'line-color': '#8DC63F',
          'line-width': 5
        }
      });

      onRouteShown?.(true);

      // Fit bounds to show entire route
      if (stops.length > 1) {
        const bounds = stops.reduce((b, coord) => {
          return b.extend(coord as [number, number]);
        }, new mapboxgl.LngLatBounds(stops[0], stops[0]));

        map.current!.fitBounds(bounds, { padding: 40, duration: 1000 });
      }
    };

    addRoute();
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
