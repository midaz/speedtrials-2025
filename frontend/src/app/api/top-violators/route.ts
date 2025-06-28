import { NextResponse } from 'next/server';
import { getTopViolators } from '@/lib/database';

export async function GET() {
  try {
    const topViolators = getTopViolators(30);
    return NextResponse.json({ results: topViolators, count: topViolators.length });
  } catch (error) {
    console.error('Top violators fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch top violators' }, { status: 500 });
  }
} 