'use client'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { motion } from 'framer-motion'

export default function ForecastPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['forecast'],
    queryFn: () => analyticsApi.forecast().then(r => r.data),
  })
  const { data: risk } = useQuery({
    queryKey: ['product-risk'],
    queryFn: () => analyticsApi.productRisk().then(r => r.data),
  })

  const chartData = (data?.forecast || []).map((f: any) => ({
    day: `Day ${f.day}`,
    predicted: f.predicted,
    upper: f.upper,
    lower: f.lower,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-xl font-bold">Return Volume Forecast</h2>
        <p className="text-white/40 text-sm mt-1">30-day prediction using weighted moving average + seasonal patterns</p>
      </div>

      {/* Forecast chart */}
      <div className="bg-navy-900 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Next 30 Days</h3>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-brand-400" />Predicted</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-brand-400/30" />Confidence Band</span>
          </div>
        </div>
        {isLoading ? (
          <div className="h-72 flex items-center justify-center text-white/30">Loading forecast...</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradPred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6D00" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF6D00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#ffffff30', fontSize: 10 }}
                tickFormatter={(v, i) => i % 5 === 0 ? v : ''} />
              <YAxis tick={{ fill: '#ffffff30', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#0D1B2A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
              <Area type="monotone" dataKey="upper" stroke="transparent" fill="rgba(255,109,0,0.1)" />
              <Area type="monotone" dataKey="lower" stroke="transparent" fill="rgba(13,27,42,1)" />
              <Area type="monotone" dataKey="predicted" stroke="#FF6D00" strokeWidth={2} fill="url(#gradPred)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Product risk table */}
      <div className="bg-navy-900 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h3 className="text-white font-semibold">Product Lifecycle Risk Profiler</h3>
          <p className="text-white/40 text-xs mt-0.5">Products most likely to generate high future returns</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10">
              {['Product','Category','Return Rate','Risk Score','Recommendation'].map(h =>
                <th key={h} className="px-4 py-3 text-left text-white/40 text-xs font-semibold uppercase tracking-wider">{h}</th>
              )}
            </tr></thead>
            <tbody>
              {(risk || []).slice(0, 12).map((p: any, i: number) => (
                <motion.tr key={p.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-white/60">{p.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full w-16">
                        <div className="h-full rounded-full bg-brand-400" style={{ width: `${Math.min(p.return_rate, 100)}%` }} />
                      </div>
                      <span className="text-white/70 text-xs">{p.return_rate?.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      p.risk_label === 'High Risk' ? 'bg-red-500/20 text-red-400' :
                      p.risk_label === 'Medium Risk' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>{p.risk_label}</span>
                  </td>
                  <td className="px-4 py-3 text-white/50 text-xs">{p.recommendation}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
