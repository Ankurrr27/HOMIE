'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function VendorDashboard() {
  const { data: session, status } = useSession();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchVendorListings = useCallback(async () => {
    try {
      // In a real application, you would hit an endpoint filtered by vendor, 
      // for this implementation we fetch the general listings and show the user's listings.
      const res = await fetch('/api/listings?limit=50');
      const json = await res.json();
      if (json.success) {
        // Filter by logged in vendor user ID if listing matches
        const myListings = json.data.filter(
          item => item.vendor === session?.user?.id || item.vendor?._id === session?.user?.id
        );
        setListings(myListings);
      } else {
        setError(json.error || 'Failed to fetch listings');
      }
    } catch (err) {
      setError('An error occurred while loading listings');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    let active = true;
    if (status === 'authenticated') {
      const timer = setTimeout(() => {
        if (active) fetchVendorListings();
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
  }, [status, fetchVendorListings]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setListings(prev => prev.filter(l => l._id !== id));
      } else {
        alert(json.error || 'Failed to delete listing');
      }
    } catch (err) {
      alert('Delete failed due to a server error');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="bg-surface min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (status === 'unauthenticated' || (session?.user?.role !== 'vendor' && session?.user?.role !== 'admin')) {
    return (
      <div className="bg-surface min-h-screen flex flex-col bg-pattern">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-6">
          <div className="bg-white border border-outline rounded-card p-10 max-w-sm w-full text-center flex flex-col items-center gap-6 shadow-sm">
            <span className="material-symbols-outlined text-[48px] text-gray-300">lock</span>
            <div>
              <h2 className="font-plus-jakarta text-lg font-bold text-primary mb-1">Access Denied</h2>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">Only verified vendors can access the vendor dashboard.</p>
            </div>
            <Link 
              href="/onboard"
              className="w-full bg-primary text-white py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all text-center"
            >
              Become a Vendor
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
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-10">
          <div className="flex flex-col gap-1.5 text-center sm:text-left">
            <h1 className="font-plus-jakarta text-3xl font-extrabold text-primary tracking-tight">Vendor Dashboard</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manage your verified properties, meals, and PGs</p>
          </div>
          
          <Link 
            href="/vendor/create"
            className="flex items-center gap-2 bg-primary hover:opacity-90 text-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 rounded-full shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span>
            Create Listing
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-150 p-4 rounded-xl text-xs font-semibold text-error mb-6">
            {error}
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-outline rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.01)] flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Listings</span>
            <span className="text-2xl font-extrabold text-primary">{listings.length}</span>
          </div>
          <div className="bg-white border border-outline rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.01)] flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Verified Properties</span>
            <span className="text-2xl font-extrabold text-green-500">
              {listings.filter(l => l.isVerified).length}
            </span>
          </div>
          <div className="bg-white border border-outline rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.01)] flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Views</span>
            <span className="text-2xl font-extrabold text-indigo-500">
              {listings.reduce((acc, curr) => acc + (curr.viewCount || 0), 0)}
            </span>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white border border-outline rounded-card p-16 text-center flex flex-col items-center gap-6 shadow-sm max-w-lg mx-auto">
            <span className="material-symbols-outlined text-[54px] text-gray-300">storefront</span>
            <div>
              <h2 className="font-plus-jakarta text-lg font-bold text-primary mb-1">No Active Listings</h2>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                Start listing stays, meal menus, or helper resources to show up in our verified hubs.
              </p>
            </div>
            <Link 
              href="/vendor/create"
              className="px-8 py-3 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
            >
              Add Your First Listing
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-outline rounded-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-outline/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Listing details</th>
                    <th className="px-6 py-4">City / Locality</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Stats</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/50 text-xs">
                  {listings.map(listing => (
                    <tr key={listing._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {listing.images && listing.images[0] ? (
                            <img 
                              src={listing.images[0]} 
                              alt={listing.name} 
                              className="w-12 h-12 rounded-lg object-cover border border-outline"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-outline text-gray-300">
                              <span className="material-symbols-outlined text-base">image</span>
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-primary">{listing.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{listing.price?.displayText || 'On Request'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-600">
                        {listing.locality}, {listing.city?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        {listing.isVerified ? (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-150 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[10px] font-bold">verified</span>
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-150 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[10px] font-bold">pending</span>
                            Pending Approval
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        👁 {listing.viewCount || 0} views / 💾 {listing.saveCount || 0} saves
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-3">
                          <Link 
                            href={`/vendor/edit/${listing._id}`}
                            className="bg-white hover:bg-gray-50 border border-outline w-8 h-8 rounded-full flex items-center justify-center text-primary transition-colors cursor-pointer"
                            title="Edit Listing"
                          >
                            <span className="material-symbols-outlined text-sm font-bold">edit</span>
                          </Link>
                          <button 
                            onClick={() => handleDelete(listing._id)}
                            className="bg-white hover:bg-red-50 border border-outline w-8 h-8 rounded-full flex items-center justify-center text-red-500 transition-colors cursor-pointer"
                            title="Delete Listing"
                          >
                            <span className="material-symbols-outlined text-sm font-bold">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
