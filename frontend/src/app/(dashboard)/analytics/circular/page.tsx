'use client'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#22c55e', '#00ACC1', '#FFB300', '#ef4444', '#a855f7']

export default function CircularPage() {
  const { data: circular, isLoading } = useQuery({
    queryKey: ['circular'],
    queryFn: () => analyticsApi.circular().then(r => r.data),
  })

  const pieData = (circular?.sankey_data || []).map((d: any, i: number) => ({
    name: d.action, value: d.count, color: COLORS[i % COLORS.length]
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-xl font-bold">Circular Economy Tracker</h2>
        <p className="text-white/40 text-sm mt-0.5">Track product second-life journeys and sustainability impact</p>
      </div>

      {/* Impact KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Items Reused', value: `${circular?.reuse_rate || 0}%`, icon: '♻️', color: '#22c55e' },
          { label: 'Items Recycled', value: `${circular?.recycle_rate || 0}%`, icon: '🔄', color: '#00ACC1' },
          { label: 'CO₂ Saved', value: `${circular?.co2_saved_kg || 0}kg`, icon: '🌿', color: '#22c55e' },
          { label: 'Waste Diverted', value: `${circular?.waste_diverted_kg || 0}kg`, icon: '🗑️', color: '#FFB300' },
        ].map(k => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-navy-900 border border-white/10 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">{k.icon}</div>
            <div className="text-2xl font-black" style={{ color: k.color }}>{k.value}</div>
            <div className="text-white/40 text-xs mt-1">{k.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-navy-900 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Product Fate Distribution</h3>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-white/30">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0D1B2A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
                <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sankey data table */}
        <div className="bg-navy-900 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Recovery Value by Action</h3>
          <div className="space-y-3">
            {(circular?.sankey_data || []).map((d: any, i: number) => (
              <div key={d.action} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">{d.action}</span>
                  <span className="text-white font-semibold">{d.count} items · ₹{d.value?.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((d.count / Math.max(...(circular?.sankey_data || [{}]).map((x: any) => x.count || 1))) * 100, 100)}%` }}
                    className="h-full rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-white/10">
            <p className="text-white/30 text-xs">
              ESG reporting: Export monthly circular economy data via
              <code className="text-teal-400 ml-1">GET /api/analytics/circular</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
