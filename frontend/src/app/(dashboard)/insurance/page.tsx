'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { premiumApi } from '@/lib/api'
import { ShoppingBag, Shield, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const PLAN_ICONS: Record<string, any> = { 'INS-BASIC': Shield, 'INS-STD': ShoppingBag, 'INS-PREM': Zap }
const PLAN_COLORS: Record<string, string> = { 'INS-BASIC': '#06b6d4', 'INS-STD': '#6366f1', 'INS-PREM': '#f59e0b' }

export default function InsurancePage() {
  const [plans, setPlans] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>('INS-STD')
  const [price, setPrice] = useState(15000)
  const [claim, setClaim] = useState<any>(null)
  const [claimForm, setClaimForm] = useState({ damage_level: 'Moderate Damage', product_price: 15000, order_id: '' })
  const [filing, setFiling] = useState(false)
  const [claims, setClaims] = useState<any[]>([])

  useEffect(() => {
    premiumApi.insurancePlans(price).then(r => setPlans(r.data)).catch(() => {})
  }, [price])

  const fileClaim = async () => {
    setFiling(true)
    try {
      const r = await premiumApi.fileClaim({ ...claimForm, plan_id: selectedPlan })
      setClaim(r.data)
      setClaims(prev => [r.data, ...prev])
      toast.success(`Claim ${r.data.claim_id} filed — ₹${r.data.payout_amount?.toLocaleString()} payout`)
    } catch { toast.error('Failed to file claim') }
    setFiling(false)
  }

  return (
    <div className="p-5 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Return Insurance</h1>
        <p className="text-white/40 text-sm mt-1">Protect high-value returns with paid coverage at checkout</p>
      </div>

      {/* Price slider */}
      <div className="card-glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-semibold">Product Value</span>
          <span className="text-2xl font-black text-gradient-brand">₹{price.toLocaleString()}</span>
        </div>
        <input type="range" min={500} max={100000} step={500} value={price}
          onChange={e => setPrice(Number(e.target.value))}
          className="w-full accent-brand-500 cursor-pointer" />
        <div className="flex justify-between text-white/30 text-xs mt-1">
          <span>₹500</span><span>₹1,00,000</span>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => {
          const Icon = PLAN_ICONS[plan.plan_id] || Shield
          const color = PLAN_COLORS[plan.plan_id] || '#6366f1'
          const active = selectedPlan === plan.plan_id
          return (
            <motion.div key={plan.plan_id} whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => setSelectedPlan(plan.plan_id)}
              className={`rounded-2xl p-5 cursor-pointer transition-all relative overflow-hidden ${active ? 'card-premium border-2' : 'card-glass'}`}
              style={active ? { borderColor: color } : {}}>
              {active && (
                <div className="absolute top-3 right-3">
                  <CheckCircle size={16} style={{ color }} />
                </div>
              )}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: `${color}22`, border: `1px solid ${color}33` }}>
                <Icon size={22} style={{ color }} />
              </div>
              <p className="text-white font-bold text-lg">{plan.name}</p>
              <p className="text-3xl font-black mt-1" style={{ color }}>
                ₹{plan.premium_amount?.toLocaleString()}
              </p>
              <p className="text-white/40 text-xs mt-0.5">one-time premium</p>

              <div className="mt-4 space-y-2">
                {[
                  [`Coverage`, `${plan.coverage_pct}%`],
                  [`Max Payout`, `₹${plan.max_payout?.toLocaleString()}`],
                  [`Deductible`, plan.deductible === 0 ? 'None' : `₹${plan.deductible}`],
                  [`Actual Payout`, `₹${plan.max_payout_actual?.toLocaleString()}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-white/40">{k}</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Claim form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <AlertCircle size={15} className="text-amber-400" /> File a Claim
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-white/50 text-xs block mb-1">Product Price (₹)</label>
              <input type="number" value={claimForm.product_price}
                onChange={e => setClaimForm(f => ({ ...f, product_price: Number(e.target.value) }))}
                className="input-premium" />
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">Damage Level</label>
              <select value={claimForm.damage_level}
                onChange={e => setClaimForm(f => ({ ...f, damage_level: e.target.value }))}
                className="input-premium bg-surface-800">
                {['No Damage', 'Minor Damage', 'Moderate Damage', 'Severe Damage'].map(d =>
                  <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">Order ID (optional)</label>
              <input value={claimForm.order_id}
                onChange={e => setClaimForm(f => ({ ...f, order_id: e.target.value }))}
                placeholder="ORD-XXXXXXXX" className="input-premium" />
            </div>
            <p className="text-white/30 text-xs">Plan selected: <span className="text-brand-400">{selectedPlan}</span></p>
            <motion.button onClick={fileClaim} disabled={filing} whileTap={{ scale: 0.97 }}
              className="btn-brand w-full flex items-center justify-center gap-2 mt-1">
              {filing ? 'Processing…' : '⚡ File Claim'}
            </motion.button>
          </div>
        </div>

        {/* Latest claim result */}
        <AnimatePresence>
          {claim && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="card-glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={16} className="text-emerald-400" />
                <span className="text-white font-semibold">Claim Result</span>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${claim.status === 'APPROVED' ? 'badge-success' : 'badge-danger'}`}>
                  {claim.status}
                </span>
              </div>
              <div className="space-y-3">
                <div className="text-center py-4">
                  <p className="text-white/40 text-xs mb-1">Payout Amount</p>
                  <p className="text-5xl font-black text-gradient-emerald">
                    ₹{claim.payout_amount?.toLocaleString()}
                  </p>
                </div>
                <div className="divider-brand" />
                {[
                  ['Claim ID', claim.claim_id],
                  ['Plan', claim.plan_name],
                  ['Damage', claim.damage_level],
                  ['Deductible Applied', `₹${claim.deductible_applied}`],
                  ['Processing', `${claim.processing_days} days`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-white/40">{k}</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Claims history */}
      {claims.length > 0 && (
        <div className="card-glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Claims History</h2>
          <table className="w-full table-premium">
            <thead><tr>
              {['Claim ID', 'Plan', 'Damage', 'Payout', 'Status', 'Filed'].map(h =>
                <th key={h} className="text-left">{h}</th>)}
            </tr></thead>
            <tbody>
              {claims.map(c => (
                <tr key={c.claim_id}>
                  <td className="font-mono text-brand-400">{c.claim_id}</td>
                  <td>{c.plan_name}</td>
                  <td>{c.damage_level}</td>
                  <td className="text-emerald-400 font-semibold">₹{c.payout_amount?.toLocaleString()}</td>
                  <td><span className={c.status === 'APPROVED' ? 'badge-success' : 'badge-danger'}>{c.status}</span></td>
                  <td className="text-white/40 text-xs">{c.filed_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
