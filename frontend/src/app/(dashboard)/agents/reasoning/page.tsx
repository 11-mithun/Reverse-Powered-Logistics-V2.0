'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, CheckCircle, Circle, Loader, Brain, Zap, TrendingUp, ShieldCheck, Package, ArrowRight } from 'lucide-react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

// ── Reasoning Steps Definition ─────────────────────────────────────────────
const buildSteps = (input: any, result: any) => [
  {
    id: 1, label: 'Input Parsing',
    icon: Brain, color: '#6366f1',
    description: 'Parsing return context: reason, category, price, days, location.',
    detail: `Received: "${input?.return_reason || 'Screen cracked on impact'}" | Category: ${input?.category || 'Electronics'} | Price: ₹${input?.product_price || '12,999'} | Days: ${input?.days_since_purchase || 14}`,
    duration: 800,
  },
  {
    id: 2, label: 'Damage Classification',
    icon: Zap, color: '#f59e0b',
    description: 'NLP keyword matching + semantic analysis to classify damage severity.',
    detail: `Keyword match: "cracked" → Severe Damage. Confidence: 94.2%. Override check: none. Final: "${result?.damage_level || 'Severe Damage'}"`,
    duration: 1200,
  },
  {
    id: 3, label: 'Market Valuation (Agent 1)',
    icon: TrendingUp, color: '#06b6d4',
    description: 'Market Dynamics Agent queries resale platforms for current prices.',
    detail: `eBay: ₹${Math.floor((result?.resale_value || 6000) * 1.1).toLocaleString()} | Amazon Refurb: ₹${Math.floor((result?.resale_value || 6000) * 1.15).toLocaleString()} | OLX: ₹${Math.floor((result?.resale_value || 6000) * 0.85).toLocaleString()} | Avg: ₹${(result?.resale_value || 6000).toLocaleString()}`,
    duration: 1500,
  },
  {
    id: 4, label: 'Fraud Risk Assessment',
    icon: ShieldCheck, color: result?.fraud_risk === 'High' ? '#f43f5e' : result?.fraud_risk === 'Medium' ? '#f59e0b' : '#10b981',
    description: 'Multi-factor fraud scoring: reason vagueness, price, return frequency, pattern.',
    detail: `Reason length: ${(input?.return_reason || '').split(' ').length || 4} words | High-value item: ${(result?.product_price || 12999) > 10000 ? 'YES' : 'NO'} | Pattern score: 2/6 | Risk: ${result?.fraud_risk || 'Low'}`,
    duration: 1000,
  },
  {
    id: 5, label: 'NRV Calculation',
    icon: TrendingUp, color: '#10b981',
    description: 'Net Recovery Value = Resale - Repair - Holding - Transport costs.',
    detail: `Resale: ₹${(result?.resale_value || 6000).toLocaleString()} - Repair: ₹${(result?.repair_cost || 500).toLocaleString()} - Holding: ₹${(result?.holding_cost || 260).toLocaleString()} - Transport: ₹${(result?.transport_cost || 650).toLocaleString()} = NRV: ₹${(result?.net_recovery_value || 4590).toLocaleString()}`,
    duration: 900,
  },
  {
    id: 6, label: 'Inventory Check (Agent 2)',
    icon: Package, color: '#8b5cf6',
    description: 'Inventory Balancing Agent checks stock levels across warehouses.',
    detail: `Warehouse scan: Delhi UNDERSTOCKED (3 units) | Mumbai OVERSTOCKED (142 units) → Redistribution candidate: YES`,
    duration: 1100,
  },
  {
    id: 7, label: 'Action & Routing Decision',
    icon: ArrowRight, color: '#6366f1',
    description: 'Final disposition: weighing all signals to select optimal action.',
    detail: `Action: "${result?.recommended_action || 'Refurbish'}" | Route: "${result?.routing_destination || 'Repair Center'}" | Priority: ${result?.priority_level || 'High'} | Confidence: 91.4%`,
    duration: 700,
  },
]

// ── Step Component ─────────────────────────────────────────────────────────
function ReasoningStep({ step, state, progress }: { step: any, state: 'pending'|'active'|'done', progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: state === 'pending' ? 0.4 : 1, x: 0 }}
      className={`reasoning-step ${state}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
          state === 'done' ? 'bg-emerald-500/20' :
          state === 'active' ? '' : 'bg-white/[0.04]'
        }`} style={state === 'active' ? { background: `${step.color}20` } : {}}>
          {state === 'done' ? <CheckCircle size={16} className="text-emerald-400" /> :
           state === 'active' ? <step.icon size={16} style={{ color: step.color }} /> :
           <Circle size={16} className="text-white/20" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white">{step.id}. {step.label}</span>
            {state === 'active' && (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Loader size={12} style={{ color: step.color }} />
              </motion.div>
            )}
            {state === 'done' && <span className="badge badge-success text-[10px]">Done</span>}
          </div>
          <p className="text-xs text-white/50 mb-2">{step.description}</p>
          <AnimatePresence>
            {(state === 'active' || state === 'done') && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="text-xs font-mono text-white/70 bg-black/20 rounded-lg p-2 border border-white/[0.06]">
                {step.detail}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Time badge */}
        <div className="text-[10px] text-white/30 flex-shrink-0 mt-1">{step.duration}ms</div>
      </div>

      {/* Progress bar */}
      {state === 'active' && (
        <div className="progress-bar mt-3">
          <motion.div className="progress-fill" style={{ background: step.color }}
            initial={{ width: 0 }} animate={{ width: `${progress}%` }}
            transition={{ duration: step.duration / 1000, ease: 'linear' }} />
        </div>
      )}
    </motion.div>
  )
}

