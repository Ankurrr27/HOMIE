'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export default function NeighbourhoodScorer({ locality = 'Koramangala', cityName = 'Bengaluru', listingData = {} }) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState({ type: 'student', cooking: 'wants_kitchen', transit: 'metro_preferred' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateScore = useCallback(async () => {
    setLoading(true);
    try {
      const userProfile = {
        name: session?.user?.name || 'Guest User',
        ...profile
      };

      const res = await fetch('/api/ai/neighbourhood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          locality,
          cityName,
          listingData
        })
      });
      const json = await res.json();
      if (json.success) {
        setResult(json);
      }
    } catch (err) {
      console.error('Error scoring neighbourhood compatibility:', err);
    } finally {
      setLoading(false);
    }
  }, [locality, cityName, listingData, profile, session]);

  useEffect(() => {
    // Auto-calculate on initial load
    const timer = setTimeout(() => {
      calculateScore();
    }, 0);
    return () => clearTimeout(timer);
  }, [locality, cityName, calculateScore]);

  return (
    <div className="bg-white border border-outline rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.01)] flex flex-col gap-5">
      <div>
        <h4 className="font-plus-jakarta text-sm font-extrabold text-primary tracking-tight">Neighbourhood Compatibility</h4>
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Customized scoring matching your profile preferences</p>
      </div>

      {/* Profile settings select */}
      <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
        <div className="flex flex-col gap-1">
          <label>Your Profile</label>
          <select 
            value={profile.type} onChange={(e) => setProfile(prev => ({ ...prev, type: e.target.value }))}
            className="bg-gray-50 border border-outline rounded-xl py-2 px-3 outline-none text-[10px] font-bold text-primary"
          >
            <option value="student">Student / Intern</option>
            <option value="professional">Working Professional</option>
            <option value="family">Family Move</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label>Transit Need</label>
          <select 
            value={profile.transit} onChange={(e) => setProfile(prev => ({ ...prev, transit: e.target.value }))}
            className="bg-gray-50 border border-outline rounded-xl py-2 px-3 outline-none text-[10px] font-bold text-primary"
          >
            <option value="metro_preferred">Metro access key</option>
            <option value="bus_preferred">Bus loops ok</option>
            <option value="private">Private vehicle</option>
          </select>
        </div>
      </div>

      <button 
        onClick={calculateScore} disabled={loading}
        className="w-full bg-gray-50 hover:bg-gray-100 border border-outline py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-primary cursor-pointer active:scale-98 transition-all"
      >
        {loading ? 'Evaluating...' : 'Recalculate AI Score'}
      </button>

      {/* Output Results */}
      {result && (
        <div className="border-t border-outline/50 pt-4 flex flex-col gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-700 font-plus-jakarta text-lg font-bold">
              {result.score}%
            </div>
            <div className="flex-grow">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none">Compatibility Verdict</p>
              <p className="text-xs font-semibold text-gray-600 mt-1 leading-relaxed">{result.reason}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold leading-relaxed">
            {result.pros?.length > 0 && (
              <div className="flex flex-col gap-1 text-green-700">
                <span className="font-bold uppercase tracking-wider text-[9px] text-green-500">Advantages</span>
                {result.pros.map((pro, i) => <span key={i}>✔ {pro}</span>)}
              </div>
            )}
            {result.cons?.length > 0 && (
              <div className="flex flex-col gap-1 text-red-700">
                <span className="font-bold uppercase tracking-wider text-[9px] text-red-500">Drawbacks</span>
                {result.cons.map((con, i) => <span key={i}>✘ {con}</span>)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
