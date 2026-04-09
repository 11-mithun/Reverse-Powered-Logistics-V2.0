'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { returnsApi, agentsApi } from '@/lib/api'
import { Maximize2, Minimize2, TrendingUp, ShieldAlert, Leaf, Zap, Activity, RotateCcw } from 'lucide-react'

const LIVE_FEED = [
  '✅ RET-A4F2: Platinum customer auto-approved. Refund ₹62,999',
  '⚡ MarketAgent: Electronics price drop 23%. Routing: Repair → Liquidation',
  '🔴 ORD-8823: Fraud HIGH — 4 returns/30d. Escalated to review.',
  '📦 InventoryAgent: SKU-3310 → Kolkata WH. Critical replenishment.',
  '🌱 Carbon: 4,821 kg CO₂ saved this month. ESG Grade: A',
  '🏆 Auction AUC-3F2B won at ₹18,400 (+28% above reserve)',
  '💎 VIP Auto-Approve: LTV ₹1.2L — return approved instantly',
  '📊 MarketAgent: Clothing demand rising +15% — salvage re-routed',
]

const SECTIONS = [
  { key: 'returns', label: 'TOTAL RETURNS', value: '847', unit: 'this month', color: '#6366f1', trend: '+12%', icon: Activity },
  { key: 'recovery', label: 'NET RECOVERY', value: '₹28.47L', unit: 'recovered', color: '#10b981', trend: '+8.3%', icon: TrendingUp },
  { key: 'fraud', label: 'FRAUD BLOCKED', value: '43', unit: 'high-risk cases', color: '#f43f5e', trend: '−5.2%', icon: ShieldAlert },
  { key: 'co2', label: 'CO₂ SAVED', value: '4,821 kg', unit: '≈ 229 trees', color: '#34d399', trend: '+14.1%', icon: Leaf },
  { key: 'sla', label: 'SLA COMPLIANCE', value: '94.7%', unit: 'on-time', color: '#f59e0b', trend: '+2.1%', icon: Zap },
  { key: 'agents', label: 'AGENTS ACTIVE', value: '5', unit: 'running 24/7', color: '#8b5cf6', trend: 'Live', icon: Activity },
]

function PulsingOrb({ color }: { color: string }) {
  return (
    <div className="relative w-3 h-3">
      <div className="absolute inset-0 rounded-full" style={{ background: color, opacity: 0.8 }} />
      <div className="absolute inset-0 rounded-full animate-ping-soft" style={{ background: color, opacity: 0.4 }} />
    </div>
  )
}

