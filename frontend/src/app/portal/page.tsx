'use client'
import { useState } from 'react'
import { portalApi } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const CATEGORIES = ['Electronics','Clothing','Home & Kitchen','Sports','Furniture','Books','Toys','Beauty','Automotive']

export default function CustomerPortalPage() {
  const [tab, setTab] = useState<'submit'|'track'>('submit')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [trackId, setTrackId] = useState('')
  const [trackResult, setTrackResult] = useState<any>(null)
  const [form, setForm] = useState({ product_name:'', category:'Electronics', product_price:'', return_reason:'', days_since_purchase:'', customer_email:'', customer_name:'', order_id:'' })
  const u = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const fc = "w-full bg-navy-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-brand-500 transition-colors"

  const submit = async () => {
    setLoading(true)
    try {
      const res = await portalApi.submit({ ...form, product_price: +form.product_price, days_since_purchase: +form.days_since_purchase })
      setResult(res.data); toast.success('Return submitted!')
    } catch { toast.error('Submission failed') }
    setLoading(false)
  }

  const track = async () => {
    if (!trackId.trim()) return
    try {
      const res = await portalApi.track(trackId.trim())
      setTrackResult(res.data)
    } catch { toast.error('Return not found') }
  }

  return (
    <div className="min-h-screen bg-navy-950 bg-grid-pattern">
      <header className="bg-navy-900/80 border-b border-white/10 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-xs">RL</div>
            <span className="text-white font-bold text-sm">Returns Portal</span>
          </div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex gap-2 mb-8 bg-navy-900 rounded-2xl p-1">
          {(['submit','track'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-brand-500 text-white' : 'text-white/40 hover:text-white'}`}>
              {t === 'submit' ? '📦 Submit Return' : '🔍 Track Return'}
            </button>
          ))}
        </div>

        {tab === 'submit' && !result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-navy-900 border border-white/10 rounded-2xl p-8 space-y-4">
            <h2 className="text-white font-bold text-xl">Request a Return</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="text-white/50 text-xs mb-1 block">Product Name *</label><input value={form.product_name} onChange={e => u('product_name', e.target.value)} placeholder="What are you returning?" className={fc} /></div>
              <div><label className="text-white/50 text-xs mb-1 block">Category</label><select value={form.category} onChange={e => u('category', e.target.value)} className={fc}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className="text-white/50 text-xs mb-1 block">Purchase Price (₹) *</label><input type="number" value={form.product_price} onChange={e => u('product_price', e.target.value)} placeholder="999" className={fc} /></div>
              <div><label className="text-white/50 text-xs mb-1 block">Days Since Purchase *</label><input type="number" value={form.days_since_purchase} onChange={e => u('days_since_purchase', e.target.value)} placeholder="7" className={fc} /></div>
              <div><label className="text-white/50 text-xs mb-1 block">Order ID</label><input value={form.order_id} onChange={e => u('order_id', e.target.value)} placeholder="ORD-12345" className={fc} /></div>
              <div><label className="text-white/50 text-xs mb-1 block">Your Name</label><input value={form.customer_name} onChange={e => u('customer_name', e.target.value)} placeholder="Full name" className={fc} /></div>
              <div><label className="text-white/50 text-xs mb-1 block">Email</label><input type="email" value={form.customer_email} onChange={e => u('customer_email', e.target.value)} placeholder="you@example.com" className={fc} /></div>
              <div className="col-span-2"><label className="text-white/50 text-xs mb-1 block">Reason for Return *</label><textarea value={form.return_reason} onChange={e => u('return_reason', e.target.value)} rows={3} placeholder="Please describe the issue in detail..." className={fc + ' resize-none'} /></div>
            </div>
            <button onClick={submit} disabled={loading || !form.product_name || !form.product_price || !form.return_reason}
              className="btn-brand w-full disabled:opacity-40 flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              Submit Return Request
            </button>
          </motion.div>
        )}

        {tab === 'submit' && result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-navy-900 border border-white/10 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-white font-black text-2xl mb-2">Return Submitted!</h2>
            <p className="text-white/50 mb-4">Your return has been processed by our AI system.</p>
            <div className="bg-navy-950 rounded-xl p-4 mb-4 font-mono text-sm">
              <p className="text-white/40 text-xs mb-2">Return ID (save this to track)</p>
              <p className="text-teal-400 break-all">{result.return_id}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/5 rounded-xl p-3"><p className="text-white/40 text-xs">Decision</p><p className="text-brand-400 font-bold">{result.action}</p></div>
              <div className="bg-white/5 rounded-xl p-3"><p className="text-white/40 text-xs">Status</p><p className="text-green-400 font-bold">Pending Review</p></div>
            </div>
            <button onClick={() => setResult(null)} className="btn-outline w-full mt-4">Submit Another Return</button>
          </motion.div>
        )}

        {tab === 'track' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-navy-900 border border-white/10 rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-4">Track Your Return</h2>
              <div className="flex gap-2">
                <input value={trackId} onChange={e => setTrackId(e.target.value)} onKeyDown={e => e.key === 'Enter' && track()}
                  placeholder="Enter your Return ID..." className={fc} />
                <button onClick={track} className="btn-brand px-5">Track</button>
              </div>
            </div>
            {trackResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-navy-900 border border-white/10 rounded-2xl p-6">
                <div className="grid grid-cols-2 gap-4">
                  {[['Return ID', trackResult.id?.slice(0, 8) + '...'], ['Status', trackResult.status], ['Action', trackResult.action], ['Destination', trackResult.destination]].map(([k, v]) => (
                    <div key={k} className="bg-white/5 rounded-xl p-3"><p className="text-white/40 text-xs">{k}</p><p className="text-white font-semibold text-sm">{v}</p></div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
