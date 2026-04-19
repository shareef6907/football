import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'today';
  
  let startDate, endDate;
  const today = new Date().toISOString().split('T')[0];
  
  if (period === 'today') {
    startDate = today + 'T00:00:00Z';
    endDate = today + 'T23:59:59Z';
  } else if (period === 'week') {
    const d = new Date(); d.setDate(d.getDate() - 7);
    startDate = d.toISOString().split('T')[0] + 'T00:00:00Z';
  } else if (period === 'month') {
    const d = new Date(); d.setDate(d.getDate() - 30);
    startDate = d.toISOString().split('T')[0] + 'T00:00:00Z';
  }
  
  const { data: visitors } = await supabase.from('visitor_logs').select('ip_address,path').gte('created_at', startDate).lt('created_at', endDate || today + 'T23:59:59Z');
  const unique = new Set(visitors?.map(v => v.ip_address));
  const pages: Record<string,number> = {};
  visitors?.forEach(v => { pages[v.path] = (pages[v.path] || 0) + 1; });
  
  return NextResponse.json({ period, total: visitors?.length || 0, uniqueVisitors: unique.size, pageViews: pages });
}
