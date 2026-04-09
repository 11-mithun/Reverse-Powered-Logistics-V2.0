'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { returnsApi, analyticsApi, agentsApi, premiumApi } from '@/lib/api'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis
} from 'recharts'
import {
  TrendingUp, TrendingDown, Zap, ShieldAlert, Package, Leaf,
  ArrowLeftRight, Brain, Globe, Trophy, RefreshCw
} from 'lucide-react'

// ── D2: Holographic Metric Card ────────────────────────────────────────────
function HoloCard({ title, value, sub, icon: Icon, color, trend, delay = 0 }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className="holographic rounded-2xl p-5 relative overflow-hidden"
      whileHover={{ scale: 1.02, y: -2 }}
    >
      {/* iridescent shimmer layer */}
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: `radial-gradient(circle at 30% 30%, ${color}22, transparent 60%)` }} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22`, border: `1px solid ${color}33` }}>
            <Icon size={18} style={{ color }} />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-3xl font-black text-white leading-none mb-1">{value}</p>
        <p className="text-white/70 text-sm font-medium">{title}</p>
        {sub && <p className="text-white/35 text-xs mt-1">{sub}</p>}
      </div>
    </motion.div>
  )
}

// ── D10: AI Reasoning Playback ─────────────────────────────────────────────
function ReasoningPlayback({ reasoning, engine }: { reasoning: string; engine: string }) {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  const steps = reasoning
    ? reasoning.split('. ').filter(Boolean).map((s, i) => ({
        id: i, text: s.trim() + '.',
        agent: i === 0 ? 'DamageClassifier' : i === 1 ? 'SalvageEngine' : i === 2 ? 'NRVCalculator' : 'DecisionEngine',
        color: i === 0 ? '#f59e0b' : i === 1 ? '#06b6d4' : i === 2 ? '#10b981' : '#6366f1',
      }))
    : []

  useEffect(() => {
    if (!playing) return
    if (step >= steps.length - 1) { setPlaying(false); return }
    const t = setTimeout(() => setStep(s => s + 1), 1200)
    return () => clearTimeout(t)
  }, [playing, step, steps.length])

  if (!reasoning) return null

  return (
    <div className="card-glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-brand-400" />
          <span className="text-white text-sm font-semibold">AI Reasoning Playback</span>
          <span className="badge-info text-[10px]">{engine}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setStep(0); setPlaying(true); }}
            className="btn-ghost py-1 px-2 text-xs flex items-center gap-1">
            <RefreshCw size={11} /> Replay
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {steps.map((s, i) => (
          <AnimatePresence key={s.id}>
            {i <= step && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-white"
                  style={{ background: s.color + '33', border: `1px solid ${s.color}44` }}>
                  {i + 1}
                </div>
                <div>
                  <span className="text-[10px] font-mono" style={{ color: s.color }}>{s.agent}: </span>
                  <span className="text-white/70 text-xs">{s.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>
    </div>
  )
}

// ── D1: Three.js Neural Globe (CSS fallback for Next.js SSR safety) ────────
function NeuralGlobeCanvas() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (typeof window === 'undefined' || !ref.current) return
    const canvas = document.createElement('canvas')
    canvas.width = ref.current.clientWidth || 300
    canvas.height = 200
    canvas.style.width = '100%'
    canvas.style.height = '200px'
    ref.current.appendChild(canvas)
    const ctx = canvas.getContext('2d')!
    const nodes: {x:number;y:number;vx:number;vy:number;r:number;color:string}[] = []
    const colors = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b']
    for (let i = 0; i < 40; i++) {
      nodes.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx:(Math.random()-0.5)*0.6, vy:(Math.random()-0.5)*0.6, r:Math.random()*3+1.5, color:colors[Math.floor(Math.random()*colors.length)] })
    }
    let animId: number
    function draw() {
      ctx.clearRect(0,0,canvas.width,canvas.height)
      // connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i+1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx*dx+dy*dy)
          if (dist < 80) {
            ctx.beginPath(); ctx.strokeStyle = `rgba(99,102,241,${(1-dist/80)*0.35})`
            ctx.lineWidth = 0.5; ctx.moveTo(nodes[i].x,nodes[i].y); ctx.lineTo(nodes[j].x,nodes[j].y); ctx.stroke()
          }
        }
      }
      nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2)
        ctx.fillStyle = n.color + 'cc'; ctx.fill()
        n.x += n.vx; n.y += n.vy
        if (n.x<0||n.x>canvas.width) n.vx*=-1
        if (n.y<0||n.y>canvas.height) n.vy*=-1
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); if (ref.current?.contains(canvas)) ref.current.removeChild(canvas) }
  }, [])
  return <div ref={ref} className="w-full rounded-xl overflow-hidden" style={{height:200}} />
}

// ── Carbon Offset Counter ──────────────────────────────────────────────────
function CarbonCounter({ kg }: { kg: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0; const dur = 1800; const t0 = Date.now()
    const step = () => {
      const progress = Math.min((Date.now()-t0)/dur,1)
      const ease = 1-Math.pow(1-progress,3)
      setDisplay(Math.round(ease*kg))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [kg])
  return (
    <span className="text-3xl font-black text-gradient-emerald">{display.toLocaleString()}</span>
  )
}

const COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#f43f5e','#8b5cf6']

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [daily, setDaily] = useState<any[]>([])
  const [carbon, setCarbon] = useState<any>(null)
  const [commsLog, setCommsLog] = useState<any[]>([])
  const [lastReturn, setLastReturn] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const [sRes, dRes, cRes, lRes, rRes] = await Promise.allSettled([
        returnsApi.stats(), analyticsApi.daily(14), agentsApi.carbonOffset(),
        agentsApi.communicationLog(8), returnsApi.list({ per_page: 1 })
      ])
      if (sRes.status==='fulfilled') setStats(sRes.value.data)
      if (dRes.status==='fulfilled') setDaily(dRes.value.data || [])
      if (cRes.status==='fulfilled') setCarbon(cRes.value.data)
      if (lRes.status==='fulfilled') setCommsLog(lRes.value.data || [])
      if (rRes.status==='fulfilled') setLastReturn(rRes.value.data?.items?.[0] || null)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll(); const iv = setInterval(fetchAll, 30000); return () => clearInterval(iv) }, [fetchAll])

  const kpis = [
    { title:'Total Returns', value: stats ? stats.total_returns?.toLocaleString() : '—', icon:ArrowLeftRight, color:'#6366f1', trend:12, sub:'All time', delay:0 },
    { title:'Recovery Value', value: stats ? `₹${(stats.total_recovery_value/100000).toFixed(1)}L` : '—', icon:TrendingUp, color:'#10b981', trend:8, sub:'Net recovered', delay:0.05 },
    { title:'Fraud Flags', value: stats ? stats.high_fraud_flags?.toLocaleString() : '—', icon:ShieldAlert, color:'#f43f5e', trend:-3, sub:'High risk cases', delay:0.1 },
    { title:'Avg Salvage', value: stats ? `${stats.avg_salvage_percent}%` : '—', icon:Package, color:'#f59e0b', trend:5, sub:'Recovery rate', delay:0.15 },
    { title:'CO₂ Saved', value: carbon ? `${carbon.total_co2_saved_kg?.toFixed(0)}kg` : '—', icon:Leaf, color:'#34d399', trend:15, sub:`${carbon?.trees_equivalent ?? 0} trees equiv.`, delay:0.2 },
    { title:'Active Agents', value:'5', icon:Brain, color:'#8b5cf6', trend:0, sub:'Running 24/7', delay:0.25 },
  ]

  const MSG_COLORS: Record<string, string> = { INFO:'#6366f1', ACTION:'#06b6d4', ALERT:'#f59e0b', ESCALATION:'#f43f5e', RESOLUTION:'#10b981' }

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Command Center</h1>
          <p className="text-white/40 text-sm mt-0.5">Real-time intelligence • Zero-touch logistics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="status-dot-live" />
          <span className="text-emerald-400 text-xs font-medium">All Systems Live</span>
          <button onClick={fetchAll} className="btn-ghost py-1 px-2 ml-2">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* KPI Cards — D2 Holographic */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k, i) => <HoloCard key={i} {...k} />)}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* D1: Neural Network Viz */}
        <div className="card-glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={14} className="text-brand-400" />
            <span className="text-white text-sm font-semibold">Neural Agent Network</span>
          </div>
          <NeuralGlobeCanvas />
          <div className="mt-3 flex gap-2 flex-wrap">
            {['FraudAgent','MarketAgent','InventoryAgent','CLVAgent','ResolutionAgent'].map(a => (
              <div key={a} className="flex items-center gap-1.5 text-[10px] text-white/50">
                <span className="status-dot-live w-1.5 h-1.5" style={{background:'#10b981'}} />
                {a}
              </div>
            ))}
          </div>
        </div>

        {/* Returns trend */}
        <div className="lg:col-span-2 card-glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white text-sm font-semibold">Returns & Recovery (14 Days)</span>
            <span className="badge-info text-[10px]">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={daily} margin={{top:0,right:0,left:-30,bottom:0}}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{fontSize:9,fill:'#475569'}} tickFormatter={d=>d.slice(5)} />
              <YAxis tick={{fontSize:9,fill:'#475569'}} />
              <Tooltip contentStyle={{background:'rgba(15,15,35,0.95)',border:'1px solid rgba(99,102,241,0.3)',borderRadius:10,fontSize:11}} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#g1)" strokeWidth={2} name="Returns" />
              <Area type="monotone" dataKey="nrv" stroke="#10b981" fill="url(#g2)" strokeWidth={2} name="NRV ₹" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* D6: Agent Communication Live Feed */}
        <div className="card-glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-amber-400" />
            <span className="text-white text-sm font-semibold">Agent Comms Feed</span>
            <span className="status-dot-live ml-auto" />
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <AnimatePresence>
              {commsLog.map((msg, i) => (
                <motion.div key={msg.message_id || i}
                  initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}}
                  className={`p-2.5 rounded-lg text-xs agent-msg-${msg.message_type?.toLowerCase()||'info'}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono font-bold text-[10px]" style={{color:MSG_COLORS[msg.message_type]||'#6366f1'}}>
                      {msg.from_agent}
                    </span>
                    <span className="text-white/20 text-[9px]">→</span>
                    <span className="text-white/40 text-[10px]">{msg.to_agent}</span>
                    <span className="ml-auto text-white/20 text-[9px]">{msg.timestamp?.slice(11,16)}</span>
                  </div>
                  <p className="text-white/60 leading-relaxed">{msg.content?.slice(0,100)}{msg.content?.length>100?'…':''}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            {commsLog.length === 0 && (
              <p className="text-white/20 text-xs text-center py-4">No agent activity yet. Submit a return to trigger agents.</p>
            )}
          </div>
        </div>

        {/* Actions breakdown */}
        <div className="card-glass rounded-2xl p-4">
          <span className="text-white text-sm font-semibold block mb-3">Disposition Breakdown</span>
          {stats?.actions_breakdown?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={stats.actions_breakdown} dataKey="count" nameKey="action"
                    cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>
                    {stats.actions_breakdown.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{background:'rgba(15,15,35,0.95)',border:'1px solid rgba(99,102,241,0.3)',borderRadius:10,fontSize:11}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {stats.actions_breakdown.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:COLORS[i%COLORS.length]}} />
                    <span className="text-white/50 truncate">{a.action}</span>
                    <span className="text-white/70 font-semibold ml-auto">{a.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-white/20 text-xs text-center py-8">No data yet</p>}
        </div>

        {/* Carbon offset + last decision */}
        <div className="space-y-3">
          {/* Carbon */}
          <div className="card-glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Leaf size={14} className="text-emerald-400" />
              <span className="text-white text-sm font-semibold">Carbon Offset Tracker</span>
            </div>
            <CarbonCounter kg={carbon?.total_co2_saved_kg ?? 0} />
            <p className="text-white/40 text-xs mt-0.5">kg CO₂ saved via refurbishment</p>
            <div className="mt-3 flex gap-3">
              <div className="text-center">
                <p className="text-emerald-400 font-bold">{carbon?.trees_equivalent ?? 0}</p>
                <p className="text-white/30 text-[10px]">Trees equiv.</p>
              </div>
              <div className="text-center">
                <p className="text-cyan-400 font-bold">{carbon?.sustainability_grade ?? 'B'}</p>
                <p className="text-white/30 text-[10px]">ESG Grade</p>
              </div>
              <div className="text-center">
                <p className="text-brand-400 font-bold">{carbon?.esg_score ?? 0}</p>
                <p className="text-white/30 text-[10px]">ESG Score</p>
              </div>
            </div>
          </div>

          {/* Last AI decision playback */}
          {lastReturn && (
            <ReasoningPlayback reasoning={lastReturn.ai_reasoning} engine={lastReturn.engine || 'rule-based'} />
          )}
        </div>
      </div>
    </div>
  )
}
