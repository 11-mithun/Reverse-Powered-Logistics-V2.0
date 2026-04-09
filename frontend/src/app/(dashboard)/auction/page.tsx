'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { premiumApi } from '@/lib/api'
import { Trophy, Plus, RefreshCw, TrendingUp, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuctionPage() {
  const [auctions, setAuctions] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ product_name:'Samsung 4K TV',category:'Electronics',damage_level:'Moderate Damage',product_price:25000,duration_hours:24 })

  const fetch = useCallback(async () => {
    const r = await premiumApi.listAuctions()
    setAuctions(r.data)
  }, [])

  const fetchSelected = useCallback(async (id: string) => {
    const r = await premiumApi.getAuction(id)
    setSelected(r.data)
  }, [])

  useEffect(() => { fetch(); const iv=setInterval(fetch,10000); return ()=>clearInterval(iv) }, [fetch])
  useEffect(() => {
    if (!selected) return
    const iv = setInterval(() => fetchSelected(selected.auction_id), 5000)
    return () => clearInterval(iv)
  }, [selected, fetchSelected])

  const create = async () => {
    setCreating(true)
    try {
      const r = await premiumApi.createAuction({...form, reserve_price: form.product_price*0.25})
      setAuctions(a=>[r.data,...a])
      setSelected(r.data)
      toast.success('Auction created & bids incoming!')
    } catch { toast.error('Failed') }
    setCreating(false)
  }

  const statusColor = (s: string) => s==='OPEN'?'#10b981':s==='CLOSED'?'#94a3b8':'#f59e0b'

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Reverse Auctions</h1>
          <p className="text-white/40 text-sm">Liquidation partners bid in real-time for returned items</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Create form */}
        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Plus size={16} className="text-brand-400" />
            <span className="text-white font-semibold">Create New Auction</span>
          </div>
          <div className="space-y-3">
            {[['Product Name','product_name','text'],['Product Price','product_price','number'],['Duration (hours)','duration_hours','number']].map(([lbl,k,t])=>(
              <div key={k as string}>
                <label className="text-white/50 text-xs block mb-1">{lbl}</label>
                <input type={t as string} value={(form as any)[k as string]}
                  onChange={e=>setForm(f=>({...f,[k as string]:t==='number'?Number(e.target.value):e.target.value}))}
                  className="input-premium" />
              </div>
            ))}
            <div>
              <label className="text-white/50 text-xs block mb-1">Damage Level</label>
              <select value={form.damage_level} onChange={e=>setForm(f=>({...f,damage_level:e.target.value}))}
                className="input-premium">
                {['No Damage','Minor Damage','Moderate Damage','Severe Damage'].map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="pt-1">
              <p className="text-white/30 text-xs mb-2">Reserve Price: ₹{(form.product_price*0.25).toLocaleString()}</p>
              <motion.button onClick={create} disabled={creating} whileTap={{scale:0.97}}
                className="btn-brand w-full flex items-center justify-center gap-2">
                <Trophy size={14} />
                {creating ? 'Creating…' : 'Launch Auction'}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Live auction detail */}
        {selected ? (
          <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-bold">{selected.product_name}</p>
                <p className="text-white/40 text-xs">{selected.auction_id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="status-dot-live" style={{background:statusColor(selected.status)}} />
                <span className="text-sm font-semibold" style={{color:statusColor(selected.status)}}>{selected.status}</span>
                <button onClick={()=>fetchSelected(selected.auction_id)} className="btn-ghost py-1 px-2 ml-1">
                  <RefreshCw size={11} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[{label:'Reserve',val:`₹${selected.reserve_price?.toLocaleString()}`},{label:'Current Bid',val:`₹${selected.current_bid?.toLocaleString()}`,highlight:true},{label:'Bids',val:selected.bid_count}].map((item,i)=>(
                <div key={i} className="rounded-xl p-3 text-center" style={item.highlight?{background:'rgba(16,185,129,0.12)',border:'1px solid rgba(16,185,129,0.2)'}:{background:'rgba(255,255,255,0.04)'}}>
                  <p className="text-xs text-white/40">{item.label}</p>
                  <p className={`font-black text-lg mt-0.5 ${item.highlight?'text-emerald-400':'text-white'}`}>{item.val}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[...selected.bids].reverse().map((bid:any,i:number)=>(
                <div key={bid.bid_id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/4">
                  <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-[10px] font-bold">{i+1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{bid.partner_name}</p>
                    <p className="text-white/30 text-[10px]">{bid.timestamp?.slice(11,19)}</p>
                  </div>
                  <p className="text-emerald-400 font-bold text-sm">₹{bid.amount?.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card-glass rounded-2xl p-5 flex items-center justify-center">
            <p className="text-white/20">Create or select an auction</p>
          </div>
        )}
      </div>

      {/* Auctions list */}
      {auctions.length > 0 && (
        <div className="card-glass rounded-2xl p-5">
          <span className="text-white font-semibold block mb-3">All Auctions ({auctions.length})</span>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {auctions.map(a => (
              <motion.div key={a.auction_id} whileHover={{scale:1.01}} onClick={()=>setSelected(a)}
                className={`card-stat rounded-xl p-3 cursor-pointer ${selected?.auction_id===a.auction_id?'border-brand-500/40':''}`}>
                <div className="flex items-center justify-between">
                  <p className="text-white text-xs font-semibold truncate">{a.product_name}</p>
                  <span className="text-[10px] font-bold" style={{color:statusColor(a.status)}}>{a.status}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/40 text-[10px]">{a.bid_count} bids</span>
                  <span className="text-emerald-400 font-bold text-sm">₹{a.current_bid?.toLocaleString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
