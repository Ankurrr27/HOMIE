'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/layout/Navbar';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet Map to disable Server-Side Rendering (SSR) issues
const LandingHubMap = dynamic(
  () => import('@/components/landing/LandingHubMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-slate-50 flex flex-col items-center justify-center text-xs font-bold text-gray-400 gap-3 border border-outline rounded-3xl">
        <span className="material-symbols-outlined text-[32px] text-gray-300 animate-spin">progress_activity</span>
        <span>Loading Hub Map...</span>
      </div>
    )
  }
);

const CITIES = [
  { name: 'Bengaluru', slug: 'bengaluru', icon: '🌳', desc: 'Silicon Valley & Cafes', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80' },
  { name: 'Mumbai', slug: 'mumbai', icon: '🌊', desc: 'Sea Breeze & Bollywood', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80' },
  { name: 'Delhi NCR', slug: 'delhi', icon: '🏛️', desc: 'Heritage & Street Food', image: '/Delhi/delhi1.jpg' },
  { name: 'Hyderabad', slug: 'hyderabad', icon: '🏰', desc: 'Pearls & Cyber Hubs', image: '/hyderabad/pexels-dropshado-11321242.jpg' },
  { name: 'Pune', slug: 'pune', icon: '⛰️', desc: 'Hills & Student Culture', image: '/pune/pexels-ankit-rainloure-1425442-14441811.jpg' }
];

export default function LandingPage() {
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    '/Delhi/delhi1.jpg',
    '/hyderabad/pexels-dropshado-11321242.jpg',
    '/pune/pexels-ankit-rainloure-1425442-14441811.jpg'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const filteredCities = CITIES.filter(city => 
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="text-on-surface font-body-md antialiased min-h-screen flex flex-col bg-pattern relative overflow-x-hidden">
      
      {/* Full-Bleed Seamless City Slideshow Background Watermark (No Edges/Boxes) */}
      <div className="absolute top-0 left-0 right-0 h-[620px] -z-20 overflow-hidden pointer-events-none select-none">
        {heroSlides.map((img, idx) => (
          <img
            key={img}
            src={img}
            alt="Direct Relocation Hub"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1500ms] ease-in-out ${idx === currentSlide ? 'opacity-[0.15] scale-102 blur-[5px]' : 'opacity-0 scale-100 blur-[5px]'}`}
          />
        ))}
        {/* Soft vignette to fade the slideshow bottom edge seamlessly into the page background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#faf9f6] z-10"></div>
      </div>

      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col relative">
        
        {/* Harmonized Light-Theme Hero Section (Seamless Content Layout) */}
        <section className="relative w-full pt-20 pb-16 px-6 max-w-5xl mx-auto text-center flex flex-col items-center gap-6 z-10">

          <div className="inline-flex items-center gap-2 bg-indigo-50/60 border border-indigo-100/70 px-4 py-1.5 rounded-full shadow-[0_2px_15px_rgba(99,102,241,0.05)] backdrop-blur-md">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700">
              ⚡ India&apos;s First Direct Relocation Engine
            </span>
          </div>
          
          <h1 className="font-plus-jakarta text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.98] max-w-5xl text-primary select-none">
            Settle in like a <span className="shimmer-text">local.</span> <br />
            <span className="font-devanagari text-primary text-4xl sm:text-6xl lg:text-7xl font-black leading-tight block mt-1.5">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-500 to-rose-500 animate-text-glow font-extrabold">बिना ब्रोकर</span>, घर जैसा एहसास।
            </span>
          </h1>

          <p className="text-sm md:text-base text-gray-500 font-semibold max-w-2xl leading-relaxed mt-1">
            Skip broker lists and fake pictures. We visit and audit every stay, map transport corridors, test regional meals, and verify helper contacts so you move with absolute confidence.
          </p>

          {/* Quick Search Floating Glassmorphic Bar with Action Button */}
          <div className="w-full max-w-xl mt-2 relative group z-30">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-600 to-rose-500 rounded-full blur opacity-10 group-hover:opacity-15 transition duration-300"></div>
            <div className="relative flex items-center w-full">
              <input 
                type="text"
                placeholder="Search your destination city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/90 backdrop-blur-md border border-outline rounded-full py-4.5 pl-12 pr-28 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm font-semibold outline-none text-primary shadow-xl hover:shadow-2xl hover:border-indigo-300/40"
              />
              <span className="absolute left-4 top-[17px] text-gray-400 material-symbols-outlined text-[20px]">search</span>
              <button 
                type="button"
                onClick={() => {
                  const citiesSection = document.getElementById('cities');
                  if (citiesSection) {
                    citiesSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="absolute right-2 top-2 bottom-2 bg-primary text-white px-6 rounded-full text-[10px] font-extrabold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer"
              >
                Explore
                <span className="material-symbols-outlined text-[12px] text-white">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Active hubs indicators */}
          <span className="text-[10px] text-indigo-600/60 font-extrabold uppercase tracking-widest mt-2 select-none">
            📍 Active Hubs: Delhi • Hyderabad • Pune
          </span>
        </section>

        {/* City Hub Cards Section */}
        <section id="cities" className="py-24 bg-primary-container/30 border-y border-outline-variant/65 relative z-10">
          <div className="max-w-max-width-desktop mx-auto px-6">
            <div className="flex flex-col gap-1 text-center md:text-left mb-12">
              <h2 className="font-plus-jakarta text-3xl font-extrabold text-primary tracking-tight">Active Hubs</h2>
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Select your new destination to explore listings</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {filteredCities.length === 0 ? (
                <p className="col-span-full text-center text-xs font-bold text-gray-400 py-12">No active hubs match your query.</p>
              ) : (
                filteredCities.map(city => (
                  <Link 
                    key={city.slug}
                    href={`/${city.slug}`}
                    className="group relative h-80 rounded-3xl overflow-hidden border border-outline/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-end p-6"
                  >
                    <img 
                      src={city.image} 
                      alt={city.name} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out z-0" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/35 to-transparent z-10 group-hover:opacity-95 transition-opacity duration-300"></div>
                    
                    <div className="relative z-20 text-white flex flex-col gap-1">
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-xl mb-1.5 group-hover:scale-110 transition-transform duration-300">
                        {city.icon}
                      </div>
                      <h3 className="font-plus-jakarta text-lg font-bold tracking-tight text-white">{city.name}</h3>
                      <p className="text-[10px] text-white/70 font-bold tracking-widest uppercase leading-snug">{city.desc}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Services Bento Grid Section */}
        <section id="services" className="py-28 max-w-max-width-desktop mx-auto px-6 w-full relative z-10">
          <div className="text-center mb-20 flex flex-col items-center gap-1">
            <h2 className="font-plus-jakarta text-3xl font-extrabold text-primary tracking-tight">Relocate in minutes.</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Everything you need to settle in</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Bento Card 1 */}
            <div className="glass-panel p-8 rounded-3xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-5 border border-primary-container">
              <div className="w-12 h-12 rounded-2xl bg-primary-container border border-primary/5 flex items-center justify-center text-xl text-primary shadow-sm">
                🏠
              </div>
              <div>
                <h3 className="font-plus-jakarta text-lg font-bold text-primary mb-2">Verified Stays</h3>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                  Broker-free properties with fully audited agreements, coordinate mapping details, and exact deposit parameters.
                </p>
              </div>
            </div>

            {/* Bento Card 2 */}
            <div className="glass-panel p-8 rounded-3xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-5 border border-secondary-container">
              <div className="w-12 h-12 rounded-2xl bg-secondary-container border border-secondary/15 flex items-center justify-center text-xl text-secondary shadow-sm">
                🍱
              </div>
              <div>
                <h3 className="font-plus-jakarta text-lg font-bold text-primary mb-2">Tiffin & Messes</h3>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                  Discover local home kitchens delivering regional tiffins. Free test trials and transparent subscription models.
                </p>
              </div>
            </div>

            {/* Bento Card 3 */}
            <div className="glass-panel p-8 rounded-3xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-5 border border-amber-100">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl text-amber-600 shadow-sm">
                🧹
              </div>
              <div>
                <h3 className="font-plus-jakarta text-lg font-bold text-primary mb-2">Verified Helpers</h3>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                  Cooks, maids, and housekeepers with background audits, standard rates, and active contact numbers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Basera Guarantee */}
        <section id="why-basera" className="py-24 bg-white/40 border-t border-outline/50 relative z-10">
          <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center gap-6">
            <h2 className="font-plus-jakarta text-3xl font-extrabold text-primary tracking-tight">The Local Guide Standard</h2>
            <p className="text-xs.5 text-gray-500 font-semibold max-w-2xl leading-relaxed">
              We visit and audit every flat, kitchen, and helper resource listed. Zero brokerage fees, zero hidden markup subscriptions, and raw contact details.
            </p>
            <div className="flex gap-10 justify-center flex-wrap mt-4 text-[10px] font-bold text-primary tracking-widest uppercase">
              <span className="flex items-center gap-1">✔ Zero Brokerage</span>
              <span className="flex items-center gap-1">✔ Direct Audited Stays</span>
              <span className="flex items-center gap-1">✔ Verified Meals</span>
            </div>
          </div>
        </section>

        {/* Bottom Interactive Coverage Map Checker */}
        <section className="py-24 bg-white border-t border-outline/50 relative z-10">
          <div className="max-w-max-width-desktop mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
            
            {/* Left side: Directory list & text */}
            <div className="w-full lg:w-5/12 flex flex-col items-start gap-5 text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-xl shadow-sm">
                📍 Interactive Directory
              </span>
              <h2 className="font-plus-jakarta text-3xl font-extrabold text-primary tracking-tight">
                Check Hub Coverage
              </h2>
              <p className="text-sm text-gray-500 font-semibold leading-relaxed">
                Hover or click on the map pins to view available relocation services, active listings count, and regional support networks.
              </p>

              {/* Quick links directory */}
              <div className="w-full flex flex-col gap-3 mt-2">
                {CITIES.map(city => (
                  <Link 
                    key={city.slug} 
                    href={`/${city.slug}`}
                    className="flex justify-between items-center bg-gray-50/50 hover:bg-indigo-50/30 p-3 rounded-2xl border border-outline/65 hover:border-indigo-200/50 transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{city.icon}</span>
                      <span className="text-sm font-bold text-primary group-hover:text-indigo-600 transition-colors">{city.name}</span>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all">arrow_forward</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side: Interactive map */}
            <div className="w-full lg:w-7/12 h-[380px] md:h-[420px] relative flex-shrink-0">
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/5 to-pink-500/5 rounded-[32px] blur-xl opacity-60"></div>
              <div className="h-full w-full relative z-10">
                <LandingHubMap />
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Grounded Premium Themed Dark Footer */}
      <footer className="bg-primary text-white/90 border-t border-primary-container/10 pt-20 pb-10 relative z-10">
        <div className="max-w-max-width-desktop mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-16 text-left">
          <div className="flex flex-col gap-5">
            <Link href="/" className="font-plus-jakarta text-2xl font-extrabold text-white flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[28px] text-white">home_pin</span>
              <span>Basera</span>
            </Link>
            <p className="text-xs text-white/50 font-semibold leading-relaxed">
              Settle in like a local. India&apos;s premium relocation guide.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Services</h4>
            <Link href="/onboard" className="text-xs font-semibold text-white/60 hover:text-white transition-colors">Stays & PGs</Link>
            <Link href="/onboard" className="text-xs font-semibold text-white/60 hover:text-white transition-colors">Tiffin Subscriptions</Link>
            <Link href="/onboard" className="text-xs font-semibold text-white/60 hover:text-white transition-colors">Maids & Cook References</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Partnership</h4>
            <Link href="/onboard" className="text-xs font-semibold text-white/60 hover:text-white transition-colors">Register Stay Node</Link>
            <Link href="/onboard" className="text-xs font-semibold text-white/60 hover:text-white transition-colors">List Meal Service</Link>
            <Link href="/onboard" className="text-xs font-semibold text-white/60 hover:text-white transition-colors">Refer Helpers</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Legal</h4>
            <a href="#" className="text-xs font-semibold text-white/60 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs font-semibold text-white/60 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-xs font-semibold text-white/60 hover:text-white transition-colors">Support Desk</a>
          </div>
        </div>

        <div className="max-w-max-width-desktop mx-auto px-6 pt-10 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">
          <p>© {new Date().getFullYear()} Basera. Designed for clarity.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white/80">Privacy</a>
            <a href="#" className="hover:text-white/80">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
