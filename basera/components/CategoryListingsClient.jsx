'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import dynamic from 'next/dynamic';

const GeospatialMap = dynamic(
  () => import('@/components/listings/GeospatialMap'),
  { ssr: false }
);


export default function CategoryListingsClient({ cityData, categoryData, categories = [], initialListings, subcategories }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [search, setSearch] = useState(initialSearch);
  const [submittedSearch, setSubmittedSearch] = useState(initialSearch);
  const [listings, setListings] = useState(initialListings);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [showMap, setShowMap] = useState(false);
  const [polygonFilter, setPolygonFilter] = useState(null);


  const [selectedCategories, setSelectedCategories] = useState([categoryData.slug]);
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const handleSearch = useCallback(async (query, poly = null) => {
    try {
      setSubmittedSearch(query);
      const categoriesParam = selectedCategories.join(',');
      const res = await fetch(`/api/listings?city=${cityData.slug}&category=${categoriesParam}&search=${encodeURIComponent(query)}&polygon=${poly || ''}`);

      const data = await res.json();
      if (data.success) {
        setTimeout(() => {
          setListings(data.data);
        }, 0);
      }
    } catch (e) {
      console.error(e);
    }
  }, [cityData.slug, selectedCategories]);

  useEffect(() => {
    // Fetch all listings on load or when polygon filter updates
    const timer = setTimeout(() => {
      handleSearch(initialSearch || '', polygonFilter);
    }, 0);
    return () => clearTimeout(timer);
  }, [initialSearch, polygonFilter, handleSearch]);


  const toggleSubcategory = (sub) => {
    setSelectedSubs(prev => 
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const filteredListings = listings.filter(item => {
    // Category check
    if (selectedCategories.length > 0) {
      const itemCatSlug = item.category?.slug || (typeof item.category === 'string' ? item.category : '');
      if (!itemCatSlug || !selectedCategories.includes(itemCatSlug)) return false;
    }
    if (item.price?.value && item.price.value > maxPrice) return false;
    if (verifiedOnly && !item.isVerified) return false;
    if (selectedSubs.length > 0 && !selectedSubs.includes(item.subcategory)) return false;
    if (search !== submittedSearch && search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch(search);
  };

  const firstListing = filteredListings[0];
  const otherListings = filteredListings.slice(1);

  const handleImageError = (e, item) => {
    e.target.onError = null; // Prevent infinite loops
    const catSlug = item.category?.slug || (typeof item.category === 'string' ? item.category : '') || 'home-services';
    const fallbackImages = {
      'housing': 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80',
      'food-dining': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
      'tiffin-mess': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
      'transport': 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=400&q=80',
      'maid-cook': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80'
    };
    e.target.src = fallbackImages[catSlug] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=80';
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col bg-pattern">
      {/* Global Navbar */}
      <Navbar />

      {/* Sub-header Bar */}
      <div className="bg-white border-b border-outline-variant/60">
        <div className="flex justify-between items-center px-6 w-full py-4 max-w-max-width-desktop mx-auto">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-primary hover:text-gray-600 transition-colors group focus:outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="text-xs font-bold uppercase tracking-wider">Back</span>
          </button>
          <span className="font-plus-jakarta text-sm font-bold text-primary tracking-tight">
            {categoryData.name} in <span className="text-gray-500">{cityData.name}</span>
          </span>
          <div className="w-12"></div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-max-width-desktop mx-auto px-6 w-full py-8 flex-grow flex flex-col md:flex-row gap-8">
        
        {/* Glassmorphic Sticky Sidebar Filters */}
        <aside className="w-full md:w-68 glass-panel p-6 rounded-3xl self-start flex flex-col gap-6 sticky top-6 z-20">
          <h3 className="font-plus-jakarta text-sm font-extrabold text-primary flex items-center gap-2 uppercase tracking-widest">
            Filters
          </h3>

          {/* Search form inside filter */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-outline rounded-xl py-3 pl-4 pr-10 focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold outline-none text-primary"
              placeholder="Search stays or services..." 
              type="text" 
            />
            <button type="submit" className="absolute right-3 top-3 text-gray-400 hover:text-primary">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </button>
          </form>

          {/* Price Range Slider */}
          <div className="border-t border-gray-150 pt-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Max Budget</span>
              <span className="text-xs font-bold text-primary">₹{maxPrice.toLocaleString('en-IN')}</span>
            </div>
            <input 
              type="range" 
              min="2000" 
              max="100000" 
              step="2000"
              value={maxPrice} 
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
            />
            <div className="flex justify-between text-[9px] text-gray-400 font-bold mt-2 uppercase tracking-wider">
              <span>₹2k</span>
              <span>₹50k</span>
              <span>₹100k+</span>
            </div>
          </div>

          {/* Categories Checklist */}
          {categories.length > 0 && (
            <div className="border-t border-gray-150 pt-5">
              <h4 className="text-[10px] font-bold text-gray-450 mb-3.5 uppercase tracking-widest font-plus-jakarta">Category</h4>
              <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                {categories.map(cat => {
                  const isChecked = selectedCategories.includes(cat.slug);
                  return (
                    <label key={cat.slug} className="flex items-center gap-3 text-xs font-bold text-gray-600 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => {
                          setSelectedCategories(prev => 
                            prev.includes(cat.slug) 
                              ? prev.filter(s => s !== cat.slug) 
                              : [...prev, cat.slug]
                          );
                        }}
                        className="rounded border-outline text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="group-hover:text-primary transition-colors flex items-center gap-1.5">
                        <span className="text-sm">{cat.icon}</span>
                        <span>{cat.name}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subcategories checklist */}
          {subcategories.length > 0 && (
            <div className="border-t border-gray-150 pt-5">
              <h4 className="text-[10px] font-bold text-gray-450 mb-3.5 uppercase tracking-widest font-plus-jakarta">Subcategory</h4>
              <div className="flex flex-col gap-2.5">
                {subcategories.map(sub => {
                  const isChecked = selectedSubs.includes(sub);
                  return (
                    <label key={sub} className="flex items-center gap-3 text-xs font-bold text-gray-600 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => toggleSubcategory(sub)}
                        className="rounded border-outline text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="group-hover:text-primary transition-colors">{sub}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Verification check */}
          <div className="border-t border-gray-150 pt-5">
            <label className="flex items-center gap-3 text-xs font-bold text-gray-600 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={verifiedOnly}
                onChange={() => setVerifiedOnly(!verifiedOnly)}
                className="rounded border-outline text-primary focus:ring-primary h-4 w-4"
              />
              <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
                Verified Only
                <span className="material-symbols-outlined text-[16px]">verified</span>
              </span>
            </label>
          </div>
        </aside>

        {/* Listings Grid */}
        <section className="flex-grow flex flex-col gap-6">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">
              Found {filteredListings.length} matches
            </span>
            <button 
              onClick={() => setShowMap(!showMap)}
              className="flex items-center gap-1.5 px-4.5 py-2 border border-outline hover:bg-gray-50 text-[10px] font-bold uppercase rounded-full cursor-pointer transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">{showMap ? 'list' : 'map'}</span>
              {showMap ? 'Show Cards Only' : 'Show Map Split'}
            </button>
          </div>


          {filteredListings.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-card border border-outline text-xs font-bold text-gray-400 shadow-sm flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-[42px] text-gray-300">search_off</span>
              No listings match your criteria.
            </div>
          ) : (
            <div className={`flex flex-col ${showMap ? 'lg:flex-row gap-6 items-stretch' : ''}`}>
              <div className={`flex flex-col gap-8 ${showMap ? 'w-full lg:w-[50%] flex-shrink-0' : 'w-full'}`}>
                {/* Featured Banner listing */}
                {firstListing && (
                  <div className={`relative overflow-hidden rounded-card aspect-[16/9] ${showMap ? '' : 'md:aspect-[21/9]'} border border-outline shadow-sm group`}>

                  <img 
                    alt={firstListing.name} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out" 
                    src={firstListing.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'}
                    onError={(e) => handleImageError(e, firstListing)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/35 to-transparent z-10"></div>
                  
                  <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider z-20">
                    FEATURED HUB
                  </div>
                  
                  {firstListing.aiMatchScore !== undefined && (
                    <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-[9px] font-bold z-20 flex items-center gap-1 shadow-md" title={firstListing.aiMatchReason}>
                      <span className="material-symbols-outlined text-[12px]">psychology</span>
                      {firstListing.aiMatchScore}% AI Match
                    </div>
                  )}
                  
                  <div className="absolute bottom-6 left-6 right-6 text-white z-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                      <h3 className="font-plus-jakarta text-lg md:text-xl font-bold leading-none text-white">{firstListing.name}</h3>
                      {firstListing.aiMatchReason && (
                        <p className="text-indigo-200 text-[10px] font-semibold italic mt-2 border-l-2 border-indigo-400 pl-2 line-clamp-1" title={firstListing.aiMatchReason}>
                          &ldquo;{firstListing.aiMatchReason}&rdquo;
                        </p>
                      )}
                      <p className="text-white/80 text-[11px] font-semibold mt-2.5 flex items-center gap-1">

                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        {firstListing.locality}, {cityData.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-start md:items-end flex-shrink-0">
                      <span className="text-[9px] text-white/60 font-bold uppercase tracking-widest">Pricing</span>
                      <span className="text-base font-bold text-white mt-0.5">
                        {firstListing.price?.displayText || `₹${firstListing.price?.value?.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  </div>
                  <Link href={`/${cityData.slug}/${categoryData.slug}/${firstListing._id}`} className="absolute inset-0 z-30"></Link>
                </div>
              )}

              {/* Grid of Listings */}
              {otherListings.length > 0 && (
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${showMap ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
                  {otherListings.map(listing => (
                    <Link
                      key={listing._id}
                      href={`/${cityData.slug}/${categoryData.slug}/${listing._id}`}
                      className="bg-white rounded-card border border-outline overflow-hidden shadow-sm hover:border-primary/45 transition-all duration-200"
                    >
                      <div className="h-44 w-full relative overflow-hidden">
                        <img 
                          alt={listing.name} 
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out" 
                          src={listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=80'}
                          onError={(e) => handleImageError(e, listing)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"></div>
                        {listing.isVerified && (
                          <span className="absolute top-3 left-3 bg-primary text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-0.5 shadow-sm">
                            <span className="material-symbols-outlined text-[10px]">verified</span>
                            Verified
                          </span>
                        )}
                        {listing.aiMatchScore !== undefined && (
                          <span className="absolute top-3 right-3 bg-indigo-650 text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 shadow-sm animate-pulse" title={listing.aiMatchReason}>
                            <span className="material-symbols-outlined text-[10px]">psychology</span>
                            {listing.aiMatchScore}% Match
                          </span>
                        )}
                      </div>
                      <div className="p-5">
                        <h4 className="font-bold text-xs.5 text-primary truncate leading-snug">{listing.name}</h4>
                        {listing.aiMatchReason && (
                          <p className="text-[10px] text-indigo-500 font-semibold italic mt-1 border-l-2 border-indigo-200 pl-2 line-clamp-1" title={listing.aiMatchReason}>
                            &ldquo;{listing.aiMatchReason}&rdquo;
                          </p>
                        )}
                        <p className="text-gray-400 text-xs font-semibold mt-1 flex items-center gap-0.5">

                          <span className="material-symbols-outlined text-[12px] text-gray-300">location_on</span>
                          {listing.locality || 'Local area'}
                        </p>
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-[9px] font-extrabold text-gray-450 tracking-wider uppercase truncate max-w-[130px]">{listing.subcategory || 'Service'}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-extrabold uppercase border tracking-wider ${
                              (listing.category?.slug || listing.categorySlug) === 'housing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              (listing.category?.slug || listing.categorySlug) === 'food-dining' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                              (listing.category?.slug || listing.categorySlug) === 'transport' ? 'bg-slate-50 text-slate-600 border-slate-100' :
                              (listing.category?.slug || listing.categorySlug) === 'maid-cook' ? 'bg-teal-50 text-teal-600 border-teal-100' :
                              (listing.category?.slug || listing.categorySlug) === 'home-services' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-gray-50 text-gray-600 border-gray-150'
                            }`}>
                              {listing.category?.name || 'Local'}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 text-gray-600 font-bold text-[11px]">
                            <span className="material-symbols-outlined text-[12px] text-yellow-500">star</span>
                            <span>{listing.rating?.average || 4.2}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {showMap && (
              <div className="w-full lg:w-[50%] h-[400px] lg:h-[calc(100vh-140px)] sticky top-6 z-20 rounded-3xl overflow-hidden shadow-lg border border-outline mt-6 lg:mt-0 bg-white">
                <GeospatialMap 
                  listings={filteredListings} 
                  cityData={cityData}
                  onPolygonChange={(poly) => setPolygonFilter(poly)}
                />
              </div>
            )}
          </div>
        )}
      </section>
      </main>
    </div>
  );
}
