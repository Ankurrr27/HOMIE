import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Listing from '@/models/Listing';
import City from '@/models/City';
import Category from '@/models/Category';
import { callClaude, extractJSON } from '@/lib/anthropic';


function calculateLexicalScore(listing, searchQuery) {
  if (!searchQuery) return 0;
  const queryWords = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (queryWords.length === 0) return 0;

  const content = [
    listing.name || '',
    listing.description || '',
    listing.subcategory || '',
    ...(listing.tags || []),
    ...(listing.amenities || [])
  ].join(' ').toLowerCase();

  let score = 0;
  queryWords.forEach(word => {
    if (content.includes(word)) {
      score += 10;
      if ((listing.name || '').toLowerCase().includes(word)) {
        score += 15;
      }
      if (
        (listing.subcategory || '').toLowerCase().includes(word) ||
        (listing.tags || []).some(t => t.toLowerCase().includes(word))
      ) {
        score += 10;
      }
    }
  });
  return score;
}

function isPointInPolygon(lat, lng, polygon) {
  // polygon is array of [lng, lat] vertices.
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > lat) !== (yj > lat))
        && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const verified = searchParams.get('verified');
    const sortBy = searchParams.get('sortBy');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const polygon = searchParams.get('polygon');

    await dbConnect();

    // Resolve slugs to ObjectIds
    let cityDoc = null;
    if (city) {
      cityDoc = await City.findOne({ slug: city });
      if (!cityDoc) {
        return NextResponse.json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
    }

    let categoryIds = [];
    if (category) {
      const categorySlugs = category.split(',');
      const categoryDocs = await Category.find({ slug: { $in: categorySlugs } });
      categoryIds = categoryDocs.map(c => c._id);
      if (categoryIds.length === 0) {
        return NextResponse.json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
    }

    // Build query filter
    const query = { isActive: true };
    if (cityDoc) query.city = cityDoc._id;
    if (categoryIds.length > 0) query.category = { $in: categoryIds };
    if (subcategory) query.subcategory = subcategory;
    if (verified === 'true') query.isVerified = true;

    // Price query
    if (minPrice || maxPrice) {
      query['price.value'] = {};
      if (minPrice) query['price.value'].$gte = Number(minPrice);
      if (maxPrice) query['price.value'].$lte = Number(maxPrice);
    }

    // Parse Polygon if provided
    let parsedPolygon = null;
    if (polygon) {
      // Format: lng1,lat1;lng2,lat2;...;lng1,lat1
      parsedPolygon = polygon.split(';').map(pair => {
        const [lng, lat] = pair.split(',').map(Number);
        return [lng, lat];
      });
    }

    const useAIReRanking = search && !sortBy;

    // If Geospatial Polygon filter is present
    if (parsedPolygon) {
      // 1. Fetch all matching active listings for the city/filters from the database
      let candidates = await Listing.find(query)
        .populate('city', 'name slug')
        .populate('category', 'name slug icon')
        .lean();

      // 2. Filter in-memory using ray-casting point-in-polygon
      candidates = candidates.filter(c => {
        if (!c.coordinates || c.coordinates.lat === null || c.coordinates.lng === null) return false;
        return isPointInPolygon(c.coordinates.lat, c.coordinates.lng, parsedPolygon);
      });

      if (candidates.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        });
      }

      // 3. Apply sorting / AI re-ranking
      if (useAIReRanking) {
        // Compute Lexical scores
        candidates.forEach(c => {
          c.lexicalScore = calculateLexicalScore(c, search);
        });
        candidates.sort((a, b) => b.lexicalScore - a.lexicalScore);

        const rerankPool = candidates.slice(0, 6);
        let scoredItemsMap = new Map();

        try {
          const promptCandidates = rerankPool.map(c => `
- ID: ${c._id.toString()}
  Name: ${c.name}
  Description: ${c.description}
  Subcategory: ${c.subcategory}
  Price: ${c.price?.displayText || 'On Request'}
  Amenities: ${(c.amenities || []).join(', ')}
  Tags: ${(c.tags || []).join(', ')}
`).join('\n');

          const systemPrompt = `
You are a Semantic Search Re-ranker for the local directory app "Basera".
Evaluate how well the candidate listings match the user's semantic search query: "${search}"
Rate each candidate on a scale of 0 to 100 based on semantic relevance.
Give a brief 1-sentence explanation of why it fits.
Respond ONLY with a valid JSON array of objects:
[
  {
    "id": "listing_id_here",
    "score": 95,
    "reason": "Reason for score..."
  }
]
`;

          const responseText = await callClaude(
            [{ role: 'user', content: `Rate these listings:\n${promptCandidates}` }],
            systemPrompt,
            2048
          );

          const scores = extractJSON(responseText);
          if (Array.isArray(scores)) {
            scores.forEach(s => {
              if (s.id) scoredItemsMap.set(s.id, s);
            });
          }
        } catch (err) {
          console.error('LLM Re-ranking failed during polygon filter:', err);
        }

        candidates = candidates.map(c => {
          const idStr = c._id.toString();
          const llmResult = scoredItemsMap.get(idStr);

          if (llmResult) {
            return { ...c, aiMatchScore: llmResult.score, aiMatchReason: llmResult.reason };
          } else {
            const baselineScore = Math.max(0, Math.min(55, c.lexicalScore + 15));
            return {
              ...c,
              aiMatchScore: baselineScore,
              aiMatchReason: c.lexicalScore > 0 ? 'Keyword matches found in listing details.' : null
            };
          }
        });

        // Filter out irrelevant candidates that don't match the query
        candidates = candidates.filter(c => {
          if (scoredItemsMap.has(c._id.toString())) {
            return c.aiMatchScore >= 50;
          }
          return c.lexicalScore > 0;
        });

        // Sort by AI/Hybrid match score
        candidates.sort((a, b) => b.aiMatchScore - a.aiMatchScore);
      } else {
        // Standard in-memory sorting
        if (sortBy === 'rating') {
          candidates.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
        } else if (sortBy === 'price') {
          candidates.sort((a, b) => (a.price?.value || 0) - (b.price?.value || 0));
        } else if (sortBy === 'newest') {
          candidates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else {
          // Default sorting: Verified first, then highest rating
          candidates.sort((a, b) => {
            if (a.isVerified && !b.isVerified) return -1;
            if (!a.isVerified && b.isVerified) return 1;
            return (b.rating?.average || 0) - (a.rating?.average || 0);
          });
        }
      }

      // 4. Pagination slicing
      const skip = (page - 1) * limit;
      const paginatedData = candidates.slice(skip, skip + limit);

      return NextResponse.json({
        success: true,
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: candidates.length,
          totalPages: Math.ceil(candidates.length / limit)
        }
      });
    }

    // Standard Search flow (Non-Polygon)
    if (useAIReRanking) {
      // 1. Fetch up to 40 candidate listings matching the criteria (relaxed text search)
      const candidates = await Listing.find(query)
        .populate('city', 'name slug')
        .populate('category', 'name slug icon')
        .lean();

      if (candidates.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        });
      }

      // 2. Compute quick Lexical Scores
      candidates.forEach(c => {
        c.lexicalScore = calculateLexicalScore(c, search);
      });

      // Sort by lexical score to extract top candidates for LLM review
      candidates.sort((a, b) => b.lexicalScore - a.lexicalScore);

      // Select top 6 candidates for the LLM re-ranker
      const rerankPool = candidates.slice(0, 6);
      let scoredItemsMap = new Map();

      try {
        const promptCandidates = rerankPool.map(c => `
- ID: ${c._id.toString()}
  Name: ${c.name}
  Description: ${c.description}
  Subcategory: ${c.subcategory}
  Price: ${c.price?.displayText || 'On Request'}
  Amenities: ${(c.amenities || []).join(', ')}
  Tags: ${(c.tags || []).join(', ')}
`).join('\n');

        const systemPrompt = `
You are a Semantic Search Re-ranker for the local directory app "Basera".
Evaluate how well the candidate listings match the user's semantic search query: "${search}"
Rate each candidate on a scale of 0 to 100 based on semantic relevance.
Give a brief 1-sentence explanation of why it fits (e.g. "92% match: Great budget option close to Koramangala").
Respond ONLY with a valid JSON array of objects. Do not wrap it in markdown or add notes outside:
[
  {
    "id": "listing_id_here",
    "score": 95,
    "reason": "Reason for score..."
  }
]
`;

        const responseText = await callClaude(
          [{ role: 'user', content: `Rate these listings:\n${promptCandidates}` }],
          systemPrompt,
          2048
        );

        const scores = extractJSON(responseText);
        if (Array.isArray(scores)) {
          scores.forEach(s => {
            if (s.id) scoredItemsMap.set(s.id, s);
          });
        }
      } catch (err) {
        console.error('LLM Re-ranking failed, falling back to lexical sorting:', err);
      }

      // 3. Score and merge all candidates
      const scoredListings = candidates.map(c => {
        const idStr = c._id.toString();
        const llmResult = scoredItemsMap.get(idStr);

        if (llmResult) {
          return {
            ...c,
            aiMatchScore: llmResult.score,
            aiMatchReason: llmResult.reason
          };
        } else {
          // Candidates not reviewed by LLM or fallback: baseline score using lexical match
          const baselineScore = Math.max(0, Math.min(55, c.lexicalScore + 15));
          return {
            ...c,
            aiMatchScore: baselineScore,
            aiMatchReason: c.lexicalScore > 0 ? 'Keyword matches found in listing details.' : null
          };
        }
      });

      // Filter out irrelevant candidates that don't match the query
      let filteredListings = scoredListings.filter(c => {
        if (scoredItemsMap.has(c._id.toString())) {
          return c.aiMatchScore >= 50;
        }
        return c.lexicalScore > 0;
      });

      // 4. Sort by AI/Hybrid match score descending
      filteredListings.sort((a, b) => b.aiMatchScore - a.aiMatchScore);

      // Pagination
      const skip = (page - 1) * limit;
      const paginatedData = filteredListings.slice(skip, skip + limit);

      return NextResponse.json({
        success: true,
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: filteredListings.length,
          totalPages: Math.ceil(filteredListings.length / limit)
        }
      });
    }

    // Standard Non-AI Search Flow
    if (search) {
      query.$text = { $search: search };
    }

    // Sort strategy
    let sort = { isVerified: -1, 'rating.average': -1, createdAt: -1 };
    let scoreProj = {};

    if (search && !sortBy) {
      scoreProj = { score: { $meta: 'textScore' } };
      sort = { score: { $meta: 'textScore' } };
    } else if (sortBy === 'rating') {
      sort = { 'rating.average': -1, isVerified: -1 };
    } else if (sortBy === 'price') {
      sort = { 'price.value': 1, isVerified: -1 };
    } else if (sortBy === 'newest') {
      sort = { createdAt: -1, isVerified: -1 };
    }

    // Pagination
    const skip = (page - 1) * limit;

    const listings = await Listing.find(query, scoreProj)
      .populate('city', 'name slug')
      .populate('category', 'name slug icon')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Listing.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GET /api/listings Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}


