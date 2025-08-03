import { NextResponse } from 'next/server';
import { getSubscription } from '@/app/supabase-server';

export async function GET() {
  try {
    const subscription = await getSubscription();
    return NextResponse.json({ subscription });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}