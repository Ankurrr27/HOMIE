'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function CreateListing() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [citySlug, setCitySlug] = useState('');
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [price, setPrice] = useState({ value: '', maxValue: '', unit: 'per_month', displayText: '' });
  const [contact, setContact] = useState({ phone: '', whatsapp: '', email: '', website: '' });
  const [amenities, setAmenities] = useState([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [timing, setTiming] = useState({ open: '09:00', close: '22:00', days: 'Mon–Sun', is24Hours: false });
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [images, setImages] = useState([]);

  // Upload/AI Loading States
  const [uploading, setUploading] = useState(false);
  const [aiTagging, setAiTagging] = useState(false);

  const fetchMetadata = async () => {
    try {
      const [citiesRes, catsRes] = await Promise.all([
        fetch('/api/cities'),
        fetch('/api/categories')
      ]);
      const citiesJson = await citiesRes.json();
      const catsJson = await catsRes.json();
      if (citiesJson.success) setCities(citiesJson.data);
      if (catsJson.success) setCategories(catsJson.data);
    } catch (err) {
      console.error('Error fetching metadata', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMetadata();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        const imageUrl = json.url;
        setImages(prev => [...prev, imageUrl]);

        // Trigger Google Vision AI Tagging
        setAiTagging(true);
        const aiRes = await fetch('/api/ai/tag-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl })
        });
        const aiJson = await aiRes.json();
        if (aiJson.success && aiJson.detectedAmenities?.length > 0) {
          // Suggest detected amenities
          const detected = aiJson.detectedAmenities;
          setAmenities(prev => [...new Set([...prev, ...detected])]);
        }
      } else {
        setError(json.error || 'Failed to upload image');
      }
    } catch (err) {
      setError('An error occurred during image upload');
    } finally {
      setUploading(false);
      setAiTagging(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      name,
      description,
      categorySlug,
      subcategory,
      citySlug,
      locality,
      address,
      coordinates: coordinates.lat && coordinates.lng ? { lat: Number(coordinates.lat), lng: Number(coordinates.lng) } : null,
      price: {
        value: price.value ? Number(price.value) : null,
        maxValue: price.maxValue ? Number(price.maxValue) : null,
        unit: price.unit,
        displayText: price.displayText || `${price.value ? '₹' + price.value : ''}${price.unit === 'per_month' ? '/mo' : ''}`
      },
      contact,
      amenities,
      timing,
      tags,
      images
    };

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (res.status === 201 || res.status === 211 || json.success) {
        router.push('/vendor/dashboard');
        router.refresh();
      } else {
        setError(json.error || 'Failed to create listing');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities(prev => [...prev, newAmenity.trim()]);
      setNewAmenity('');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  if (status === 'loading') {
    return (
      <div className="bg-surface min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </main>
      </div>
    );
  }

  if (status === 'unauthenticated' || (session?.user?.role !== 'vendor' && session?.user?.role !== 'admin')) {
    return (
      <div className="bg-surface min-h-screen flex flex-col justify-center items-center">
        <Navbar />
        <p className="text-sm font-bold text-gray-500">Access Denied. Vendors Only.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen flex flex-col bg-pattern">
      <Navbar />
      <main className="flex-grow max-w-3xl w-full mx-auto px-6 py-12">
        <div className="bg-white border border-outline rounded-card p-8 shadow-sm flex flex-col gap-8">
          <div>
            <h1 className="font-plus-jakarta text-2xl font-extrabold text-primary tracking-tight">Create Verified Listing</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Stays, meals, or utilities listed directly under Basera guides</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-150 p-4 rounded-xl text-xs font-semibold text-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
            {/* Basic Info */}
            <div className="flex flex-col gap-4">
              <h3 className="font-plus-jakarta text-primary text-xs uppercase tracking-widest border-b border-outline pb-2">Basic Info</h3>
              <div className="flex flex-col gap-1.5">
                <label>Listing Title *</label>
                <input 
                  type="text" required placeholder="e.g. Co-living Studio Space"
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary focus:border-primary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label>Detailed Description *</label>
                <textarea 
                  rows={4} required placeholder="Tell clients about deposit guidelines, access controls, food menu details..."
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary focus:border-primary transition-all resize-none"
                />
              </div>
            </div>

            {/* Placement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label>Category *</label>
                <select 
                  required value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)}
                  className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary focus:border-primary transition-all"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c._id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label>Subcategory</label>
                <input 
                  type="text" placeholder="e.g. Double Sharing, Veg Mess"
                  value={subcategory} onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Location Details */}
            <div className="flex flex-col gap-4">
              <h3 className="font-plus-jakarta text-primary text-xs uppercase tracking-widest border-b border-outline pb-2">Location</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label>City *</label>
                  <select 
                    required value={citySlug} onChange={(e) => setCitySlug(e.target.value)}
                    className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary focus:border-primary transition-all"
                  >
                    <option value="">Select City</option>
                    {cities.map(c => <option key={c._id} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>Locality *</label>
                  <input 
                    type="text" required placeholder="e.g. Koramangala"
                    value={locality} onChange={(e) => setLocality(e.target.value)}
                    className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary focus:border-primary transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label>Complete Address *</label>
                <input 
                  type="text" required placeholder="e.g. 12, 4th Main Road, Sector 5..."
                  value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary focus:border-primary transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label>Latitude</label>
                  <input 
                    type="number" step="any" placeholder="e.g. 12.9716"
                    value={coordinates.lat} onChange={(e) => setCoordinates(prev => ({ ...prev, lat: e.target.value }))}
                    className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary focus:border-primary transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>Longitude</label>
                  <input 
                    type="number" step="any" placeholder="e.g. 77.5946"
                    value={coordinates.lng} onChange={(e) => setCoordinates(prev => ({ ...prev, lng: e.target.value }))}
                    className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Price Details */}
            <div className="flex flex-col gap-4">
              <h3 className="font-plus-jakarta text-primary text-xs uppercase tracking-widest border-b border-outline pb-2">Pricing</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label>Minimum Price (₹)</label>
                  <input 
                    type="number" placeholder="5000"
                    value={price.value} onChange={(e) => setPrice(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary focus:border-primary transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>Maximum Price (₹)</label>
                  <input 
                    type="number" placeholder="12000"
                    value={price.maxValue} onChange={(e) => setPrice(prev => ({ ...prev, maxValue: e.target.value }))}
                    className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary focus:border-primary transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>Billing Unit</label>
                  <select 
                    value={price.unit} onChange={(e) => setPrice(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary focus:border-primary transition-all"
                  >
                    <option value="per_month">Per Month</option>
                    <option value="per_visit">Per Visit</option>
                    <option value="per_meal">Per Meal</option>
                    <option value="on_request">On Request</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label>Display Text override (Optional)</label>
                <input 
                  type="text" placeholder="e.g. ₹5,500/mo or ₹50–200"
                  value={price.displayText} onChange={(e) => setPrice(prev => ({ ...prev, displayText: e.target.value }))}
                  className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Media Upload & AI tag feedback */}
            <div className="flex flex-col gap-4">
              <h3 className="font-plus-jakarta text-primary text-xs uppercase tracking-widest border-b border-outline pb-2">Media & Gallery</h3>
              
              <div className="border-2 border-dashed border-outline/70 rounded-2xl p-6 text-center flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-gray-400">upload_file</span>
                <div>
                  <p className="text-xs font-bold text-primary">Upload Property Image</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Supports PNG, JPG (Cloudinary Cloud & Vision AI scanning)</p>
                </div>
                <input 
                  type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading}
                  className="hidden" id="image-upload-input"
                />
                <label 
                  htmlFor="image-upload-input"
                  className="px-6 py-2.5 bg-gray-50 border border-outline hover:bg-gray-100 rounded-full font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  {uploading ? 'Uploading...' : 'Choose File'}
                </label>
              </div>

              {aiTagging && (
                <p className="text-[10px] text-indigo-500 font-bold animate-pulse">
                  🔮 Analyzing image details using Vision AI for automatic amenities tagging...
                </p>
              )}

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-4 mt-2">
                  {images.map((url, idx) => (
                    <div key={idx} className="relative h-20 rounded-xl overflow-hidden border border-outline">
                      <img src={url} className="w-full h-full object-cover" />
                      <button 
                        type="button" onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-black/60 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Amenities & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <label>Amenities</label>
                <div className="flex gap-2">
                  <input 
                    type="text" placeholder="e.g. WiFi, AC"
                    value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)}
                    className="flex-grow bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary"
                  />
                  <button 
                    type="button" onClick={handleAddAmenity}
                    className="bg-primary text-white px-4 rounded-xl font-bold uppercase tracking-wider"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {amenities.map(a => (
                    <span key={a} className="inline-flex items-center gap-1.5 bg-gray-50 border border-outline px-2.5 py-1 rounded-full text-[9px] font-bold uppercase text-gray-500">
                      {a}
                      <button type="button" onClick={() => setAmenities(prev => prev.filter(item => item !== a))} className="text-red-500 font-extrabold text-[11px] leading-none">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label>Search Tags</label>
                <div className="flex gap-2">
                  <input 
                    type="text" placeholder="e.g. budget, couples-friendly"
                    value={newTag} onChange={(e) => setNewTag(e.target.value)}
                    className="flex-grow bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary"
                  />
                  <button 
                    type="button" onClick={handleAddTag}
                    className="bg-primary text-white px-4 rounded-xl font-bold uppercase tracking-wider"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-150 text-indigo-600 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase">
                      #{t}
                      <button type="button" onClick={() => setTags(prev => prev.filter(item => item !== t))} className="text-red-500 font-extrabold text-[11px] leading-none">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Timing Parameters */}
            <div className="flex flex-col gap-4">
              <h3 className="font-plus-jakarta text-primary text-xs uppercase tracking-widest border-b border-outline pb-2">Business Timings</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label>Opening Time</label>
                  <input 
                    type="time" value={timing.open} onChange={(e) => setTiming(prev => ({ ...prev, open: e.target.value }))}
                    className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>Closing Time</label>
                  <input 
                    type="time" value={timing.close} onChange={(e) => setTiming(prev => ({ ...prev, close: e.target.value }))}
                    className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>Operational Days</label>
                  <input 
                    type="text" value={timing.days} onChange={(e) => setTiming(prev => ({ ...prev, days: e.target.value }))}
                    className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input 
                    type="checkbox" checked={timing.is24Hours} onChange={(e) => setTiming(prev => ({ ...prev, is24Hours: e.target.checked }))}
                    className="accent-primary" id="timing-24h"
                  />
                  <label htmlFor="timing-24h" className="cursor-pointer">Open 24 Hours</label>
                </div>
              </div>
            </div>

            {/* Contacts */}
            <div className="flex flex-col gap-4">
              <h3 className="font-plus-jakarta text-primary text-xs uppercase tracking-widest border-b border-outline pb-2">Contacts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label>Phone *</label>
                  <input 
                    type="tel" required placeholder="e.g. +91 9999999999"
                    value={contact.phone} onChange={(e) => setContact(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>WhatsApp</label>
                  <input 
                    type="tel" placeholder="e.g. +91 9999999999"
                    value={contact.whatsapp} onChange={(e) => setContact(prev => ({ ...prev, whatsapp: e.target.value }))}
                    className="w-full bg-white border border-outline rounded-xl py-3 px-4 outline-none text-xs font-semibold text-primary"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-outline/50 flex gap-4 justify-end">
              <Link 
                href="/vendor/dashboard"
                className="px-8 py-3.5 border border-outline text-gray-500 hover:bg-gray-50 rounded-full text-xs font-bold uppercase tracking-widest"
              >
                Cancel
              </Link>
              <button 
                type="submit" disabled={submitting}
                className="px-10 py-3.5 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
              >
                {submitting ? 'Creating Listing...' : 'Publish Listing'}
                <span className="material-symbols-outlined text-base">publish</span>
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}
