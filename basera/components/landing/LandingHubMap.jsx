'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';

const CITIES_COORDS = [
  { name: 'Bengaluru', slug: 'bengaluru', coords: [12.9716, 77.5946], desc: 'Silicon Valley Hub', listings: 12 },
  { name: 'Mumbai', slug: 'mumbai', coords: [19.0760, 72.8777], desc: 'Finance & Sea Link', listings: 8 },
  { name: 'Delhi NCR', slug: 'delhi', coords: [28.6139, 77.2090], desc: 'Capital Territory', listings: 47 },
  { name: 'Hyderabad', slug: 'hyderabad', coords: [17.3850, 78.4867], desc: 'Pearl City Tech', listings: 15 },
  { name: 'Pune', slug: 'pune', coords: [18.5204, 73.8567], desc: 'Oxford of the East', listings: 6 }
];

export default function LandingHubMap() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[350px] bg-slate-50 flex flex-col items-center justify-center text-xs font-semibold text-gray-400 border border-outline rounded-3xl">
        <span className="material-symbols-outlined text-[24px] text-gray-300 animate-spin mb-1">progress_activity</span>
        <span>Loading Hub Map...</span>
      </div>
    );
  }

  // Custom marker icon creation (safe client check)
  const pulsingIcon = typeof window !== 'undefined' ? L.divIcon({
    className: 'custom-pulsing-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-6 h-6 bg-indigo-500/30 rounded-full animate-ping"></div>
        <div class="relative w-3.5 h-3.5 bg-indigo-600 border border-white rounded-full shadow-md"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  }) : null;

  return (
    <div className="w-full h-[400px] md:h-[450px] relative rounded-3xl overflow-hidden border border-outline shadow-lg bg-gray-50">
      <MapContainer
        center={[20.5937, 78.9629]} // Centered on India
        zoom={5}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // Modern elegant light map theme
        />
        {CITIES_COORDS.map(city => (
          <Marker
            key={city.slug}
            position={city.coords}
            icon={pulsingIcon || undefined}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-3 min-w-[160px] flex flex-col gap-2 font-plus-jakarta">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h4 className="font-extrabold text-xs text-primary leading-none uppercase tracking-wide">{city.name} Hub</h4>
                </div>
                <p className="text-[10px] text-gray-400 font-bold leading-normal uppercase">{city.desc}</p>
                <div className="text-[10px] font-bold text-indigo-600 flex justify-between items-center mt-1 bg-indigo-50/50 px-2 py-1 rounded-lg border border-indigo-100/50">
                  <span>Listings</span>
                  <span>{city.listings}+ active</span>
                </div>
                <Link
                  href={`/${city.slug}`}
                  className="w-full bg-primary text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center block mt-1 hover:opacity-90 active:scale-98 transition-all"
                >
                  Explore Hub
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Pulsing style injected inline for leaflet divIcons */}
      <style jsx global>{`
        .leaflet-container {
          background: #f8fafc !important;
        }
        .leaflet-bar {
          border: 1px solid rgba(15, 23, 42, 0.08) !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
          border-radius: 12px !important;
          overflow: hidden;
        }
        .leaflet-bar a {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-bottom: 1px solid rgba(15, 23, 42, 0.05) !important;
        }
        .leaflet-bar a:hover {
          background-color: #f8fafc !important;
        }
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          border-radius: 18px !important;
          padding: 0 !important;
          border: 1px solid rgba(15, 23, 42, 0.05) !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08) !important;
        }
        .custom-leaflet-popup .leaflet-popup-content {
          margin: 0 !important;
        }
      `}</style>
    </div>
  );
}
