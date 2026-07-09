'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AISearchBar({ city = 'bengaluru', onSearchComplete }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, city })
      });
      const json = await res.json();
      if (json.success && json.filters) {
        setActiveFilters(json.filters);
        
        // Callback if custom filters are applied
        if (onSearchComplete) {
          onSearchComplete(json.filters);
        } else {
          // Fallback redirect behavior:
          // Build query string and redirect to listing page
          const params = new URLSearchParams();
          const { keyword, category, subcategory, minPrice, maxPrice } = json.filters;
          
          if (keyword) params.append('search', keyword);
          if (subcategory) params.append('subcategory', subcategory);
          if (minPrice) params.append('minPrice', minPrice);
          if (maxPrice) params.append('maxPrice', maxPrice);
          
          const validCategories = ['housing', 'food-dining', 'grocery', 'sabji-mandi', 'dairy', 'home-services', 'tiffin-mess', 'maid-cook', 'gym-fitness', 'places-to-visit', 'social-fun', 'transport'];
          const normCategory = category ? category.toLowerCase().trim() : '';
          const finalCategory = validCategories.includes(normCategory) ? normCategory : 'housing';
          
          const path = `/${city}/${finalCategory}`;
          router.push(`${path}?${params.toString()}`);
        }
      }
    } catch (err) {
      console.error('AI Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <form onSubmit={handleSearch} className="relative group w-full">
        <div className="absolute -inset-0.5 bg-primary/5 rounded-full blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
        <div className="relative">
          <input 
            type="text"
            placeholder="Try asking: 'budget PG under 15000 in Koramangala with WiFi'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border border-outline rounded-full py-4.5 pl-14 pr-16 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-xs font-bold outline-none text-primary shadow-sm"
          />
          <span className="absolute left-5 top-[16px] text-gray-400 material-symbols-outlined">psychology</span>
          
          <button 
            type="submit" disabled={loading}
            className="absolute right-3.5 top-[7px] bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full hover:opacity-90 transition-all flex items-center gap-1 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Ask AI'
            )}
          </button>
        </div>
      </form>

      {activeFilters && (
        <div className="flex flex-wrap items-center gap-2 px-3 animate-in fade-in duration-300">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Detected Filters:</span>
          {activeFilters.category && (
            <span className="bg-primary/5 border border-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase">
              📁 {activeFilters.category}
            </span>
          )}
          {activeFilters.subcategory && (
            <span className="bg-indigo-50 border border-indigo-150 text-indigo-600 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase">
              🏷️ {activeFilters.subcategory}
            </span>
          )}
          {(activeFilters.minPrice || activeFilters.maxPrice) && (
            <span className="bg-green-50 border border-green-150 text-green-700 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase">
              💰 ₹{activeFilters.minPrice || 0} - {activeFilters.maxPrice || 'Any'}
            </span>
          )}
          {activeFilters.keyword && (
            <span className="bg-gray-50 border border-outline px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase text-gray-500">
              🔍 &quot;{activeFilters.keyword}&quot;
            </span>
          )}
          <button 
            onClick={() => {
              setActiveFilters(null);
              setQuery('');
              if (onSearchComplete) onSearchComplete(null);
            }}
            className="text-[9px] font-bold text-red-500 hover:underline uppercase tracking-wider cursor-pointer ml-1"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
