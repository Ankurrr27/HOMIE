import { NextResponse } from 'next/server';
import { SEARCH_EXTRACTION_PROMPT } from '@/prompts/search';
import { callClaude, extractJSON } from '@/lib/anthropic';

export async function POST(request) {
  let queryText = '';
  try {
    const { query, city } = await request.json();
    queryText = query || '';

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    const responseText = await callClaude(
      [{ role: 'user', content: `Extract search filters from: "${query}"` }],
      SEARCH_EXTRACTION_PROMPT(city)
    );

    // Parse JSON from Claude's response using the helper
    const filters = extractJSON(responseText);

    return NextResponse.json({ success: true, filters });
  } catch (error) {
    console.error('Search API Error:', error);
    // Graceful fallback: treat as keyword search without re-consuming stream
    return NextResponse.json({
      success: true,
      filters: { keyword: queryText },
    });
  }
}
