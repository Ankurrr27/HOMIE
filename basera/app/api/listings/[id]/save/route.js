import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Listing from '@/models/Listing';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    await dbConnect();

    // Check if listing exists
    const listing = await Listing.findById(id);
    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const alreadySaved = user.savedListings.some(item => item.toString() === id);
    if (!alreadySaved) {
      user.savedListings.push(id);
      await user.save();
      await Listing.findByIdAndUpdate(id, { $inc: { saveCount: 1 } });
    }

    return NextResponse.json({
      success: true,
      message: 'Listing saved successfully',
      isSaved: true
    });
  } catch (error) {
    console.error('POST /api/listings/[id]/save Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const alreadySaved = user.savedListings.some(item => item.toString() === id);
    if (alreadySaved) {
      user.savedListings.pull(id);
      await user.save();
      await Listing.findByIdAndUpdate(id, { $inc: { saveCount: -1 } });
    }

    return NextResponse.json({
      success: true,
      message: 'Listing removed from saved',
      isSaved: false
    });
  } catch (error) {
    console.error('DELETE /api/listings/[id]/save Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
