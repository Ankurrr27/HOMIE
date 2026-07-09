import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Listing from '@/models/Listing';
import Category from '@/models/Category'; // Ensure category model is registered for populate

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'ListingId is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find all users who saved this listing
    const usersWhoSaved = await User.find(
      { savedListings: listingId },
      { savedListings: 1 }
    ).lean();

    if (usersWhoSaved.length < 3) {
      // Not enough data — return top-rated listings in other categories
      const topListings = await Listing.find({ isActive: true })
        .sort({ 'rating.average': -1 })
        .limit(4)
        .populate('category', 'name icon slug')
        .lean();


      return NextResponse.json({ success: true, data: topListings, type: 'top_rated' });
    }

    // Count co-saves: which other listings appear most with this one
    const coSaveCounts = {};
    for (const user of usersWhoSaved) {
      if (!user.savedListings) continue;
      for (const savedId of user.savedListings) {
        const id = savedId.toString();
        if (id !== listingId) {
          coSaveCounts[id] = (coSaveCounts[id] || 0) + 1;
        }
      }
    }

    // Sort by frequency, take top 4
    const topCoSaved = Object.entries(coSaveCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([id]) => id);

    const recommendations = await Listing.find({ _id: { $in: topCoSaved } })
      .populate('category', 'name icon slug')
      .lean();

    return NextResponse.json({ success: true, data: recommendations, type: 'collaborative' });
  } catch (error) {
    console.error('Recommendations API Error:', error);
    return NextResponse.json({ success: false, data: [] });
  }
}
