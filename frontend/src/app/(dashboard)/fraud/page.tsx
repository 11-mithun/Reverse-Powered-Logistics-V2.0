'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { agentsApi, premiumApi } from '@/lib/api'
import { api } from '@/lib/api'
import { ShieldAlert, Database, RefreshCw, Zap, AlertTriangle, Eye, TrendingUp } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
         BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

const ARCHETYPE_META: Record<string, { color: string; icon: string; desc: string }> = {
  wardrobing:           { color: '#f59e0b', icon: '🛍️', desc: 'Buy, use, return (clothing/electronics)' },
  switch_fraud:         { color: '#f43f5e', icon: '🔄', desc: 'Returns different item, keeps original' },
  identity_fraud:       { color: '#8b5cf6', icon: '🎭', desc: 'Multiple accounts, same delivery address' },
  collusion_fraud:      { color: '#06b6d4', icon: '🤝', desc: 'Insider + customer working together' },
  opportunistic_fraud:  { color: '#10b981', icon: '🎯', desc: 'Exploiting lenient return policies' },
}

function RadarCard({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.06)" />
        <PolarAngleAxis dataKey="archetype" tick={{ fontSize: 10, fill: '#64748b' }} />
        <Radar name="Count" dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export default function FraudPage() {
  const [flagged, setFlagged]       = useState<any[]>([])
  const [synthStats, setSynthStats] = useState<any>(null)
  const [dataset, setDataset]       = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected]     = useState<any>(null)
  const [genForm, setGenForm]       = useState({ n_fraud: 100, n_legitimate: 200 })

  const load = useCallback(async () => {
    const [f, s] = await Promise.allSettled([
      api.get('/api/fraud/flagged'),
      agentsApi.syntheticStats(),
    ])
    if (f.status === 'fulfilled') setFlagged(f.value.data || [])
    if (s.status === 'fulfilled') setSynthStats(s.value.data)
  }, [])

  useEffect(() => { load() }, [load])

  const generate = async () => {
    setGenerating(true)
    try {
      const r = await agentsApi.generateSynthetic(genForm)
      setDataset(r.data)
    } catch {}
    setGenerating(false)
  }

  const archetypeData = dataset?.archetype_distribution
    ? Object.entries(dataset.archetype_distribution).map(([k, v]) => ({
        archetype: k.replace('_', ' '),
        count: v as number,
        color: ARCHETYPE_META[k]?.color || '#6366f1',
      }))
    : []

  const radarData = archetypeData.map(d => ({
    archetype: d.archetype.split(' ')[0],
    count: d.count,
  }))

  const FRAUD_COLOR: Record<string, string> = { High: '#f43f5e', Medium: '#f59e0b', Low: '#10b981' }

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Fraud Intelligence</h1>
          <p className="text-white/40 text-sm mt-0.5">GAN Synthetic Data Vault + High-risk return detection</p>
        </div>
        <button onClick={load} className="btn-ghost py-2 px-3 flex items-center gap-2 text-sm">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* GAN Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Fraud Archetypes',     value: synthStats?.fraud_archetypes ?? 5,        color: '#8b5cf6', icon: Database },
          { label: 'Synthetic Records',    value: synthStats?.total_synthetic_records ?? 0,  color: '#06b6d4', icon: Zap },
          { label: 'Realism Score',        value: synthStats?.avg_discriminator_score ? `${(synthStats.avg_discriminator_score * 100).toFixed(0)}%` : '—', color: '#10b981', icon: TrendingUp },
          { label: 'High-Risk Flagged',    value: flagged.length,                            color: '#f43f5e', icon: ShieldAlert },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="holographic rounded-2xl p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${item.color}22`, border: `1px solid ${item.color}33` }}>
              <item.icon size={16} style={{ color: item.color }} />
            </div>
            <p className="text-2xl font-black text-white">{item.value}</p>
            <p className="text-white/45 text-xs mt-0.5">{item.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* GAN Generator */}
        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database size={15} className="text-violet-400" />
            <span className="text-white font-semibold">GAN Synthetic Data Generator</span>
          </div>
          <p className="text-white/40 text-xs mb-4 leading-relaxed">
            Generates synthetic fraudulent return patterns across 5 archetypes to solve the cold-start
            problem for ML fraud detection training.
          </p>

          {/* Archetypes */}
          <div className="space-y-2 mb-4">
            {Object.entries(ARCHETYPE_META).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 p-2 rounded-xl bg-white/3">
                <span className="text-lg">{v.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold capitalize">{k.replace('_', ' ')}</p>
                  <p className="text-white/35 text-[10px]">{v.desc}</p>
                </div>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: v.color }} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {[['Fraud Samples', 'n_fraud'], ['Legit Samples', 'n_legitimate']].map(([label, key]) => (
              <div key={key}>
                <label className="text-white/40 text-xs block mb-1">{label}</label>
                <input type="number" value={(genForm as any)[key]}
                  onChange={e => setGenForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                  className="input-premium" min={10} max={2000} />
              </div>
            ))}
          </div>

          <motion.button onClick={generate} disabled={generating} whileTap={{ scale: 0.97 }}
            className="btn-brand w-full flex items-center justify-center gap-2">
            <Zap size={14} />
            {generating ? 'Generating Dataset…' : 'Generate Training Dataset'}
          </motion.button>
        </div>

        {/* Dataset result */}
        <AnimatePresence>
          {dataset ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="card-glass rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">Generated Dataset</span>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${dataset.quality_gate_passed ? 'badge-success' : 'badge-warning'}`}>
                  {dataset.quality_gate_passed ? '✅ Quality Gate Passed' : '⚠️ Quality Gate Failed'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Total Samples',   dataset.total_samples],
                  ['Fraud',           dataset.fraud_samples],
                  ['Legitimate',      dataset.legitimate_samples],
                  ['Realism Score',   `${(dataset.avg_discriminator_realism_score * 100).toFixed(0)}%`],
                  ['Cold-Start',      dataset.cold_start_problem],
                  ['Dataset ID',      dataset.dataset_id?.slice(-8)],
                ].map(([k, v]) => (
                  <div key={k as string} className="bg-white/4 rounded-xl p-2.5">
                    <p className="text-white/40 text-[10px]">{k}</p>
                    <p className="text-white font-bold text-sm mt-0.5">{v}</p>
                  </div>
                ))}
              </div>

              {archetypeData.length > 0 && (
                <>
                  <p className="text-white/50 text-xs font-medium">Archetype Distribution</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {archetypeData.map(a => (
                      <div key={a.archetype} className="flex items-center gap-2">
                        <span className="text-white/50 text-[10px] w-24 truncate capitalize">{a.archetype}</span>
                        <div className="flex-1 progress-bar">
                          <div className="progress-fill" style={{ width: `${(a.count / dataset.fraud_samples) * 100}%`, background: a.color }} />
                        </div>
                        <span className="text-white/60 text-[10px] w-6 text-right">{a.count}</span>
                      </div>
                    ))}
                  </div>
                  <RadarCard data={radarData} />
                </>
              )}
            </motion.div>
          ) : (
            <div className="card-glass rounded-2xl p-5 flex items-center justify-center">
              <div className="text-center">
                <ShieldAlert size={36} className="text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">Generate a dataset to see GAN analysis</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* High-risk flagged returns */}
      <div className="card-glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={15} className="text-rose-400" />
          <span className="text-white font-semibold">High-Risk Flagged Returns ({flagged.length})</span>
        </div>

        {flagged.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full table-premium">
              <thead>
                <tr>
                  {['Order ID', 'Product', 'Category', 'Price', 'Damage', 'Fraud Risk', 'Reason', 'Action'].map(h => (
                    <th key={h} className="text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flagged.map((r, i) => (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    onClick={() => setSelected(selected?.id === r.id ? null : r)}
                    className="cursor-pointer">
                    <td className="font-mono text-brand-400 text-xs">{r.order_id}</td>
                    <td className="font-medium text-white max-w-32 truncate">{r.product_name}</td>
                    <td className="text-white/60">{r.category}</td>
                    <td className="text-white font-semibold">₹{r.product_price?.toLocaleString()}</td>
                    <td>
                      <span className="text-xs" style={{ color: { 'No Damage': '#10b981', 'Minor Damage': '#f59e0b', 'Moderate Damage': '#f97316', 'Severe Damage': '#f43f5e' }[r.damage_level] || '#fff' }}>
                        {r.damage_level}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-${r.fraud_risk === 'High' ? 'danger' : r.fraud_risk === 'Medium' ? 'warning' : 'success'}`}>
                        {r.fraud_risk}
                      </span>
                    </td>
                    <td className="text-white/50 text-xs max-w-40 truncate">{r.return_reason}</td>
                    <td>
                      <button className="text-white/40 hover:text-white transition-colors">
                        <Eye size={13} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <ShieldAlert size={32} className="text-emerald-400/30 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No high-risk returns flagged</p>
              <p className="text-white/20 text-xs mt-1">System is clear ✅</p>
            </div>
          </div>
        )}

        {/* Expanded row */}
        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 rounded-2xl overflow-hidden"
              style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={13} className="text-rose-400" />
                <span className="text-white text-sm font-semibold">Fraud Detail — {selected.order_id}</span>
                <button onClick={() => setSelected(null)} className="ml-auto text-white/30 hover:text-white text-xs">✕</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['AI Reasoning', selected.ai_reasoning?.slice(0, 80) + '…'],
                  ['NRV', `₹${selected.net_recovery_value?.toFixed(0)}`],
                  ['Priority', selected.priority_level],
                  ['Routing', selected.routing_destination],
                ].map(([k, v]) => (
                  <div key={k as string} className="bg-white/4 rounded-xl p-3">
                    <p className="text-white/40 text-[10px] mb-1">{k}</p>
                    <p className="text-white text-xs font-medium leading-relaxed">{v}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
