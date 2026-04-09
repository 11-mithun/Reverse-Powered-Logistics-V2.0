'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { agentsApi } from '@/lib/api'
import { Zap, TrendingDown, Package, Database, Globe, RefreshCw, Play } from 'lucide-react'

const MSG_COLORS: Record<string,string> = { INFO:'#6366f1', ACTION:'#06b6d4', ALERT:'#f59e0b', ESCALATION:'#f43f5e', RESOLUTION:'#10b981' }

function AgentCard({ name, status, task, color, icon: Icon, metrics }: any) {
  return (
    <motion.div whileHover={{scale:1.02,y:-2}} className="card-premium p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${color}22`,border:`1px solid ${color}33`}}>
            <Icon size={18} style={{color}} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{name}</p>
            <p className="text-white/40 text-xs">{task}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="status-dot-live" style={{background:color}} />
          <span className="text-xs font-medium" style={{color}}>{status}</span>
        </div>
      </div>
      {metrics && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {Object.entries(metrics).map(([k,v]:any) => (
            <div key={k} className="bg-white/4 rounded-lg p-2">
              <p className="text-white/40 text-[10px]">{k}</p>
              <p className="text-white font-semibold text-sm">{v}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function AgentsPage() {
  const [log, setLog] = useState<any[]>([])
  const [marketData, setMarketData] = useState<any>(null)
  const [invHealth, setInvHealth] = useState<any>(null)
  const [synthStats, setSynthStats] = useState<any>(null)
  const [running, setRunning] = useState(false)
  const [pipelineResult, setPipelineResult] = useState<any>(null)

  const fetchAll = useCallback(async () => {
    const [l,m,i,s] = await Promise.allSettled([
      agentsApi.communicationLog(20), agentsApi.marketDashboard(),
      agentsApi.inventoryHealth(), agentsApi.syntheticStats(),
    ])
    if (l.status==='fulfilled') setLog(l.value.data||[])
    if (m.status==='fulfilled') setMarketData(m.value.data)
    if (i.status==='fulfilled') setInvHealth(i.value.data)
    if (s.status==='fulfilled') setSynthStats(s.value.data)
  }, [])

  useEffect(() => { fetchAll(); const iv=setInterval(fetchAll,15000); return ()=>clearInterval(iv) },[fetchAll])

  const runDemo = async () => {
    setRunning(true)
    try {
      const r = await agentsApi.runPipeline({
        return_id:`RL-${Date.now()}`,category:'Electronics',sku:'SKU-TECH-042',
        original_price:18000,damage_level:'Moderate Damage',current_routing:'Repair Center',
        repair_cost:2500,warehouse_location:'Mumbai',fraud_risk:'Low',customer_ltv:35000,
      })
      setPipelineResult(r.data)
      await fetchAll()
    } catch {}
    setRunning(false)
  }

  const agents = [
    { name:'Market Dynamics Agent', status:'Active', task:'Real-time Asset Valuation', color:'#06b6d4', icon:TrendingDown,
      metrics:{'Categories Monitored':'9','Price Threshold':'20% drop','Routing Switches Today': marketData ? '3' : '—','Market Events':'5 types'} },
    { name:'Inventory Balancing Agent', status:'Active', task:'Autonomous Redistribution', color:'#10b981', icon:Package,
      metrics:{'Warehouses':String(invHealth?.total_warehouses||6),'Healthy':String(invHealth?.healthy||'—'),'Understocked':String(invHealth?.understocked||'—'),'Redistributions Today':String(invHealth?.redistributions_today||'—')} },
    { name:'Fraud Detection Agent', status:'Active', task:'Pattern Recognition', color:'#f43f5e', icon:Zap,
      metrics:{'Archetypes':'5','Synthetic Records':String(synthStats?.total_synthetic_records||0),'Cold-Start':'Solved','Discriminator Score':String(synthStats?.avg_discriminator_score||'N/A')} },
    { name:'GAN Synthetic Vault', status:'Ready', task:'Training Data Generator', color:'#8b5cf6', icon:Database,
      metrics:{'Fraud Archetypes':String(synthStats?.fraud_archetypes||5),'Model Status':synthStats?.model_status||'Ready','Realism Score':String(synthStats?.avg_discriminator_score||'—'),'Generated':String(synthStats?.total_synthetic_records||0)} },
    { name:'Escalation Agent', status:'Active', task:'CLV + Fraud Conflict Resolution', color:'#f59e0b', icon:Globe,
      metrics:{'Escalation Rules':'3','CLV Threshold':'₹50K','Human Override':'Enabled','Avg Resolution':'<2min'} },
  ]

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">AI Agent Hub</h1>
          <p className="text-white/40 text-sm">Multi-agent reasoning pipeline with live communication</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="btn-ghost py-2 px-3 flex items-center gap-2 text-sm">
            <RefreshCw size={13} /> Refresh
          </button>
          <motion.button onClick={runDemo} disabled={running} whileTap={{scale:0.97}}
            className="btn-brand flex items-center gap-2 text-sm">
            <Play size={13} />
            {running ? 'Running Pipeline…' : 'Run Demo Pipeline'}
          </motion.button>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((a,i) => <AgentCard key={i} {...a} />)}
      </div>

      {/* Pipeline Result */}
      <AnimatePresence>
        {pipelineResult && (
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
            className="card-glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={16} className="text-amber-400" />
              <span className="text-white font-semibold">Latest Pipeline Result</span>
              <span className="badge-success text-[10px] ml-auto">Complete</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                {label:'Final Routing',value:pipelineResult.final_routing?.slice(0,20)||'—'},
                {label:'Escalated',value:pipelineResult.escalated_to_human?'YES':'NO'},
                {label:'Agents Ran',value:pipelineResult.agents_ran?.length||5},
                {label:'Pipeline ID',value:pipelineResult.pipeline_id||'—'},
              ].map((item,i)=>(
                <div key={i} className="bg-white/4 rounded-xl p-3">
                  <p className="text-white/40 text-xs">{item.label}</p>
                  <p className="text-white font-bold text-sm mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Communication Log */}
      <div className="card-glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">Live Agent Communication Log</span>
            <span className="status-dot-live" />
          </div>
          <span className="text-white/30 text-xs">{log.length} messages</span>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {log.map((msg,i) => (
            <motion.div key={msg.message_id||i}
              initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}}
              transition={{delay:i*0.02}}
              className={`p-3 rounded-xl text-xs agent-msg-${msg.message_type?.toLowerCase()||'info'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-bold" style={{color:MSG_COLORS[msg.message_type]||'#6366f1'}}>{msg.from_agent}</span>
                <span className="text-white/20">→</span>
                <span className="text-white/50">{msg.to_agent}</span>
                <span className="badge-info text-[9px] ml-1">{msg.message_type}</span>
                <span className="ml-auto text-white/20 font-mono">{msg.timestamp?.slice(11,19)}</span>
              </div>
              <p className="text-white/65 leading-relaxed">{msg.content}</p>
            </motion.div>
          ))}
          {log.length===0 && (
            <p className="text-white/20 text-sm text-center py-8">Run the demo pipeline to see agent communications</p>
          )}
        </div>
      </div>
    </div>
  )
}
