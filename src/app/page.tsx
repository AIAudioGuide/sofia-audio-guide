'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#121212] text-white pb-20">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#121212] p-6 pb-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl">⛪</div>
          <div className="absolute top-20 right-20 text-4xl">🕌</div>
          <div className="absolute bottom-10 left-1/3 text-5xl">🕍</div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 relative z-10">
          Explore Sofia on Foot
        </h1>
        <p className="text-xl text-[#b3b3b3] mb-2 relative z-10">
          Your Personal Audio Guide
        </p>
        <p className="text-[#888] mb-8 max-w-md relative z-10">
          Discover 16 landmarks in a 2km walk through 7000 years of history
        </p>
        
        <Link href="/guide" className="inline-block bg-[#8DC63F] hover:bg-[#00c470] text-black font-bold py-4 px-8 rounded-full text-lg relative z-10">
          Start Tour — €10
        </Link>
        
        <p className="text-[#666] text-sm mt-4 relative z-10">
          🎧 Professional narration • 🗺️ Interactive map • 📱 Works on your phone
        </p>
      </div>

      {/* Why It's Unique */}
      <div className="px-6 -mt-20 relative z-20">
        <h2 className="text-2xl font-bold mb-4">Why It's Unique</h2>
        <div className="space-y-3">
          <div className="bg-[#1a1a1a] p-5 rounded-xl flex items-start gap-4">
            <span className="text-3xl">🎙️</span>
            <div>
              <h3 className="font-bold text-lg">Your Personal Voice</h3>
              <p className="text-[#b3b3b3]">Authentic, personal narration that feels like a friend showing you around</p>
            </div>
          </div>
          <div className="bg-[#1a1a1a] p-5 rounded-xl flex items-start gap-4">
            <span className="text-3xl">🚶</span>
            <div>
              <h3 className="font-bold text-lg">Go At Your Own Pace</h3>
              <p className="text-[#b3b3b3]">Self-guided tour - start, pause, and continue whenever you want</p>
            </div>
          </div>
          <div className="bg-[#1a1a1a] p-5 rounded-xl flex items-start gap-4">
            <span className="text-3xl">📍</span>
            <div>
              <h3 className="font-bold text-lg">Smart Navigation</h3>
              <p className="text-[#b3b3b3]">Interactive map with zoom-to-location as you listen - works without GPS</p>
            </div>
          </div>
          <div className="bg-[#1a1a1a] p-5 rounded-xl flex items-start gap-4">
            <span className="text-3xl">💬</span>
            <div>
              <h3 className="font-bold text-lg">Ask Questions</h3>
              <p className="text-[#b3b3b3]">Chat with AI about any landmark - get extra insights instantly</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="px-6 mt-10">
        <h2 className="text-2xl font-bold mb-6">How It Works</h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          <div className="flex-shrink-0 w-32 text-center">
            <div className="w-16 h-16 bg-[#8DC63F] rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">💳</span>
            </div>
            <h3 className="font-bold mb-1">1. Buy</h3>
            <p className="text-[#888] text-sm">Purchase tour access</p>
          </div>
          <div className="flex-shrink-0 w-32 text-center">
            <div className="w-16 h-16 bg-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🔗</span>
            </div>
            <h3 className="font-bold mb-1">2. Get Link</h3>
            <p className="text-[#888] text-sm">Receive your access</p>
          </div>
          <div className="flex-shrink-0 w-32 text-center">
            <div className="w-16 h-16 bg-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🎧</span>
            </div>
            <h3 className="font-bold mb-1">3. Explore</h3>
            <p className="text-[#888] text-sm">Start walking!</p>
          </div>
        </div>
      </div>

      {/* Preview Stops */}
      <div className="px-6 mt-10">
        <h2 className="text-2xl font-bold mb-4">What You'll Discover</h2>
        <p className="text-[#888] mb-4">16 stops including:</p>
        <div className="space-y-3">
          {[
            { name: 'Sveta Nedelya Cathedral', desc: '10th century Orthodox cathedral in the heart of Sofia', emoji: '⛪' },
            { name: 'St. Alexander Nevski Cathedral', desc: 'Iconic golden-domed cathedral, symbol of Bulgaria', emoji: '✨' },
            { name: 'Square of Tolerance', desc: 'Where mosque, synagogue & church stand together', emoji: '🕍' },
            { name: 'Ancient Roman Ruins', desc: '2,000 year old Serdica remains under the city', emoji: '🏛️' },
          ].map((stop) => (
            <div key={stop.name} className="bg-[#1a1a1a] p-4 rounded-xl flex items-center gap-4">
              <span className="text-4xl">{stop.emoji}</span>
              <div>
                <h3 className="font-bold">{stop.name}</h3>
                <p className="text-[#888] text-sm">{stop.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="px-6 mt-10">
        <h2 className="text-2xl font-bold mb-4">What Guests Say</h2>
        <div className="space-y-3">
          <div className="bg-[#1a1a1a] p-5 rounded-xl">
            <div className="flex gap-1 mb-3">⭐⭐⭐⭐⭐</div>
            <p className="text-[#ccc] mb-3">"Amazing tour! The narration was fascinating and the map made it so easy to follow. Best way to see Sofia!"</p>
            <p className="text-[#666] text-sm">- Sarah from UK</p>
          </div>
          <div className="bg-[#1a1a1a] p-5 rounded-xl">
            <div className="flex gap-1 mb-3">⭐⭐⭐⭐⭐</div>
            <p className="text-[#ccc] mb-3">"Loved the personal touch of having a real voice guide us through the city's history. Highly recommend!"</p>
            <p className="text-[#666] text-sm">- Marco from Italy</p>
          </div>
          <div className="bg-[#1a1a1a] p-5 rounded-xl">
            <div className="flex gap-1 mb-3">⭐⭐⭐⭐⭐</div>
            <p className="text-[#ccc] mb-3">"Perfect way to explore Sofia at our own pace. The kids loved it too!"</p>
            <p className="text-[#666] text-sm">- Family from Germany</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 mt-10 pb-10">
        <div className="bg-gradient-to-r from-[#8DC63F] to-[#00b368] p-8 rounded-2xl text-center">
          <h2 className="text-2xl font-bold text-black mb-2">Ready to Explore Sofia?</h2>
          <p className="text-black/70 mb-6">16 landmarks • 2km walk • 7000 years of history</p>
          <Link href="/guide" className="inline-block bg-black hover:bg-gray-900 text-white font-bold py-4 px-10 rounded-full text-lg">
            Start Tour — €10
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 text-center text-[#666] text-sm">
        <p>Questions? Contact us</p>
        <p className="mt-2">© 2026 Sofia Audio Guide</p>
      </div>
    </div>
  );
}
