'use client'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'
import { motion } from 'framer-motion'

export default function ScorecardPage() {
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => analyticsApi.suppliers().then(r => r.data),
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-xl font-bold">Supplier Return Scorecard</h2>
        <p className="text-white/40 text-sm mt-0.5">Ranked by quality score — lower return rate = higher score</p>
      </div>
      {isLoading ? (
        <div className="py-16 text-center text-white/30">Loading scorecard...</div>
      ) : (
        <div className="bg-navy-900 border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-white/10 text-white/40 text-xs font-semibold uppercase tracking-wider">
            <span className="col-span-2">Supplier</span>
            <span>Returns</span>
            <span>Avg NRV</span>
            <span>Quality Score</span>
          </div>
          {(suppliers || []).map((s: any, i: number) => (
            <motion.div key={s.supplier} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className="grid grid-cols-5 gap-4 px-5 py-4 border-b border-white/5 items-center hover:bg-white/5 transition-colors">
              <div className="col-span-2 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-navy-900' : i === 1 ? 'bg-gray-300 text-navy-900' : i === 2 ? 'bg-yellow-600 text-white' : 'bg-white/10 text-white/50'}`}>
                  {i + 1}
                </div>
                <span className="text-white font-medium text-sm">{s.supplier || 'Unknown'}</span>
              </div>
              <span className="text-white/60 text-sm">{s.total_returns}</span>
              <span className={`text-sm font-mono ${s.avg_nrv > 0 ? 'text-green-400' : 'text-red-400'}`}>₹{s.avg_nrv?.toFixed(0)}</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${Math.min(s.quality_score, 100)}%`,
                    background: s.quality_score > 70 ? '#22c55e' : s.quality_score > 40 ? '#FFB300' : '#ef4444'
                  }} />
                </div>
                <span className="text-white font-bold text-sm w-10 text-right">{s.quality_score?.toFixed(0)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
