'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function NegotiationChat({ listing, onClose }) {
  const [messages, setMessages] = useState([
    {
      sender: 'landlord',
      text: `Hello! I am the owner of this property. Let me know if you are interested in renting it, or if you'd like to negotiate the rent, lease period, or security deposit. What are you thinking?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [landlordInfo, setLandlordInfo] = useState({ name: 'Landlord', type: '', listPrice: listing.price?.value || 0, unit: listing.price?.unit || 'per_month' });
  const [dealStatus, setDealStatus] = useState('negotiating'); // negotiating, accepted, rejected
  const [patience, setPatience] = useState(100);
  const [offeredRent, setOfferedRent] = useState(listing.price?.value || 0);
  const [leaseMonths, setLeaseMonths] = useState(12);
  const [sentiment, setSentiment] = useState('neutral');
  const [dealTerms, setDealTerms] = useState(null);
  const [tenantName, setTenantName] = useState('');
  const [tenantJob, setTenantJob] = useState('Software Engineer');
  const [hasPets, setHasPets] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signingName, setSigningName] = useState('');

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const getPatienceColor = (val) => {
    if (val > 60) return 'bg-emerald-500';
    if (val > 30) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getSentimentEmoji = (sent) => {
    switch (sent) {
      case 'happy': return '😊';
      case 'frustrated': return '😟';
      default: return '😐';
    }
  };

  const handleSendMessage = async (customText = '') => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || loading || dealStatus !== 'negotiating') return;

    if (!customText) setInputText('');

    const newMessages = [...messages, { sender: 'user', text: textToSend, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await fetch(`/api/listings/${listing._id}/negotiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          userProfile: {
            name: tenantName || 'Prospective Tenant',
            occupation: tenantJob,
            hasPets: hasPets ? 'Yes' : 'No',
            proposedDurationMonths: leaseMonths
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        if (data.landlord) {
          setLandlordInfo(data.landlord);
        }
        setMessages(prev => [
          ...prev,
          {
            sender: 'landlord',
            text: data.message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setDealStatus(data.dealStatus);
        setPatience(data.landlordPatience);
        setOfferedRent(data.currentRentOffered || offeredRent);
        setLeaseMonths(data.leaseDuration || leaseMonths);
        setSentiment(data.sentiment || 'neutral');
        if (data.dealTerms) {
          setDealTerms(data.dealTerms);
        }
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'landlord',
          text: `Sorry, something went wrong on my end. Can you say that again?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const proposeRentChange = (amount) => {
    const text = `I would like to propose a rent of ₹${amount.toLocaleString()} ${landlordInfo.unit === 'per_month' ? 'per month' : ''}.`;
    handleSendMessage(text);
  };

  const proposeLeaseDuration = (months) => {
    const text = `I'd like to sign a lease for ${months} months. Will you give a discount for a longer stay?`;
    handleSendMessage(text);
  };

  const originalRent = landlordInfo.listPrice;
  const savingsPercent = originalRent > 0 ? Math.round(((originalRent - offeredRent) / originalRent) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Panel: Live Dashboard Info */}
        <div className="w-full md:w-80 bg-slate-950 border-r border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white tracking-wide">{landlordInfo.name}</h3>
                <p className="text-xs text-emerald-400 capitalize">{landlordInfo.type || 'Owner'} Landlord</p>
              </div>
              <button 
                onClick={onClose}
                className="md:hidden text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Profile Pitcher */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 mb-6">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Your Profile Pitch</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Your Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Harshit"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Occupation</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Software Engineer"
                    value={tenantJob}
                    onChange={(e) => setTenantJob(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400">Do you have pets?</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={hasPets} 
                      onChange={(e) => setHasPets(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-4 after:width-4 after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Negotiation Game Metrics */}
            <div className="space-y-5">
              {/* Patience Score */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 font-medium mb-1.5">
                  <span>Landlord Patience</span>
                  <span className="font-semibold text-white">{patience}%</span>
                </div>
                <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getPatienceColor(patience)} transition-all duration-300`} 
                    style={{ width: `${patience}%` }}
                  ></div>
                </div>
              </div>

              {/* Mood Meter */}
              <div className="flex justify-between items-center bg-slate-900/40 p-3 border border-slate-800/40 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Landlord Mood</span>
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  {getSentimentEmoji(sentiment)} <span className="capitalize text-xs text-slate-300">{sentiment}</span>
                </span>
              </div>

              {/* Rent Bar */}
              <div className="bg-slate-900/40 p-3 border border-slate-800/40 rounded-xl">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Current Offer</span>
                  <span>Listed: ₹{originalRent.toLocaleString()}</span>
                </div>
                <div className="text-lg font-extrabold text-white">
                  ₹{offeredRent.toLocaleString()}
                  <span className="text-xs font-normal text-slate-500">/{landlordInfo.unit === 'per_month' ? 'mo' : landlordInfo.unit}</span>
                </div>
                {savingsPercent > 0 && (
                  <div className="text-xs text-emerald-400 font-medium mt-1">
                    Saving {savingsPercent}% (₹{(originalRent - offeredRent).toLocaleString()} off)
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:block pt-4">
            <button 
              onClick={onClose}
              className="w-full border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              Close Simulator
            </button>
          </div>
        </div>

        {/* Right Panel: Chat & Negotiation */}
        <div className="flex-1 flex flex-col bg-slate-900">
          {/* Header */}
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-850 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                {landlordInfo.name[0]}
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">{listing.name}</h2>
                <p className="text-xs text-slate-400">Negotiation Room</p>
              </div>
            </div>
            {/* Status Badges */}
            <div className="flex items-center gap-2">
              {dealStatus === 'negotiating' && (
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">
                  Negotiating
                </span>
              )}
              {dealStatus === 'accepted' && (
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                  Deal Accepted! 🎉
                </span>
              )}
              {dealStatus === 'rejected' && (
                <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1 rounded-full text-xs font-semibold">
                  Negotiation Terminated
                </span>
              )}
              <button 
                onClick={onClose}
                className="hidden md:block text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded-lg transition ml-2"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in-50 slide-in-from-bottom-2 duration-200`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-md ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-950 border border-slate-800/80 text-slate-100 rounded-tl-none'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-[10px] text-slate-400/80 block text-right mt-1.5">{msg.time}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Deal Acceptance Flow */}
          {dealStatus === 'accepted' && (
            <div className="mx-6 mb-4 p-5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex flex-col space-y-4 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✍️</span>
                <div>
                  <h4 className="text-sm font-bold text-emerald-400">Lease Agreement Drafted</h4>
                  <p className="text-xs text-slate-300">Read and execute the digital signature to finalize.</p>
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg text-xs space-y-2 font-mono text-slate-300">
                <p className="font-bold text-slate-400">--- MEMORANDUM OF LEASE AGREEMENT ---</p>
                <p><span className="text-slate-500">Property:</span> {listing.name}</p>
                <p><span className="text-slate-500">Landlord:</span> {landlordInfo.name}</p>
                <p><span className="text-slate-500">Tenant:</span> {tenantName || 'Prospective Tenant'} ({tenantJob})</p>
                <p><span className="text-slate-500">Final Agreed Rent:</span> ₹{offeredRent.toLocaleString()} / mo</p>
                <p><span className="text-slate-500">Lease Duration:</span> {leaseMonths} Months</p>
                <p><span className="text-slate-500">Special Terms:</span> {dealTerms || 'None specified.'}</p>
              </div>

              {!signed ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    placeholder="Type your full name to sign"
                    value={signingName}
                    onChange={(e) => setSigningName(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                  <button 
                    disabled={!signingName.trim()}
                    onClick={() => setSigned(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-6 py-2 rounded-xl text-sm font-semibold transition"
                  >
                    Confirm Digital Signature
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 text-sm font-bold rounded-lg text-center animate-bounce">
                  ✓ Lease Successfully Signed! Welcome to your new home! 🏠
                </div>
              )}
            </div>
          )}

          {/* Quick Actions Panel */}
          {dealStatus === 'negotiating' && (
            <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-850/80 flex flex-wrap gap-2">
              <span className="text-xs text-slate-500 flex items-center mr-1">Quick offers:</span>
              <button 
                onClick={() => proposeRentChange(Math.round(originalRent * 0.95))} 
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs transition"
              >
                Offer ₹{Math.round(originalRent * 0.95).toLocaleString()} (5% Off)
              </button>
              <button 
                onClick={() => proposeRentChange(Math.round(originalRent * 0.90))} 
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs transition"
              >
                Offer ₹{Math.round(originalRent * 0.90).toLocaleString()} (10% Off)
              </button>
              <button 
                onClick={() => proposeLeaseDuration(12)} 
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs transition"
              >
                Suggest 12 mo lease
              </button>
              <button 
                onClick={() => proposeLeaseDuration(24)} 
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs transition"
              >
                Suggest 24 mo lease
              </button>
            </div>
          )}

          {/* Footer Input Bar */}
          <div className="p-4 bg-slate-950 border-t border-slate-850 flex gap-3">
            <input 
              type="text" 
              placeholder={
                dealStatus === 'negotiating' 
                  ? 'Type your negotiation response...' 
                  : dealStatus === 'accepted' 
                  ? 'Deal accepted! Please sign the agreement above.' 
                  : 'Negotiation terminated.'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={dealStatus !== 'negotiating' || loading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm disabled:opacity-50"
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={dealStatus !== 'negotiating' || loading || !inputText.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Send
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
