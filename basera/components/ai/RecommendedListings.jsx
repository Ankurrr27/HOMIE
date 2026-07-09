'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function RecommendedListings({ listingId, currentCitySlug = 'bengaluru' }) {
  const [recommendations, setRecommendations] = useState([]);
  const [recType, setRecType] = useState('top_rated');
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = useCallback(async () => {
    try {
      const res = await fetch(`/api/ai/recommendations?listingId=${listingId}`);
      const json = await res.json();
      if (json.success) {
        setRecommendations(json.data);
        setRecType(json.type);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecommendations();
    }, 0);
    return () => clearTimeout(timer);
  }, [listingId, fetchRecommendations]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2 py-4">
        <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin self-center"></span>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 mt-12">
      <div>
        <h3 className="font-plus-jakarta text-xl font-extrabold text-primary tracking-tight">
          {recType === 'collaborative' ? 'Recommended Stays for You' : 'Popular Verified Stays'}
        </h3>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
          {recType === 'collaborative' ? 'Based on saves by other local residents' : 'Highest rated stays in this city'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        {recommendations.slice(0, 4).map(listing => (
          <Link 
            key={listing._id}
            href={`/${currentCitySlug}/${listing.category?.slug || 'stays'}/${listing._id}`}
            className="bg-white rounded-xl border border-outline overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col group cursor-pointer"
          >
            <div className="relative h-32 bg-gray-100 overflow-hidden">
              {listing.images?.[0] ? (
                <img 
                  src={listing.images[0]} 
                  alt={listing.name} 
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <span className="material-symbols-outlined text-3xl">image</span>
                </div>
              )}
              <span className="absolute top-2.5 left-2.5 bg-white/95 text-primary text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                {listing.category?.name || 'Stay'}
              </span>
            </div>

            <div className="p-4 flex-grow flex flex-col justify-between gap-3 text-left">
              <div>
                <h4 className="font-plus-jakarta text-xs font-bold text-primary line-clamp-1 group-hover:text-primary/80 transition-colors">
                  {listing.name}
                </h4>
                <p className="text-[9px] text-gray-400 font-semibold mt-0.5 truncate">
                  📍 {listing.locality}
                </p>
              </div>

              <div className="flex justify-between items-center border-t border-outline/50 pt-3">
                <span className="text-[10px] font-extrabold text-primary">
                  {listing.price?.displayText || 'On Request'}
                </span>
                <span className="text-[8px] bg-gray-50 border border-outline px-3 py-2 rounded-full font-bold uppercase tracking-wider group-hover:bg-primary group-hover:text-white transition-colors">
                  View
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
