import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Listing from '@/models/Listing';
import { callClaude, extractJSON } from '@/lib/anthropic';

// Deterministic generation of landlord personality based on listing details
function getLandlordProfile(listingId, listingName, originalRent) {
  let hash = 0;
  for (let i = 0; i < listingId.length; i++) {
    hash = (hash << 5) - hash + listingId.charCodeAt(i);
    hash |= 0; 
  }
  hash = Math.abs(hash);

  const names = ['Mrs. Kapoor', 'Mr. Iyer', 'Sanjay Malhotra', 'Anjali Rao', 'Ramesh Patel', 'Dr. Sen'];
  const name = names[hash % names.length];

  const profiles = [
    {
      type: 'firm',
      attitude: 'Firm and professional. Values timely payments and clean habits above all. Hard to bargain with.',
      minPriceFloor: 0.90, // Will not accept less than 90% of listed rent
      preferredLeaseMonths: 12,
    },
    {
      type: 'flexible',
      attitude: 'Friendly, easygoing. Willing to offer a discount for polite tenants who offer a longer lease duration (12+ months).',
      minPriceFloor: 0.80, // Will accept down to 80%
      preferredLeaseMonths: 12,
    },
    {
      type: 'business-like',
      attitude: 'Strictly business, fast responder. Cares heavily about professional background, stable salary, and no pets.',
      minPriceFloor: 0.85, // Will accept down to 85%
      preferredLeaseMonths: 6,
    }
  ];

  const profile = profiles[hash % profiles.length];
  const listPrice = originalRent || 10000; // default fallback
  
  return {
    name,
    type: profile.type,
    attitude: profile.attitude,
    listPrice,
    minAcceptablePrice: Math.round(listPrice * profile.minPriceFloor),
    preferredLeaseMonths: profile.preferredLeaseMonths,
    securityDepositMonths: (hash % 3) + 2, // 2 to 4 months rent
  };
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { messages, userProfile } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, error: 'Messages array is required' }, { status: 400 });
    }

    await dbConnect();
    const listing = await Listing.findById(id).lean();

    if (!listing) {
      return NextResponse.json({ success: false, error: 'Property listing not found' }, { status: 404 });
    }

    const originalRent = listing.price?.value || 0;
    const rentUnit = listing.price?.unit || 'per_month';
    const landlord = getLandlordProfile(id, listing.name, originalRent);

    // Build the system prompt for the landlord simulation
    const systemPrompt = `
You are simulating a real estate landlord named ${landlord.name}.
You are negotiating the rent for your property: "${listing.name}" located in ${listing.locality}, ${listing.address}.
Listed Rent: ${originalRent} (${rentUnit})
Your Personality & Attitude: ${landlord.attitude}
Minimum Acceptable Rent Floor: ${landlord.minAcceptablePrice} (Do NOT accept any offer below this floor!)
Preferred Lease Duration: ${landlord.preferredLeaseMonths} months.
Security Deposit: ${landlord.securityDepositMonths} months worth of the final agreed rent.

Tenant profile provided: ${JSON.stringify(userProfile || { name: 'Prospective Tenant' })}

Your objectives:
1. Negotiate firmly but realistically. If the user makes an offer below ${landlord.minAcceptablePrice}, reject it politely but firmly, explaining that it is too low.
2. Track the "landlordPatience" (starts at 100).
   - If the user low-balls you (offers below ${landlord.minAcceptablePrice}) or is rude/demanding, decrease patience by 15-30 points.
   - If patience drops to 0, you must set dealStatus to "rejected" and end negotiations.
   - If the user is polite, offers reasonable rent, or offers longer lease durations, patience remains high or improves.
3. If they propose a rent that is >= ${landlord.minAcceptablePrice} AND they have agreed on deposit/rules, you can change dealStatus to "accepted".
4. Respond ONLY with a valid JSON block containing:
   - "message": Your response to the tenant (be in character as ${landlord.name}).
   - "dealStatus": "negotiating" | "accepted" | "rejected"
   - "currentRentOffered": The last numeric rent value discussed or agreed (default to previous or listed rent if not specified).
   - "leaseDuration": The lease duration in months discussed or agreed (default to 12).
   - "landlordPatience": The updated patience score (0 to 100).
   - "sentiment": "happy" | "neutral" | "frustrated"
   - "dealTerms": A string summarizing the final terms if accepted (e.g., "Rent: ₹18,000/mo, Deposit: ₹54,000, 12 months lease, No pets"), otherwise null.

Format your output as direct JSON only. Do not add any markdown wrapper in your raw response outside the JSON object itself.
`;

    // Extract last 6 messages to keep context window compact
    const conversationHistory = messages.slice(-6);

    const responseText = await callClaude(conversationHistory, systemPrompt);
    const result = extractJSON(responseText);

    return NextResponse.json({
      success: true,
      landlord: {
        name: landlord.name,
        type: landlord.type,
        listPrice: landlord.listPrice,
        unit: rentUnit
      },
      ...result
    });
  } catch (error) {
    console.error('Landlord Negotiation Agent Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process negotiation step'
    }, { status: 500 });
  }
}
