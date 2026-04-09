'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { returnsApi } from '@/lib/api'
import Link from 'next/link'
import { Plus, Search, RefreshCw, ChevronLeft, ChevronRight, Eye, Upload } from 'lucide-react'

const ACTION_COLORS: Record<string,{bg:string;text:string}> = {
  'Restock':             {bg:'rgba(16,185,129,0.12)', text:'#34d399'},
  'Repack and Discount': {bg:'rgba(6,182,212,0.12)',  text:'#22d3ee'},
  'Refurbish':           {bg:'rgba(99,102,241,0.12)', text:'#a5b4fc'},
  'Liquidate':           {bg:'rgba(245,158,11,0.12)', text:'#fbbf24'},
  'Scrap / E-Waste':     {bg:'rgba(244,63,94,0.12)',  text:'#fb7185'},
}
const FRAUD_CLS: Record<string,string> = {High:'badge-danger',Medium:'badge-warning',Low:'badge-success'}
const DMG_CLR: Record<string,string> = {'No Damage':'#10b981','Minor Damage':'#f59e0b','Moderate Damage':'#f97316','Severe Damage':'#f43f5e'}

export default function ReturnsPage() {
  const [data, setData] = useState<any>({items:[],total:0,pages:1})
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [fraud, setFraud] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await returnsApi.list({page,per_page:15,status:status||undefined,fraud_risk:fraud||undefined,q:q||undefined})
      setData(r.data)
    } catch {}
    setLoading(false)
  }, [page, status, fraud, q])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Returns</h1>
          <p className="text-white/40 text-sm mt-0.5">{data.total} total returns in system</p>
        </div>
        <div className="flex gap-2">
          <Link href="/returns/batch">
            <button className="btn-ghost py-2 px-3 flex items-center gap-1.5 text-sm"><Upload size={13}/>Batch CSV</button>
          </Link>
          <Link href="/returns/submit">
            <button className="btn-brand flex items-center gap-1.5 text-sm py-2 px-4"><Plus size={14}/>New Return</button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}}
            placeholder="Search product, email, order..." className="input-premium pl-8 text-sm" />
        </div>
        <select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}
          className="input-premium w-auto bg-surface-800 text-sm">
          <option value="">All Status</option>
          {['pending','processing','completed','escalated'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={fraud} onChange={e=>{setFraud(e.target.value);setPage(1)}}
          className="input-premium w-auto bg-surface-800 text-sm">
          <option value="">All Fraud</option>
          {['Low','Medium','High'].map(f=><option key={f}>{f}</option>)}
        </select>
        <button onClick={load} className="btn-ghost py-2 px-3"><RefreshCw size={13}/></button>
      </div>

      <div className="card-glass rounded-2xl overflow-auto">
        <table className="w-full table-premium min-w-max">
          <thead>
            <tr>{['Order ID','Product','Category','Damage','Action','Fraud','NRV','Status',''].map(h=><th key={h} className="text-left whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? Array.from({length:6}).map((_,i)=>(
              <tr key={i}>{Array.from({length:9}).map((_,j)=><td key={j}><div className="h-4 bg-white/5 rounded animate-pulse w-20"/></td>)}</tr>
            )) : data.items.length===0 ? (
              <tr><td colSpan={9} className="text-center py-16 text-white/25 text-sm">No returns found. Submit your first return!</td></tr>
            ) : data.items.map((r:any)=>(
              <tr key={r.id} className="hover:bg-white/3 transition-colors">
                <td className="font-mono text-brand-400 text-xs">{r.order_id}</td>
                <td>
                  <p className="text-white text-xs font-medium max-w-36 truncate">{r.product_name}</p>
                  <p className="text-white/30 text-10">Rs.{r.product_price?.toLocaleString()}</p>
                </td>
                <td className="text-white/60 text-xs">{r.category}</td>
                <td><span className="text-xs font-medium" style={{color:DMG_CLR[r.damage_level]||'#fff'}}>{r.damage_level?.replace(' Damage','')}</span></td>
                <td>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                    style={{background:(ACTION_COLORS[r.recommended_action]||{bg:'rgba(255,255,255,0.08)'}).bg,color:(ACTION_COLORS[r.recommended_action]||{text:'#94a3b8'}).text}}>
                    {r.recommended_action}
                  </span>
                </td>
                <td><span className={FRAUD_CLS[r.fraud_risk]||'badge-info'}>{r.fraud_risk}</span></td>
                <td className={`text-xs font-semibold whitespace-nowrap ${(r.net_recovery_value||0)>=0?'text-emerald-400':'text-rose-400'}`}>
                  Rs.{r.net_recovery_value?.toFixed(0)}
                </td>
                <td>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${r.status==='completed'?'badge-success':r.status==='escalated'?'badge-danger':r.status==='processing'?'badge-info':'badge-warning'}`}>
                    {r.status}
                  </span>
                </td>
                <td>
                  <Link href={`/returns/${r.id}`}>
                    <button className="btn-ghost py-1 px-2 text-xs flex items-center gap-1"><Eye size={11}/>View</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.pages>1 && (
        <div className="flex items-center justify-between">
          <p className="text-white/30 text-xs">Page {page} of {data.pages} — {data.total} total</p>
          <div className="flex gap-2">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
              className="btn-ghost py-1.5 px-3 text-sm disabled:opacity-30 flex items-center gap-1">
              <ChevronLeft size={13}/> Prev
            </button>
            <button onClick={()=>setPage(p=>Math.min(data.pages,p+1))} disabled={page===data.pages}
              className="btn-ghost py-1.5 px-3 text-sm disabled:opacity-30 flex items-center gap-1">
              Next <ChevronRight size={13}/>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
