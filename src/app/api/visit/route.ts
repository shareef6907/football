import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, user_agent } = body;
    
    const { error } = await supabase.from('visitor_logs').insert({
      path,
      user_agent,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown'
    });
    
    if (error) console.error('Visitor log error:', error);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: true });
  }
}

export async function GET() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: visitors } = await supabase
    .from('visitor_logs')
    .select('ip_address')
    .gte('created_at', today + 'T00:00:00Z')
    .lt('created_at', today + 'T23:59:59Z');
  
  const uniqueIPs = new Set(visitors?.map(v => v.ip_address));
  
  return NextResponse.json({ total: visitors?.length || 0, unique: uniqueIPs.size });
}
