'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import AIReviewSummary from '@/components/ai/AIReviewSummary';
import NeighbourhoodScorer from '@/components/ai/NeighbourhoodScorer';
import RecommendedListings from '@/components/ai/RecommendedListings';
import NegotiationChat from '@/components/listings/NegotiationChat';


export default function ListingDetailsClient({ city, category, listing, initialReviews }) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isNegotiating, setIsNegotiating] = useState(false);


  const checkSavedStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/listings/saved');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setIsSaved(json.data.some(item => item._id === listing._id));
      }
    } catch (err) {
      console.error('Error checking saved status:', err);
    }
  }, [listing._id]);

  // Sync bookmark state on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      checkSavedStatus();
    }, 0);
    return () => clearTimeout(timer);
  }, [listing._id, checkSavedStatus]);

  // Bookmark toggle
  const toggleSave = async () => {
    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const res = await fetch(`/api/listings/${listing._id}/save`, {
        method,
      });
      const data = await res.json();
      if (data.success) {
        setIsSaved(data.isSaved);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setSubmittingReview(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing._id,
          rating,
          comment
        })
      });

      const data = await res.json();
      if (res.status === 201 || res.status === 211 || data.success) {
        setReviews([data.data, ...reviews]);
        setComment('');
        setRating(5);
      } else {
        setReviewError(data.error || 'Failed to submit review.');
      }
    } catch (err) {
      setReviewError('Connection error.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Dynamic category-based placeholder images to avoid duplicating same photos everywhere
  const categoryPlaceholders = {
    'housing': [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80'
    ],
    'food-dining': [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600&q=80'
    ],
    'tiffin-mess': [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1512152272829-e3139592d56f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1621979087428-046c53fa6e42?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80'
    ],
    'transport': [
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80'
    ],
    'maid-cook': [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
    ]
  };

  const currentCategory = category?.slug || listing.categorySlug || 'home-services';
  const placeholders = categoryPlaceholders[currentCategory] || [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80'
  ];

  // Dynamic image list padded with placeholders if listing has fewer than 5 images
  const imagesList = [...(listing.images || [])];
  while (imagesList.length < 5) {
    imagesList.push(placeholders[imagesList.length % placeholders.length]);
  }

  // Gracefully replace broken external images (like Google Map links) with beautiful fallbacks
  const handleImageError = (e, index) => {
    e.target.onError = null; // Prevent infinite loop
    e.target.src = placeholders[index % placeholders.length];
  };

  // Icon mappings
  const amenityIcons = {
    'WiFi': 'wifi',
    'AC': 'ac_unit',
    'Kitchen': 'skillet',
    'Power Backup': 'bolt',
    'Laundry': 'local_laundry_service',
    'Security': 'security',
    'Gym': 'fitness_center',
    'Parking': 'local_parking'
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col bg-pattern">
      {/* Global Navbar */}
      <Navbar />

      {/* Detail Sub-header with Back & Save */}
      <div className="bg-white border-b border-outline-variant/60">
        <div className="flex justify-between items-center px-6 w-full py-4 max-w-max-width-desktop mx-auto">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-primary hover:text-gray-600 transition-colors group focus:outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="text-xs font-bold uppercase tracking-wider">Back to Listings</span>
          </button>
          <button 
            onClick={toggleSave}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
              isSaved 
                ? 'bg-red-50 border-red-200 text-red-500' 
                : 'bg-white border-outline hover:bg-gray-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: ` 'FILL' ${isSaved ? 1 : 0}` }}>
              favorite
            </span>
          </button>
        </div>
      </div>

      {/* Main details content */}
      <main className="max-w-max-width-desktop mx-auto px-6 w-full py-8 flex-grow flex flex-col gap-8">
        
        {/* Photo Grid Section */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-card overflow-hidden border border-outline">
          <div className="md:col-span-2 aspect-[4/3] md:aspect-auto h-76 md:h-[400px] relative overflow-hidden">
            <img 
              alt={listing.name} 
              className="w-full h-full object-cover" 
              src={imagesList[0]} 
              onError={(e) => handleImageError(e, 0)}
            />
          </div>
          <div className="hidden md:grid grid-cols-2 col-span-2 gap-3 h-[400px]">
            <div className="h-[194px] relative overflow-hidden">
              <img 
                alt="Interior" 
                className="w-full h-full object-cover" 
                src={imagesList[1]} 
                onError={(e) => handleImageError(e, 1)}
              />
            </div>
            <div className="h-[194px] relative overflow-hidden">
              <img 
                alt="Secondary view" 
                className="w-full h-full object-cover" 
                src={imagesList[2]} 
                onError={(e) => handleImageError(e, 2)}
              />
            </div>
            <div className="h-[194px] relative overflow-hidden">
              <img 
                alt="Additional view" 
                className="w-full h-full object-cover" 
                src={imagesList[3]} 
                onError={(e) => handleImageError(e, 3)}
              />
            </div>
            <div className="h-[194px] relative overflow-hidden">
              <img 
                alt="Detail view" 
                className="w-full h-full object-cover" 
                src={imagesList[4]} 
                onError={(e) => handleImageError(e, 4)}
              />
            </div>
          </div>
        </section>

        {/* Info Grid */}
        <section className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Info Left Column */}
          <div className="flex-grow flex flex-col gap-8">
            
            {/* Title & Metadata */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-plus-jakarta text-2xl font-bold text-primary tracking-tight">{listing.name}</h1>
                {listing.isVerified && (
                  <span className="bg-primary/5 text-primary border border-primary/10 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-0.5 shadow-sm">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-gray-400">location_on</span>
                {listing.address || `${listing.locality}, ${city}`}
              </p>
            </div>

            {/* Price boxes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-5 rounded-2xl text-center shadow-sm">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Monthly Pricing</p>
                <p className="text-lg font-bold text-primary">
                  {listing.price?.displayText || `₹${listing.price?.value?.toLocaleString('en-IN')}`}
                </p>
              </div>
              {listing.price?.value && (
                <div className="glass-panel p-5 rounded-2xl text-center shadow-sm">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Deposit</p>
                  <p className="text-lg font-bold text-primary">
                    ₹{(listing.price.value * 2).toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </div>

            {/* Amenities Section */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div>
                <h3 className="font-plus-jakarta text-sm font-bold text-primary mb-4 uppercase tracking-wider">Features</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {listing.amenities.map(amenity => (
                    <div key={amenity} className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm gap-2 hover:-translate-y-0.5 transition-transform duration-250">
                      <span className="material-symbols-outlined text-[24px] text-gray-700">
                        {amenityIcons[amenity] || 'verified'}
                      </span>
                      <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="border-t border-gray-150 pt-6">
              <h3 className="font-plus-jakarta text-sm font-bold text-primary mb-3 uppercase tracking-wider">Details</h3>
              <p className="text-xs.5 text-gray-600 leading-relaxed font-semibold">{listing.description}</p>
            </div>

            {/* AI Review Summary Box */}
            <AIReviewSummary listingId={listing._id} initialSummary={listing.aiSummary} reviews={reviews} />

            {/* Neighbourhood Compatibility Scorer */}
            <NeighbourhoodScorer locality={listing.locality} cityName={city} listingData={listing} />

            {/* Interactive Reviews Section */}
            <div className="bg-white p-6 rounded-card border border-outline shadow-sm flex flex-col gap-6">
              <h3 className="font-plus-jakarta text-sm font-bold text-primary uppercase tracking-wider">Reviews ({reviews.length})</h3>

              {/* Review submit form */}
              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4 p-5 bg-gray-50 rounded-card border border-outline">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Submit Feedback</h4>
                
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-gray-500 mr-2">Score:</span>
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRating(val)}
                      className="text-primary focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: ` 'FILL' ${rating >= val ? 1 : 0}` }}>
                        star
                      </span>
                    </button>
                  ))}
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-white border border-outline rounded-xl p-3 text-xs font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 min-h-[90px] text-primary"
                  placeholder="Share your experience..."
                  required
                />

                {reviewError && <p className="text-xs font-semibold text-error">{reviewError}</p>}

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-primary text-white py-3 rounded-full text-xs font-bold uppercase tracking-wider active:scale-98 transition-all disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </form>

              {/* Reviews List */}
              <div className="flex flex-col gap-4">
                {reviews.map(rev => (
                  <div key={rev._id} className="p-4 rounded-xl border border-outline bg-gray-50 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-primary">{rev.user?.name || 'Anonymous User'}</span>
                      <div className="flex items-center gap-0.5 text-gray-600 font-bold text-xs">
                        <span className="material-symbols-outlined text-[14px] text-yellow-500">star</span>
                        <span>{rev.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 font-semibold">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Contact Details */}
          <div className="w-full lg:w-80 flex-shrink-0 animate-fade-in">
            <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6 sticky top-24 shadow-md">
              <h3 className="font-plus-jakarta text-sm font-extrabold text-primary uppercase tracking-widest">Contact Provider</h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 border border-outline flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-600">person</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-primary">{listing.contactName || 'Local Hub Representative'}</h4>
                    <p className="text-[10px] text-gray-400 font-semibold">Verified Owner</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href={`tel:${listing.contactPhone || '9876543210'}`}
                    className="w-full bg-primary text-white py-3 rounded-full text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-98 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">call</span>
                    Call Landlord
                  </a>
                  <a
                    href={`https://wa.me/91${listing.contactPhone || '9876543210'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full border border-outline text-primary py-3 rounded-full text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 hover:bg-gray-50 active:scale-98 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    WhatsApp
                  </a>
                  {listing.price?.value && (
                    <button
                      onClick={() => setIsNegotiating(true)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-full text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-98 transition-all shadow-md cursor-pointer mt-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">handshake</span>
                      Negotiate Rent (AI)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* Recommended listings section */}
        <RecommendedListings listingId={listing._id} currentCitySlug={city} />
      </main>

      {/* Interactive AI Landlord Negotiation */}
      {isNegotiating && (
        <NegotiationChat 
          listing={listing} 
          onClose={() => setIsNegotiating(false)} 
        />
      )}
    </div>
  );
}

