'use client';

import { useState } from 'react';
import Link from 'next/link';

const PLACES = [
  // Restaurants
  { id: 1, name: 'Made in Home', type: 'restaurant', lat: 42.6977, lng: 23.3321, desc: 'Modern Bulgarian cuisine', hours: '10:00 - 23:00' },
  { id: 2, name: 'Shtastliveca', type: 'restaurant', lat: 42.6951, lng: 23.3233, desc: 'Traditional Bulgarian food', hours: '12:00 - 00:00' },
  { id: 3, name: 'The Little Things', type: 'restaurant', lat: 42.6945, lng: 23.3218, desc: 'Fusion cuisine', hours: '12:00 - 22:00' },
  { id: 4, name: 'Divaka', type: 'restaurant', lat: 42.6962, lng: 23.3328, desc: 'Cozy Bulgarian tavern', hours: '11:00 - 01:00' },
  { id: 5, name: 'Pri Orfei', type: 'restaurant', lat: 42.6981, lng: 23.3239, desc: 'Traditional & trendy', hours: '10:00 - 23:00' },
  
  // Cafes
  { id: 6, name: 'Coffee Factory', type: 'cafe', lat: 42.6969, lng: 23.3333, desc: 'Specialty coffee', hours: '08:00 - 20:00' },
  { id: 7, name: 'Krusto', type: 'cafe', lat: 42.6942, lng: 23.3245, desc: 'Famous for banitsa', hours: '07:00 - 19:00' },
  { id: 8, name: 'Filler', type: 'cafe', lat: 42.6958, lng: 23.3312, desc: 'Artisan coffee', hours: '08:00 - 21:00' },
  { id: 9, name: 'Happiness', type: 'cafe', lat: 42.6973, lng: 23.3298, desc: 'Coffee & cake', hours: '08:00 - 22:00' },
  
  // Bars
  { id: 10, name: 'Club 90s', type: 'bar', lat: 42.6948, lng: 23.3205, desc: 'Retro music', hours: '22:00 - 06:00' },
  { id: 11, name: 'Berlin', type: 'bar', lat: 42.6982, lng: 23.3268, desc: 'Cocktails & vibes', hours: '18:00 - 04:00' },
  { id: 12, name: 'The Clock', type: 'bar', lat: 42.6955, lng: 23.3251, desc: 'Rooftop bar', hours: '16:00 - 02:00' },
  { id: 13, name: 'Joy', type: 'bar', lat: 42.7001, lng: 23.3342, desc: 'Live music', hours: '20:00 - 03:00' },
  
  // More landmarks
  { id: 14, name: 'National Theatre', type: 'culture', lat: 42.6968, lng: 23.3275, desc: 'Historic theater', hours: '10:00 - 18:00' },
  { id: 15, name: 'Archaeological Museum', type: 'culture', lat: 42.7011, lng: 23.3358, desc: 'Ancient treasures', hours: '10:00 - 18:00' },
];

const TYPE_ICONS: Record<string, string> = {
  restaurant: '🍽️',
  cafe: '☕',
  bar: '🍷',
  culture: '🏛️',
};

const TYPE_COLORS: Record<string, string> = {
  restaurant: 'bg-orange-500',
  cafe: 'bg-amber-500',
  bar: 'bg-purple-500',
  culture: 'bg-blue-500',
};

export default function PlacesPage() {
  const [filter, setFilter] = useState<string>('all');

  const filteredPlaces = filter === 'all' ? PLACES : PLACES.filter(p => p.type === filter);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">📍 Sofia Local Gems</h1>
            <p className="text-slate-400">Restaurants, cafes, bars & culture</p>
          </div>
          <Link href="/guide" className="text-amber-500 hover:text-amber-400">
            ← Back to Tour
          </Link>
        </header>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'restaurant', 'cafe', 'bar', 'culture'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg capitalize ${
                filter === type 
                  ? 'bg-amber-500 text-slate-900 font-bold' 
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {type === 'all' ? '🏁 All' : `${TYPE_ICONS[type]} ${type}`}
            </button>
          ))}
        </div>

        {/* Places Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredPlaces.map((place) => (
            <div 
              key={place.id} 
              className="bg-slate-800 rounded-xl p-4 flex gap-4"
            >
              <div className={`w-12 h-12 ${TYPE_COLORS[place.type]} rounded-lg flex items-center justify-center text-2xl flex-shrink-0`}>
                {TYPE_ICONS[place.type]}
              </div>
              <div>
                <h3 className="font-bold text-lg">{place.name}</h3>
                <p className="text-slate-400 text-sm">{place.desc}</p>
                <p className="text-slate-500 text-xs mt-1">🕐 {place.hours}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
