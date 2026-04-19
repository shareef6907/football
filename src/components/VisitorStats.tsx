'use client';
import { useState, useEffect } from 'react';
import { Eye, Users } from 'lucide-react';

export default function VisitorStats() {
  const [data, setData] = useState<{total:number,uniqueVisitors:number,pageViews:Record<string,number>} | null>(null);
  const [period, setPeriod] = useState<'today'|'week'|'month'>('today');
  
  useEffect(() => {
    fetch(`/api/visitor-stats?period=${period}`).then(r => r.json()).then(setData).catch(() => {});
  }, [period]);

  if (!data) return <div className="text-gray-400">Loading...</div>;
  if (data.total === 0) return <div className="glass rounded-2xl p-6"><h3 className="text-lg font-bold mb-4">👁️ Visitor Stats</h3><p className="text-gray-400">No visitors yet. Deploy to enable tracking.</p></div>;

  const topPages = Object.entries(data.pageViews || {}).sort((a,b) => b[1]-a[1]).slice(0,5);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">👁️ Visitor Stats</h3>
      <div className="flex gap-2">
        {(['today','week','month'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-full text-sm ${period === p ? 'bg-green-500 text-black' : 'bg-white/10 text-gray-400'}`}>{p}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-xl p-4"><div className="flex items-center gap-2 mb-1"><Eye className="w-4 h-4 text-blue-400"/><span className="text-xs text-gray-400">Views</span></div><div className="text-2xl font-bold">{data.total}</div></div>
        <div className="glass rounded-xl p-4"><div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-green-400"/><span className="text-xs text-gray-400">Unique</span></div><div className="text-2xl font-bold">{data.uniqueVisitors}</div></div>
      </div>
      {topPages.length > 0 && <div className="glass rounded-xl p-4">{topPages.map(([p,c]) => <div key={p} className="flex justify-between text-sm py-1"><span>{p}</span><span className="text-gray-500">{c}</span></div>)}</div>}
    </div>
  );
}
