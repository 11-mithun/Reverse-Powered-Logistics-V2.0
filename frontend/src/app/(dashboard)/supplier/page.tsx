'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { premiumApi } from '@/lib/api'
import { Globe, AlertTriangle, CheckCircle, TrendingDown, RefreshCw, Award } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const GRADE_COLORS: Record<string, string> = { A: '#10b981', B: '#06b6d4', C: '#f59e0b', D: '#f43f5e' }
const REC_COLORS: Record<string, string> = { CONTINUE: '#10b981', REVIEW: '#f59e0b', REPLACE: '#f43f5e' }

export default function SupplierPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)

  const fetch = useCallback(async () => {
    try {
      const r = await premiumApi.supplierScorecard()
      setData(r.data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const suppliers = data?.suppliers || []
  const alerts = suppliers.filter((s: any) => s.alert_issued)

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Supplier Accountability</h1>
          <p className="text-white/40 text-sm mt-1">Quality scorecard, defect rates & auto-alerts</p>
        </div>
        <button onClick={fetch} className="btn-ghost py-2 px-3 flex items-center gap-2 text-sm">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Suppliers Tracked', value: data?.total_suppliers || 0, color: '#6366f1', icon: Globe },
          { label: 'Alerts Issued', value: data?.alerts_issued || 0, color: '#f43f5e', icon: AlertTriangle },
          { label: 'Grade A Suppliers', value: suppliers.filter((s: any) => s.grade === 'A').length, color: '#10b981', icon: Award },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="holographic rounded-2xl p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${item.color}22`, border: `1px solid ${item.color}33` }}>
              <item.icon size={16} style={{ color: item.color }} />
            </div>
            <p className="text-3xl font-black text-white">{item.value}</p>
            <p className="text-white/50 text-sm mt-0.5">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Active alerts */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-rose-400" />
              <span className="text-white font-semibold text-sm">{alerts.length} Quality Alert{alerts.length > 1 ? 's' : ''}</span>
            </div>
            {alerts.map((s: any) => (
              <div key={s.supplier_name} className="flex items-start gap-3 bg-white/4 rounded-xl p-3">
                <span className="text-rose-400 text-lg">⚠️</span>
                <div>
                  <p className="text-white text-sm font-semibold">{s.supplier_name}</p>
                  <p className="text-white/50 text-xs mt-0.5">{s.alert_message}</p>
                </div>
                <span className="ml-auto badge-danger text-[10px]">Grade {s.grade}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="lg:col-span-2 card-glass rounded-2xl p-5">
          <span className="text-white font-semibold block mb-4">Quality Score by Supplier</span>
          {suppliers.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={suppliers} margin={{ top: 0, right: 10, left: -20, bottom: 40 }}>
                <XAxis dataKey="supplier_name" tick={{ fontSize: 10, fill: '#475569' }} angle={-30} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#475569' }} />
                <Tooltip contentStyle={{ background: 'rgba(15,15,35,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, fontSize: 11 }}
                  formatter={(v: any) => [`${v}`, 'Quality Score']} />
                <Bar dataKey="quality_score" radius={[6, 6, 0, 0]}>
                  {suppliers.map((s: any, i: number) => (
                    <Cell key={i} fill={GRADE_COLORS[s.grade] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-white/20 text-sm">No supplier data yet — submit returns with supplier info</p>
            </div>
          )}
        </div>

        {/* Supplier list */}
        <div className="card-glass rounded-2xl p-4 overflow-y-auto max-h-80">
          <span className="text-white font-semibold block mb-3 text-sm">Supplier Rankings</span>
          {suppliers.length > 0 ? (
            <div className="space-y-2">
              {suppliers.map((s: any, i: number) => (
                <motion.div key={s.supplier_name} whileHover={{ x: 2 }}
                  onClick={() => setSelected(selected?.supplier_name === s.supplier_name ? null : s)}
                  className="cursor-pointer p-2.5 rounded-xl bg-white/4 hover:bg-white/8 transition-all">
                  <div className="flex items-center gap-2">
                    <span className="text-white/30 text-xs font-mono w-5">#{i + 1}</span>
                    <span className="text-white text-xs font-medium flex-1 truncate">{s.supplier_name}</span>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{ background: `${GRADE_COLORS[s.grade]}22`, color: GRADE_COLORS[s.grade] }}>
                      {s.grade}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 ml-7">
                    <div className="flex-1 progress-bar">
                      <div className="progress-fill" style={{ width: `${s.quality_score}%`, background: GRADE_COLORS[s.grade] }} />
                    </div>
                    <span className="text-white/50 text-[10px] w-8">{s.quality_score}</span>
                  </div>
                  <AnimatePresence>
                    {selected?.supplier_name === s.supplier_name && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="mt-2 ml-7 overflow-hidden space-y-1">
                        {[
                          ['Returns', s.total_returns],
                          ['Defect Rate', `${s.defect_rate_pct}%`],
                          ['Severe', s.severe_damage_count],
                          ['Recommendation', s.recommendation],
                        ].map(([k, v]) => (
                          <div key={k as string} className="flex justify-between text-[10px]">
                            <span className="text-white/40">{k}</span>
                            <span style={k === 'Recommendation' ? { color: REC_COLORS[v as string] || '#fff' } : { color: '#fff' }}
                              className="font-medium">{v}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-white/20 text-xs text-center py-8">No supplier data available</p>
          )}
        </div>
      </div>
    </div>
  )
}
