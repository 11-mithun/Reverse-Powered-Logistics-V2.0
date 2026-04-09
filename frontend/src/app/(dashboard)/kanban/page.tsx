'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { premiumApi } from '@/lib/api'
import { Package, Clock, AlertTriangle, CheckCircle, Zap, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const COLUMNS = [
  { id:'pending', label:'Pending', icon:Clock, color:'#f59e0b', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)' },
  { id:'processing', label:'Processing', icon:Zap, color:'#6366f1', bg:'rgba(99,102,241,0.08)', border:'rgba(99,102,241,0.2)' },
  { id:'completed', label:'Completed', icon:CheckCircle, color:'#10b981', bg:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.2)' },
  { id:'escalated', label:'Escalated', icon:AlertTriangle, color:'#f43f5e', bg:'rgba(244,63,94,0.08)', border:'rgba(244,63,94,0.2)' },
]
const DAMAGE_COLORS: Record<string,string> = {'No Damage':'#10b981','Minor Damage':'#f59e0b','Moderate Damage':'#f97316','Severe Damage':'#f43f5e'}
const FRAUD_COLORS: Record<string,string> = {'Low':'#10b981','Medium':'#f59e0b','High':'#f43f5e'}

function ReturnCard({ item, onMove, columns }: any) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div layout
      initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.9,y:-10}}
      whileHover={{y:-2}}
      className="card-stat rounded-xl p-3 cursor-pointer mb-2"
      onClick={() => setOpen(o=>!o)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-white text-xs font-semibold truncate">{item.product_name}</p>
          <p className="text-white/40 text-[10px]">{item.order_id}</p>
        </div>
        <div className="flex-shrink-0">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{background:DAMAGE_COLORS[item.damage_level]+'22',color:DAMAGE_COLORS[item.damage_level]}}>
            {item.damage_level?.split(' ')[0]}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-white/60 text-[10px]">₹{item.product_price?.toLocaleString()}</span>
        <span className="text-white/20 text-[10px]">•</span>
        <span className="text-[10px]" style={{color:FRAUD_COLORS[item.fraud_risk]||'#10b981'}}>
          Fraud: {item.fraud_risk}
        </span>
        <span className="ml-auto text-white/30 text-[10px]">{item.priority_level}</span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
            className="overflow-hidden mt-2 pt-2 border-t border-white/8">
            <p className="text-white/50 text-[10px] mb-1.5 leading-relaxed line-clamp-2">{item.return_reason}</p>
            <p className="text-emerald-400 text-[10px] font-semibold">NRV: ₹{item.net_recovery_value?.toFixed(0)}</p>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {columns.filter((c:any)=>c.id!==item.status).map((col:any) => (
                <button key={col.id} onClick={e=>{e.stopPropagation();onMove(item.id,col.id)}}
                  className="text-[10px] px-2 py-0.5 rounded-md border transition-all"
                  style={{borderColor:col.border,color:col.color,background:col.bg}}>
                  → {col.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function KanbanPage() {
  const [board, setBoard] = useState<Record<string,any[]>>({})
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      const r = await premiumApi.kanbanItems()
      setBoard(r.data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const move = async (returnId: string, newStatus: string) => {
    try {
      await premiumApi.kanbanMove(returnId, newStatus)
      toast.success(`Moved to ${newStatus}`)
      await fetch()
    } catch { toast.error('Failed to move') }
  }

  const total = Object.values(board).reduce((s,arr) => s+(arr?.length||0), 0)

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Kanban Board</h1>
          <p className="text-white/40 text-sm">{total} returns • Drag-and-Drop workflow manager</p>
        </div>
        <button onClick={fetch} className="btn-ghost py-2 px-3 flex items-center gap-2 text-sm">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 h-[calc(100vh-200px)] overflow-hidden">
        {COLUMNS.map(col => {
          const items = board[col.id] || []
          return (
            <div key={col.id} className="flex flex-col rounded-2xl overflow-hidden"
              style={{background:col.bg, border:`1px solid ${col.border}`}}>
              <div className="px-3 py-2.5 border-b flex items-center gap-2 flex-shrink-0"
                style={{borderColor:col.border}}>
                <col.icon size={13} style={{color:col.color}} />
                <span className="text-white text-xs font-semibold">{col.label}</span>
                <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{background:col.color+'33',color:col.color}}>{items.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <AnimatePresence>
                  {items.map(item => (
                    <ReturnCard key={item.id} item={item} onMove={move} columns={COLUMNS} />
                  ))}
                </AnimatePresence>
                {items.length===0 && (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-white/20 text-xs">Empty</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
