'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight, Brain, Zap, Shield, Globe, TrendingUp,
  Package, Leaf, CheckCircle, ChevronDown
} from 'lucide-react'

// ── Neural Network Canvas Hero (D1) ─────────────────────────────────────
function NeuralHero() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let raf: number
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)

    // Nodes
    const nodes = Array.from({length:55}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 3 + 1.5,
      color: ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#f43f5e'][Math.floor(Math.random()*6)],
      pulse: Math.random() * Math.PI * 2,
    }))

    // Data packets travelling along edges
    const packets: {from:number;to:number;t:number;speed:number}[] = []
    setInterval(() => {
      const from = Math.floor(Math.random() * nodes.length)
      const to = Math.floor(Math.random() * nodes.length)
      if (from !== to) packets.push({from, to, t: 0, speed: Math.random()*0.02+0.005})
      if (packets.length > 20) packets.shift()
    }, 300)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i+1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(99,102,241,${(1-dist/120)*0.2})`
            ctx.lineWidth = 0.5
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      // Packets
      packets.forEach(p => {
        p.t = Math.min(p.t + p.speed, 1)
        const from = nodes[p.from], to = nodes[p.to]
        const px = from.x + (to.x - from.x) * p.t
        const py = from.y + (to.y - from.y) * p.t
        ctx.beginPath()
        ctx.arc(px, py, 2, 0, Math.PI * 2)
        ctx.fillStyle = '#06b6d4'
        ctx.fill()
      })

      // Nodes
      nodes.forEach(n => {
        n.pulse += 0.04
        const r = n.r + Math.sin(n.pulse) * 0.5
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = n.color + 'cc'
        ctx.fill()
        // Glow
        ctx.beginPath()
        ctx.arc(n.x, n.y, r * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = n.color + '18'
        ctx.fill()
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1
      })

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} className="absolute inset-0 w-full h-full opacity-45" />
}

// ── Floating Chat (D7 ambient style) ────────────────────────────────────
function FloatingChat() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([{from:'ai',text:'Hi! I can analyze any return. What product was returned?'}])
  const [input, setInput] = useState('')
  const replies = [
    'Based on that description: **Minor Damage** — 78% salvage value. Routing: Discount Zone.',
    'Fraud risk: **Low**. Customer LTV Rs.45K — standard policy applies.',
    'Recommendation: **Refurbish** — estimated net recovery Rs.2,340.',
    'Market check: Electronics prices stable. Repair routing maintained.',
  ]
  const send = () => {
    if (!input.trim()) return
    const txt = input; setInput('')
    setMsgs(m => [...m, {from:'user',text:txt}])
    setTimeout(() => {
      setMsgs(m => [...m, {from:'ai',text:replies[Math.floor(Math.random()*replies.length)]}])
    }, 900)
  }
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0,y:20,scale:0.9}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:20,scale:0.9}}
            className="mb-4 w-80 card-glass rounded-2xl overflow-hidden shadow-glass">
            <div className="bg-gradient-to-r from-brand-600 to-violet-600 p-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">AI</div>
              <span className="text-white font-semibold text-sm">RL AI Assistant</span>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
                <span className="text-white/70 text-xs">Live</span>
              </div>
            </div>
            <div className="h-60 overflow-y-auto p-3 space-y-2">
              {msgs.map((m,i) => (
                <div key={i} className={`flex ${m.from==='user'?'justify-end':'justify-start'}`}>
                  <div className={`max-w-64 rounded-xl px-3 py-2 text-xs ${m.from==='user'?'bg-brand-500 text-white':'bg-white/8 text-white/90'}`}
                    dangerouslySetInnerHTML={{__html:m.text.replace(/\*\*(.*?)\*\*/g,'<strong class="text-brand-300">$1</strong>')}}/>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-white/8 flex gap-2">
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}
                placeholder="Describe a return..." className="flex-1 bg-white/8 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:bg-white/12 transition-colors"/>
              <button onClick={send} className="bg-brand-500 hover:bg-brand-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors">Send</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button onClick={()=>setOpen(v=>!v)} whileHover={{scale:1.1}} whileTap={{scale:0.95}}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 shadow-brand flex items-center justify-center relative animate-glow-pulse">
        <Brain size={22} className="text-white"/>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-surface-900"/>
      </motion.button>
    </div>
  )
}

const FEATURES = [
  {icon:Brain,color:'#6366f1',title:'Multi-Agent AI',desc:'5 specialized agents coordinate: Market Dynamics, Inventory Balancing, Fraud Detection, CLV Escalation, and Resolution.'},
  {icon:TrendingUp,color:'#10b981',title:'Real-time Asset Valuation',desc:'Live market price monitoring across eBay, Amazon, Flipkart. Auto-switch routing when prices drop 20%+.'},
  {icon:Package,color:'#06b6d4',title:'Zero-Touch Logistics',desc:'Returns processed, graded, and re-routed without human intervention. Autonomous Inventory Redistribution.'},
  {icon:Shield,color:'#f43f5e',title:'GAN Fraud Detection',desc:'Synthetic training data from 5 fraud archetypes solves the cold-start problem. YOLO-ready image scoring.'},
  {icon:Globe,color:'#f59e0b',title:'Multi-language Portal',desc:'Customer-facing portal in 5 languages: English, Hindi, Tamil, Bengali, Telugu.'},
  {icon:Leaf,color:'#34d399',title:'ESG Carbon Tracker',desc:'Live CO2 savings counter. Trees equivalent. ESG grade auto-calculated from refurbishment decisions.'},
]

const STATS = [
  {value:'73%',label:'Avg cost reduction'},
  {value:'5',label:'AI agents running'},
  {value:'<2s',label:'Decision latency'},
  {value:'₹28L+',label:'Recovery tracked'},
]

export default function HomePage() {
  const {scrollY} = useScroll()
  const y1 = useTransform(scrollY, [0, 400], [0, -60])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  return (
    <div className="min-h-screen bg-surface-900 text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-surface-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-15 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-brand">RL</div>
            <span className="font-bold text-white text-lg">RL Platform</span>
            <span className="badge-info text-[10px] ml-1">v2.0 Pro</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            {['Features','Analytics','Agents','Pricing'].map(l=>(
              <a key={l} href={`#${l.toLowerCase()}`} className="hover:text-brand-400 transition-colors">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:block text-white/60 hover:text-white text-sm transition-colors">Sign in</Link>
            <Link href="/register">
              <button className="btn-brand text-sm py-2 px-4 flex items-center gap-1.5">
                Get Started <ArrowRight size={14}/>
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Neural canvas */}
        <NeuralHero/>

        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/8 rounded-full blur-3xl"/>
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-violet-500/6 rounded-full blur-3xl"/>
        </div>

        <motion.div style={{y:y1,opacity}} className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping-soft"/>
            Multi-Agent AI System — Live
          </motion.div>

          <motion.h1 initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
            className="text-5xl md:text-7xl font-black leading-tight mb-6">
            <span className="text-gradient-white">Intelligent</span>{' '}
            <span className="text-gradient-brand">Reverse</span>{' '}
            <br className="hidden md:block"/>
            <span className="text-gradient-cyan">Logistics</span>{' '}
            <span className="text-gradient-white">Platform</span>
          </motion.h1>

          <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
            className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Five specialized AI agents coordinate in real-time to classify, route, and recover value from returns —
            with zero-touch automation and live market pricing.
          </motion.p>

          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.97}}
                className="btn-brand text-base py-3.5 px-8 flex items-center gap-2">
                Start Free — No Credit Card <ArrowRight size={16}/>
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                className="btn-outline text-base py-3.5 px-8">
                View Live Demo
              </motion.button>
            </Link>
          </motion.div>

          {/* Scroll hint */}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.2}}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20">
            <span className="text-xs">Scroll to explore</span>
            <ChevronDown size={16} className="animate-bounce"/>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 bg-surface-800/50 py-8">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s,i) => (
            <motion.div key={i} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}}
              viewport={{once:true}} transition={{delay:i*0.08}} className="text-center">
              <p className="text-3xl md:text-4xl font-black text-gradient-brand">{s.value}</p>
              <p className="text-white/40 text-sm mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2 initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            className="text-4xl font-black text-white mb-3">
            Every feature you <span className="text-gradient-brand">need</span>
          </motion.h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            From AI-powered damage assessment to autonomous inventory redistribution — all in one platform.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {FEATURES.map((f,i) => (
            <motion.div key={i} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}}
              viewport={{once:true}} transition={{delay:i*0.07}}
              whileHover={{scale:1.02,y:-3}} className="card-premium p-6">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                style={{background:`${f.color}20`,border:`1px solid ${f.color}30`}}>
                <f.icon size={20} style={{color:f.color}}/>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <motion.div initial={{opacity:0,scale:0.97}} whileInView={{opacity:1,scale:1}} viewport={{once:true}}
          className="max-w-3xl mx-auto text-center card-premium rounded-3xl p-12">
          <div className="absolute inset-0 opacity-30 rounded-3xl"
            style={{background:'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.3), transparent 70%)'}}/>
          <div className="relative z-10">
            <h2 className="text-4xl font-black text-white mb-4">
              Ready to cut return losses by <span className="text-gradient-emerald">73%</span>?
            </h2>
            <p className="text-white/50 mb-8 text-lg">
              Join 200+ e-commerce teams using RL Platform to recover value from every return.
            </p>
            <Link href="/register">
              <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.97}}
                className="btn-brand text-base py-3.5 px-10 flex items-center gap-2 mx-auto">
                Start Free Today <ArrowRight size={16}/>
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-white/25 text-sm">
        <p>RL Platform v2.0 — Multi-Agent Reverse Logistics Intelligence</p>
        <div className="flex items-center justify-center gap-6 mt-3">
          <Link href="/login" className="hover:text-white/50 transition-colors">Sign In</Link>
          <Link href="/portal" className="hover:text-white/50 transition-colors">Customer Portal</Link>
        </div>
      </footer>

      <FloatingChat/>
    </div>
  )
}
