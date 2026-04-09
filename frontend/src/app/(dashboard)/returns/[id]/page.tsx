'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { returnsApi, agentsApi, premiumApi } from '@/lib/api'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Brain, Zap, CheckCircle, AlertTriangle, Package, TrendingUp, RefreshCw, Play } from 'lucide-react'

const DMG_CLR: Record<string,string> = {'No Damage':'#10b981','Minor Damage':'#f59e0b','Moderate Damage':'#f97316','Severe Damage':'#f43f5e'}
const FRAUD_CLS: Record<string,string> = {High:'badge-danger',Medium:'badge-warning',Low:'badge-success'}

function ReasoningStep({step,text,agent,color,visible}:any) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} className="flex gap-3 items-start">
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
            style={{background:`${color}33`,border:`1px solid ${color}44`}}>{step}</div>
          <div>
            <span className="text-[10px] font-mono" style={{color}}>{agent}: </span>
            <span className="text-white/65 text-xs">{text}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function ReturnDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [agentResult, setAgentResult] = useState<any>(null)
  const [runningAgent, setRunningAgent] = useState(false)
  const [reasonStep, setReasonStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    returnsApi.get(id).then(r => { setItem(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [id])

  // D10: Auto-play reasoning steps
  useEffect(() => {
    if (!playing) return
    const steps = item?.ai_reasoning?.split('. ').filter(Boolean) || []
    if (reasonStep >= steps.length - 1) { setPlaying(false); return }
    const t = setTimeout(() => setReasonStep(s => s+1), 1100)
    return () => clearTimeout(t)
  }, [playing, reasonStep, item])

  const updateStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      const r = await returnsApi.update(id, {status: newStatus})
      setItem(r.data)
      toast.success(`Status updated to ${newStatus}`)
    } catch { toast.error('Update failed') }
    setUpdating(false)
  }

  const runAgentPipeline = async () => {
    if (!item) return
    setRunningAgent(true)
    try {
      const r = await agentsApi.runPipeline({
        return_id: item.id,
        category: item.category,
        sku: item.sku || 'SKU-UNKNOWN',
        original_price: item.product_price,
        damage_level: item.damage_level,
        current_routing: item.routing_destination,
        repair_cost: item.repair_cost || 0,
        warehouse_location: item.warehouse_location || 'Mumbai',
        fraud_risk: item.fraud_risk,
        customer_ltv: 45000,
      })
      setAgentResult(r.data)
      toast.success('Multi-agent pipeline complete!')
    } catch { toast.error('Pipeline failed') }
    setRunningAgent(false)
  }

  if (loading) return (
    <div className="p-5 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"/>
    </div>
  )

  if (!item) return (
    <div className="p-5 text-center">
      <p className="text-white/40">Return not found</p>
      <Link href="/returns"><button className="btn-ghost mt-4 text-sm">← Back</button></Link>
    </div>
  )

  const reasoningSteps = item.ai_reasoning?.split('. ').filter(Boolean) || []
  const stepColors = ['#f59e0b','#06b6d4','#10b981','#6366f1','#8b5cf6']
  const stepAgents = ['DamageClassifier','SalvageEngine','NRVCalculator','DecisionEngine','RoutingAgent']

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/returns">
            <button className="btn-ghost py-2 px-3 flex items-center gap-1.5 text-sm"><ArrowLeft size={13}/>Back</button>
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">{item.product_name}</h1>
            <p className="text-white/40 text-sm mt-0.5 font-mono">{item.order_id} • {item.id?.slice(0,8)}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <motion.button onClick={runAgentPipeline} disabled={runningAgent} whileTap={{scale:0.97}}
            className="btn-cyan flex items-center gap-2 text-sm py-2 px-4">
            <Zap size={13}/>{runningAgent ? 'Running Agents…' : 'Run Agent Pipeline'}
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: key details */}
        <div className="space-y-4">
          {/* AI Decision card */}
          <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={14} className="text-brand-400"/>
              <span className="text-white font-semibold">AI Decision</span>
              <span className="badge-info text-[10px] ml-auto">rule-based</span>
            </div>
            {[
              ['Damage', <span style={{color:DMG_CLR[item.damage_level]||'#fff'}} className="font-semibold">{item.damage_level}</span>],
              ['Action', <span className="text-brand-400 font-semibold">{item.recommended_action}</span>],
              ['Routing', <span className="text-cyan-400">{item.routing_destination}</span>],
              ['Priority', item.priority_level],
              ['Fraud Risk', <span className={FRAUD_CLS[item.fraud_risk]||'badge-info'}>{item.fraud_risk}</span>],
            ].map(([k,v]:any,i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 text-sm">
                <span className="text-white/40">{k}</span>
                <span className="text-white">{v}</span>
              </div>
            ))}
          </div>

          {/* Financials */}
          <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-emerald-400"/>
              <span className="text-white font-semibold">Financials</span>
            </div>
            {[
              ['Product Price', `Rs.${item.product_price?.toLocaleString()}`,'white'],
              ['Salvage %', `${item.salvage_value_percent}%`,'#f59e0b'],
              ['Resale Value', `Rs.${item.resale_value?.toFixed(0)}`,'#06b6d4'],
              ['Repair Cost', `Rs.${item.repair_cost?.toFixed(0)}`,'#f43f5e'],
              ['Holding Cost', `Rs.${item.holding_cost?.toFixed(0)}`,'#f43f5e'],
              ['Transport', `Rs.${item.transport_cost?.toFixed(0)}`,'#f97316'],
              ['Net Recovery', `Rs.${item.net_recovery_value?.toFixed(0)}`,item.net_recovery_value>=0?'#10b981':'#f43f5e'],
            ].map(([k,v,c]:any,i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/4 last:border-0 text-sm">
                <span className="text-white/40">{k}</span>
                <span className="font-semibold" style={{color:c==='white'?'#f1f5f9':c}}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Middle: reasoning + return info */}
        <div className="space-y-4">
          {/* D10: AI Reasoning Playback */}
          <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain size={14} className="text-brand-400"/>
                <span className="text-white font-semibold text-sm">AI Reasoning Playback</span>
              </div>
              <button onClick={() => { setReasonStep(0); setPlaying(true) }}
                className="btn-ghost py-1 px-2 text-xs flex items-center gap-1">
                <Play size={10}/> Replay
              </button>
            </div>
            <div className="space-y-2.5">
              {reasoningSteps.map((s:string,i:number) => (
                <ReasoningStep key={i} step={i+1} text={s.trim()+'.'} agent={stepAgents[i]||'AI'} color={stepColors[i%stepColors.length]} visible={i<=reasonStep}/>
              ))}
              {reasoningSteps.length === 0 && (
                <p className="text-white/20 text-xs">No reasoning data available</p>
              )}
            </div>
            {!playing && reasonStep < reasoningSteps.length - 1 && (
              <button onClick={() => setPlaying(true)} className="btn-ghost w-full mt-3 text-xs py-1.5">
                ▶ Play Step-by-Step
              </button>
            )}
          </div>

          {/* Return details */}
          <div className="card-glass rounded-2xl p-5">
            <span className="text-white font-semibold block mb-3 text-sm">Return Details</span>
            {[
              ['Customer', item.customer_name || item.customer_email || '—'],
              ['Category', item.category],
              ['Return Reason', item.return_reason],
              ['Days Since Purchase', `${item.days_since_purchase} days`],
              ['Location', item.warehouse_location || '—'],
              ['Supplier', item.supplier_name || '—'],
              ['SKU', item.sku || '—'],
              ['Created', item.created_at?.slice(0,10)],
            ].map(([k,v]:any,i) => (
              <div key={i} className="py-1.5 border-b border-white/4 last:border-0 text-sm">
                <p className="text-white/40 text-xs">{k}</p>
                <p className="text-white/80 text-xs mt-0.5 break-words">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: status + agent result */}
        <div className="space-y-4">
          {/* Status control */}
          <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package size={14} className="text-violet-400"/>
              <span className="text-white font-semibold text-sm">Status Control</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['pending','processing','completed','escalated'].map(s => (
                <button key={s} onClick={() => updateStatus(s)} disabled={updating||item.status===s}
                  className={`py-2 px-3 rounded-xl text-xs font-medium capitalize transition-all ${item.status===s
                    ? s==='completed'?'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      :s==='escalated'?'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      :'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    : 'btn-ghost'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Sustainability */}
          <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={14} className="text-emerald-400"/>
              <span className="text-white font-semibold text-sm">Sustainability</span>
            </div>
            {[
              ['Reuse Possible', item.reuse_possible],
              ['Recycling Needed', item.recycling_needed],
              ['Waste Reduction', item.waste_reduction],
            ].map(([k,v]:any,i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/4 last:border-0 text-sm">
                <span className="text-white/40 text-xs">{k}</span>
                <span className={typeof v === 'boolean' ? (v ? 'text-emerald-400' : 'text-rose-400') : 'text-white/70'} className="text-xs font-medium">
                  {typeof v === 'boolean' ? (v ? '✓ Yes' : '✗ No') : v}
                </span>
              </div>
            ))}
          </div>

          {/* Agent pipeline result */}
          <AnimatePresence>
            {agentResult && (
              <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="card-glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-amber-400"/>
                  <span className="text-white font-semibold text-sm">Agent Pipeline Result</span>
                </div>
                {[
                  ['Final Routing', agentResult.final_routing?.slice(0,25)||'—'],
                  ['Escalated', agentResult.escalated_to_human ? '🔴 Yes — Human Review' : '✅ No'],
                  ['Agents Ran', agentResult.agents_ran?.length || 5],
                  ['Pipeline ID', agentResult.pipeline_id],
                ].map(([k,v]:any,i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/4 last:border-0 text-xs">
                    <span className="text-white/40">{k}</span>
                    <span className="text-white/80 font-medium">{v}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
