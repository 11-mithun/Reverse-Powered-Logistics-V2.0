'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { premiumApi } from '@/lib/api'
import { Package, Brain, ShoppingCart, AlertTriangle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['Electronics', 'Home & Kitchen', 'Automotive', 'Sports', 'Default']
const DAMAGE_LEVELS = ['Minor Damage', 'Moderate Damage', 'Severe Damage']

export default function ProcurementPage() {
  const [form, setForm] = useState({ category: 'Electronics', damage_level: 'Moderate Damage', product_price: 18000, return_volume_30d: 12 })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      const r = await premiumApi.cognitiveProcurement(form)
      setResult(r.data)
    } catch { toast.error('Request failed') }
    setLoading(false)
  }

  const URGENCY_COLOR: Record<string, string> = { HIGH: '#f43f5e', MEDIUM: '#f59e0b', LOW: '#10b981' }

  return (
    <div className="p-5 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Cognitive Procurement</h1>
        <p className="text-white/40 text-sm mt-1">AI predicts spare parts to order based on damage patterns & return volume</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Config */}
        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={15} className="text-brand-400" />
            <span className="text-white font-semibold">Procurement Parameters</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-white/50 text-xs block mb-1">Product Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="input-premium bg-surface-800">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">Damage Level</label>
              <select value={form.damage_level} onChange={e => setForm(f => ({ ...f, damage_level: e.target.value }))}
                className="input-premium bg-surface-800">
                {DAMAGE_LEVELS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">Avg Product Price (₹)</label>
              <input type="number" value={form.product_price}
                onChange={e => setForm(f => ({ ...f, product_price: Number(e.target.value) }))}
                className="input-premium" />
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">Return Volume (last 30 days)</label>
              <input type="number" value={form.return_volume_30d}
                onChange={e => setForm(f => ({ ...f, return_volume_30d: Number(e.target.value) }))}
                className="input-premium" />
            </div>
            <motion.button onClick={run} disabled={loading} whileTap={{ scale: 0.97 }}
              className="btn-brand w-full flex items-center justify-center gap-2 mt-2">
              <Brain size={14} />
              {loading ? 'Analysing…' : 'Run AI Procurement Analysis'}
            </motion.button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          <AnimatePresence>
            {result ? (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total Investment', value: `₹${result.total_procurement_value?.toLocaleString()}`, color: '#6366f1' },
                    { label: 'Strategy', value: result.procurement_strategy, color: '#10b981' },
                    { label: 'AI Confidence', value: `${(result.ai_confidence * 100).toFixed(0)}%`, color: '#f59e0b' },
                  ].map((item, i) => (
                    <div key={i} className="holographic rounded-xl p-3 text-center">
                      <p className="text-white/40 text-xs">{item.label}</p>
                      <p className="font-black text-lg mt-0.5" style={{ color: item.color }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Parts */}
                <div className="card-glass rounded-2xl p-5">
                  <span className="text-white font-semibold block mb-4">Recommended Parts ({result.recommended_parts?.length})</span>
                  <div className="space-y-3">
                    {result.recommended_parts?.map((part: any, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                        className="flex items-center gap-4 p-3 rounded-xl bg-white/4">
                        <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                          <Package size={16} className="text-brand-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-semibold text-sm">{part.part}</p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                              style={{ color: URGENCY_COLOR[part.urgency], background: `${URGENCY_COLOR[part.urgency]}22` }}>
                              {part.urgency}
                            </span>
                          </div>
                          <p className="text-white/40 text-xs mt-0.5">{part.supplier} • SKU: {part.sku} • {part.lead_days}d lead</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-white font-bold">₹{part.price?.toLocaleString()} × {part.suggested_order_qty}</p>
                          <p className="text-emerald-400 text-sm font-semibold">= ₹{part.total_order_value?.toLocaleString()}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {part.auto_po_eligible
                            ? <CheckCircle size={16} className="text-emerald-400" title="Auto-PO eligible" />
                            : <AlertTriangle size={16} className="text-amber-400" title="Manual review needed" />}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="card-glass rounded-2xl h-64 flex items-center justify-center">
                <div className="text-center">
                  <ShoppingCart size={32} className="text-white/10 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">Configure parameters and run analysis</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