export default function BoardroomPage() {
  const [fullscreen, setFullscreen] = useState(false)
  const [sectionIdx, setSectionIdx] = useState(0)
  const [stats, setStats] = useState<any>(null)
  const [commsLog, setCommsLog] = useState<any[]>([])
  const [carbon, setCarbon] = useState<any>(null)
  const [feedIdx, setFeedIdx] = useState(0)

  useEffect(() => {
    returnsApi.stats().then(r => setStats(r.data)).catch(() => {})
    agentsApi.communicationLog(6).then(r => setCommsLog(r.value?.data || r.data || [])).catch(() => {})
    agentsApi.carbonOffset().then(r => setCarbon(r.data)).catch(() => {})
  }, [])

  // Auto-rotate sections every 4s
  useEffect(() => {
    const iv = setInterval(() => setSectionIdx(i => (i + 1) % SECTIONS.length), 4000)
    return () => clearInterval(iv)
  }, [])

  // Auto-advance feed
  useEffect(() => {
    const iv = setInterval(() => setFeedIdx(i => (i + 1) % LIVE_FEED.length), 2800)
    return () => clearInterval(iv)
  }, [])

  const current = SECTIONS[sectionIdx]
  const MSG_COLORS: Record<string, string> = { INFO: '#6366f1', ACTION: '#06b6d4', ALERT: '#f59e0b', ESCALATION: '#f43f5e', RESOLUTION: '#10b981' }

  const liveStats = stats ? [
    { ...SECTIONS[0], value: stats.total_returns?.toLocaleString() || '847' },
    { ...SECTIONS[1], value: `₹${((stats.total_recovery_value || 2847000) / 100000).toFixed(2)}L` },
    { ...SECTIONS[2], value: String(stats.high_fraud_flags || 43) },
    { ...SECTIONS[3], value: carbon ? `${carbon.total_co2_saved_kg?.toFixed(0)} kg` : '4,821 kg' },
    SECTIONS[4],
    SECTIONS[5],
  ] : SECTIONS

  const wrapper = fullscreen
    ? 'fixed inset-0 z-50 bg-surface-900'
    : 'p-5'

  return (
    <div className={wrapper}>
      <div className={`${fullscreen ? 'h-full p-8' : ''} space-y-5`}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`font-black text-white ${fullscreen ? 'text-4xl' : 'text-2xl'}`}>
              Boardroom <span className="text-gradient-brand">Command View</span>
            </h1>
            <p className="text-white/40 text-sm mt-0.5">Executive real-time intelligence dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <PulsingOrb color="#10b981" />
              <span className="text-emerald-400 text-sm font-medium">All Systems Live</span>
            </div>
            <button onClick={() => setFullscreen(f => !f)}
              className="btn-ghost py-2 px-3 flex items-center gap-2 text-sm">
              {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              {fullscreen ? 'Exit' : 'Fullscreen'}
            </button>
          </div>
        </div>

        {/* Hero rotating metric — D9 Boardroom mode */}
        <AnimatePresence mode="wait">
          <motion.div key={sectionIdx}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="rounded-3xl p-8 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${current.color}18 0%, ${current.color}08 100%)`, border: `1px solid ${current.color}30` }}>
            <div className="absolute inset-0 opacity-20"
              style={{ background: `radial-gradient(circle at 20% 50%, ${current.color}40, transparent 60%)` }} />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-white/40 text-sm font-mono tracking-widest uppercase mb-2">{current.label}</p>
                <p className={`font-black leading-none ${fullscreen ? 'text-8xl' : 'text-6xl'}`}
                  style={{ color: current.color }}>
                  {liveStats[sectionIdx]?.value || current.value}
                </p>
                <p className="text-white/50 text-lg mt-2">{current.unit}</p>
              </div>
              <div className="text-right">
                <p className="text-white/30 text-sm mb-2">Trend</p>
                <p className={`font-black text-4xl ${current.trend.startsWith('+') ? 'text-emerald-400' : current.trend.startsWith('−') ? 'text-rose-400' : 'text-brand-400'}`}>
                  {current.trend}
                </p>
              </div>
            </div>
            {/* Progress dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {SECTIONS.map((_, i) => (
                <button key={i} onClick={() => setSectionIdx(i)}
                  className="transition-all duration-300 rounded-full"
                  style={{ width: i === sectionIdx ? 24 : 8, height: 8, background: i === sectionIdx ? current.color : `${current.color}40` }} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Mini KPI grid */}
          <div className="grid grid-cols-2 gap-3 content-start">
            {liveStats.map((s, i) => (
              <motion.div key={i} whileHover={{ scale: 1.03 }}
                onClick={() => setSectionIdx(i)}
                className={`rounded-xl p-3 cursor-pointer transition-all ${i === sectionIdx ? 'border' : 'card-stat'}`}
                style={i === sectionIdx ? { background: `${s.color}18`, borderColor: `${s.color}40` } : {}}>
                <div className="flex items-center gap-1.5 mb-1">
                  <PulsingOrb color={s.color} />
                  <span className="text-white/40 text-[10px] font-mono truncate">{s.label}</span>
                </div>
                <p className="font-black text-lg" style={{ color: s.color }}>{s.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Live feed ticker */}
          <div className="card-glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={13} className="text-amber-400" />
              <span className="text-white font-semibold text-sm">Live Intelligence Feed</span>
              <PulsingOrb color="#10b981" />
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={feedIdx}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="rounded-xl p-3 bg-white/4 mb-3">
                <p className="text-white/80 text-sm leading-relaxed">{LIVE_FEED[feedIdx]}</p>
              </motion.div>
            </AnimatePresence>
            <div className="space-y-1.5 max-h-36 overflow-hidden">
              {LIVE_FEED.filter((_, i) => i !== feedIdx).slice(0, 4).map((msg, i) => (
                <p key={i} className="text-white/25 text-xs truncate pl-1">{msg}</p>
              ))}
            </div>
          </div>

          {/* Agent comms */}
          <div className="card-glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={13} className="text-brand-400" />
              <span className="text-white font-semibold text-sm">Agent Communications</span>
            </div>
            <div className="space-y-2">
              {commsLog.slice(0, 5).map((msg: any, i: number) => (
                <div key={i} className={`p-2 rounded-lg text-xs agent-msg-${msg.message_type?.toLowerCase() || 'info'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-mono font-bold text-[10px]" style={{ color: MSG_COLORS[msg.message_type] || '#6366f1' }}>
                      {msg.from_agent?.replace('Agent', '')}
                    </span>
                    <span className="text-white/20">→</span>
                    <span className="text-white/30 text-[10px] truncate">{msg.to_agent?.replace('Agent', '')}</span>
                  </div>
                  <p className="text-white/55 leading-relaxed line-clamp-1">{msg.content}</p>
                </div>
              ))}
              {commsLog.length === 0 && (
                <p className="text-white/20 text-xs text-center py-4">Run agents to see communications</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
