'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function SavedListingsPage() {
  const { data: session, status } = useSession();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSavedListings = async () => {
    try {
      const res = await fetch('/api/listings/saved');
      const json = await res.json();
      if (json.success) {
        setListings(json.data);
      } else {
        setError(json.error || 'Failed to fetch saved listings');
      }
    } catch (err) {
      setError('An error occurred while loading saved listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (status === 'authenticated') {
      const timer = setTimeout(() => {
        if (active) fetchSavedListings();
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    } else if (status === 'unauthenticated') {
      const timer = setTimeout(() => {
        if (active) setLoading(false);
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [status]);


  const handleUnsave = async (listingId) => {
    try {
      const res = await fetch(`/api/listings/${listingId}/save`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setListings(prev => prev.filter(l => l._id !== listingId));
      }
    } catch (err) {
      console.error('Error unsaving listing:', err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="bg-surface min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Saved Stays...</p>
          </div>
        </main>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="bg-surface min-h-screen flex flex-col bg-pattern">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-6">
          <div className="bg-white border border-outline rounded-card p-10 max-w-sm w-full text-center flex flex-col items-center gap-6 shadow-sm">
            <span className="material-symbols-outlined text-[48px] text-gray-300">lock</span>
            <div>
              <h2 className="font-plus-jakarta text-lg font-bold text-primary mb-1">Access Restricted</h2>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">Please sign in to view and manage your saved listings.</p>
            </div>
            <Link 
              href="/login"
              className="w-full bg-primary text-white py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all text-center"
            >
              Sign In Now
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen flex flex-col bg-pattern">
      <Navbar />
      
      <main className="flex-grow max-w-max-width-desktop w-full mx-auto px-6 py-12">
        <div className="flex flex-col gap-2 mb-10 text-center sm:text-left">
          <h1 className="font-plus-jakarta text-3xl font-extrabold text-primary tracking-tight">Saved Listings</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your curated properties, PGs, and local guides</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-150 p-4 rounded-xl text-xs font-semibold text-error mb-6">
            {error}
          </div>
        )}

        {listings.length === 0 ? (
          <div className="bg-white border border-outline rounded-card p-16 text-center flex flex-col items-center gap-6 shadow-sm max-w-lg mx-auto">
            <span className="material-symbols-outlined text-[54px] text-gray-300">bookmark_border</span>
            <div>
              <h2 className="font-plus-jakarta text-lg font-bold text-primary mb-1">No Saved Listings</h2>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                As you browse verified stays and meals, click the bookmark icon to save options here for quick comparison.
              </p>
            </div>
            <Link 
              href="/"
              className="px-8 py-3 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
            >
              Explore Hubs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {listings.map(listing => (
              <div 
                key={listing._id}
                className="bg-white rounded-card border border-outline overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col group"
              >
                {/* Image Section */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  {listing.images && listing.images[0] ? (
                    <img 
                      src={listing.images[0]} 
                      alt={listing.name} 
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <span className="material-symbols-outlined text-4xl">image</span>
                    </div>
                  )}
                  {/* Category Badge */}
                  <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-outline text-primary text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    {listing.category?.name || 'Listing'}
                  </span>
                  
                  {/* Unsave Button */}
                  <button 
                    onClick={() => handleUnsave(listing._id)}
                    className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm hover:bg-red-50 text-red-500 border border-outline w-8 h-8 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-colors"
                    title="Remove from saved"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">bookmark_remove</span>
                  </button>
                </div>

                {/* Content Section */}
                <div className="p-6 flex-grow flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-plus-jakarta text-sm font-bold text-primary leading-snug group-hover:text-primary-variant transition-colors">
                        {listing.name}
                      </h3>
                      {listing.isVerified && (
                        <span className="material-symbols-outlined text-sm text-green-500 font-bold" title="Verified Stay">verified</span>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      {listing.locality}, {listing.city?.name}
                    </p>

                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                      {listing.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-outline/50 pt-4 mt-2">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Price starts at</p>
                      <p className="text-xs font-bold text-primary mt-1">
                        {listing.price?.displayText || 'On Request'}
                      </p>
                    </div>

                    <Link 
                      href={`/${listing.city?.slug}/${listing.category?.slug}/${listing._id}`}
                      className="text-[10px] bg-gray-50 border border-outline hover:bg-primary hover:text-white px-4 py-2.5 rounded-full font-bold uppercase tracking-wider transition-all"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