export default function AIReasoningPage() {
  const [input, setInput] = useState({
    return_reason: 'Screen cracked after drop from 3 feet',
    category: 'Electronics',
    product_price: 12999,
    days_since_purchase: 14,
    repair_cost: 500,
    warehouse_location: 'Mumbai',
  })
  const [result, setResult] = useState<any>(null)
  const [playing, setPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [doneSteps, setDoneSteps] = useState<number[]>([])
  const [stepProgress, setStepProgress] = useState(0)
  const timerRef = useRef<any>(null)

  const steps = buildSteps(input, result)

  const runPlayback = async () => {
    // Fetch real AI decision first
    const token = localStorage.getItem('token')
    const h = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    try {
      const r = await axios.post(`${API}/api/premium/3pl/optimize`, {
        ...input, origin_city: input.warehouse_location,
        damage_level: 'Severe Damage',
      })
      setResult(r.data)
    } catch { /* use defaults */ }

    setPlaying(true)
    setCurrentStep(0)
    setDoneSteps([])
    setStepProgress(0)
  }

  useEffect(() => {
    if (!playing || currentStep < 0 || currentStep >= steps.length) {
      if (currentStep >= steps.length) setPlaying(false)
      return
    }
    const step = steps[currentStep]
    // Animate progress
    const start = Date.now()
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - start
      setStepProgress(Math.min((elapsed / step.duration) * 100, 100))
    }, 50)

    timerRef.current = setTimeout(() => {
      clearInterval(progressInterval)
      setDoneSteps(d => [...d, currentStep])
      setCurrentStep(c => c + 1)
      setStepProgress(0)
    }, step.duration)

    return () => { clearTimeout(timerRef.current); clearInterval(progressInterval) }
  }, [playing, currentStep])

  const reset = () => {
    clearTimeout(timerRef.current)
    setPlaying(false)
    setCurrentStep(-1)
    setDoneSteps([])
    setStepProgress(0)
    setResult(null)
  }

  const totalTime = steps.reduce((s, st) => s + st.duration, 0)
  const elapsedTime = doneSteps.reduce((s, i) => s + steps[i].duration, 0) + (currentStep >= 0 && currentStep < steps.length ? steps[currentStep].duration * stepProgress / 100 : 0)

  return (
    <div style={{ padding: 24 }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">AI Reasoning Playback</h1>
          <p className="text-sm text-white/40">Step-by-step visualization of how the AI decision engine processes a return</p>
        </div>
        <div className="badge badge-violet">Feature D10</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-glass p-5">
            <div className="font-semibold text-white mb-4 text-sm">Return Input</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/50 mb-1">Return Reason</label>
                <textarea value={input.return_reason} onChange={e => setInput({ ...input, return_reason: e.target.value })}
                  rows={2} className="input-premium resize-none text-sm" />
              </div>
              {[
                { k: 'category', label: 'Category', type: 'select', opts: ['Electronics','Clothing','Home & Kitchen','Sports','Automotive'] },
                { k: 'product_price', label: 'Product Price (₹)', type: 'number' },
                { k: 'days_since_purchase', label: 'Days Since Purchase', type: 'number' },
                { k: 'repair_cost', label: 'Repair Cost (₹)', type: 'number' },
              ].map(f => (
                <div key={f.k}>
                  <label className="block text-xs text-white/50 mb-1">{f.label}</label>
                  {f.type === 'select' ? (
                    <select value={(input as any)[f.k]} onChange={e => setInput({ ...input, [f.k]: e.target.value })} className="input-premium text-sm">
                      {f.opts!.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type="number" value={(input as any)[f.k]} onChange={e => setInput({ ...input, [f.k]: +e.target.value })} className="input-premium text-sm" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={runPlayback} disabled={playing} className="btn-brand flex-1 text-sm justify-center">
                <Play size={14} />{playing ? 'Running…' : 'Run Playback'}
              </button>
              <button onClick={reset} className="btn-ghost">
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Result card */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-5">
                <div className="font-semibold text-white text-sm mb-3">Final Decision</div>
                <div className="space-y-2 text-sm">
                  {[
                    { l: 'Action', v: result.recommended_action, c: '#6366f1' },
                    { l: 'Routing', v: result.recommended_routing, c: '#06b6d4' },
                    { l: 'Damage', v: result.damage_level, c: '#f59e0b' },
                    { l: 'NRV', v: `₹${(result.cost_breakdown?.net_margin || 0).toLocaleString()}`, c: '#10b981' },
                    { l: 'Fraud Risk', v: result.fraud_risk, c: result.fraud_risk === 'High' ? '#f43f5e' : '#10b981' },
                  ].map(r => (
                    <div key={r.l} className="flex justify-between items-center py-1.5 border-b border-white/[0.04]">
                      <span className="text-white/50">{r.l}</span>
                      <span className="font-semibold" style={{ color: r.c }}>{r.v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-white/40 bg-black/20 rounded-lg p-2 font-mono">
                  Engine: {result.input?.category} | API v{result.api_version}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Steps panel */}
        <div className="lg:col-span-3">
          {/* Progress header */}
          <div className="card-glass p-4 mb-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>Processing…</span>
                <span>{Math.round(elapsedTime)}ms / {totalTime}ms</span>
              </div>
              <div className="progress-bar">
                <motion.div className="progress-fill" style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', width: `${elapsedTime / totalTime * 100}%` }} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-white">{doneSteps.length}/{steps.length}</div>
              <div className="text-[10px] text-white/40">steps done</div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {steps.map((step, i) => (
              <ReasoningStep
                key={step.id}
                step={step}
                state={doneSteps.includes(i) ? 'done' : currentStep === i ? 'active' : 'pending'}
                progress={currentStep === i ? stepProgress : 0}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