export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'vendor' && session.user.role !== 'admin')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, categorySlug, subcategory, citySlug, locality, address, coordinates, price, contact, amenities, timing, tags } = body;

    if (!name || !description || !categorySlug || !citySlug || !locality || !address) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Resolve slugs to ObjectIds
    const cityDoc = await City.findOne({ slug: citySlug });
    const categoryDoc = await Category.findOne({ slug: categorySlug });

    if (!cityDoc || !categoryDoc) {
      return NextResponse.json(
        { success: false, error: 'Invalid city or category slug', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const listing = await Listing.create({
      name,
      description,
      category: categoryDoc._id,
      subcategory: subcategory || '',
      city: cityDoc._id,
      locality,
      address,
      coordinates: coordinates || null,
      price: price || { value: null, unit: 'on_request', displayText: 'On Request' },
      contact: contact || {},
      amenities: amenities || [],
      timing: timing || {},
      tags: tags || [],
      vendor: session.user.id,
      isActive: true,
      isVerified: false // Needs admin approval to get verified
    });

    // Increment city listing count
    await City.findByIdAndUpdate(cityDoc._id, { $inc: { listingCount: 1 } });

    return NextResponse.json({
      success: true,
      message: 'Listing created successfully. Waiting for admin approval.',
      data: listing
    }, { status: 211 }); // 211 or 201 Created
  } catch (error) {
    console.error('POST /api/listings Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
