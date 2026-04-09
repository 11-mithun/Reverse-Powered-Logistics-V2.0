'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ArrowLeftRight, BarChart3, Zap, ShieldAlert,
  Package, Settings, LogOut, ChevronRight, Bell, Search, X,
  Globe, Warehouse, Trophy, FileText, ShoppingBag, Music,
  Tv2, Brain, ShoppingCart
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',    label: 'Command Center',   icon: LayoutDashboard, color: '#6366f1' },
  { href: '/boardroom',    label: 'Boardroom View',   icon: Tv2,             color: '#8b5cf6', badge: 'NEW' },
  { href: '/returns',      label: 'Returns',          icon: ArrowLeftRight,  color: '#06b6d4' },
  { href: '/analytics',   label: 'Analytics',        icon: BarChart3,       color: '#10b981' },
  { href: '/agents',      label: 'AI Agents',        icon: Brain,           color: '#f59e0b', badge: 'AI' },
  { href: '/kanban',      label: 'Kanban Board',     icon: Package,         color: '#a78bfa' },
  { href: '/auction',     label: 'Auctions',         icon: Trophy,          color: '#fbbf24' },
  { href: '/supplier',    label: 'Suppliers',        icon: Globe,           color: '#34d399' },
  { href: '/insurance',   label: 'Insurance',        icon: ShoppingBag,     color: '#fb7185' },
  { href: '/procurement', label: 'Procurement',      icon: ShoppingCart,    color: '#22d3ee' },
  { href: '/fraud',       label: 'Fraud Intel',      icon: ShieldAlert,     color: '#f43f5e' },
  { href: '/marketplace', label: 'Marketplace',      icon: Warehouse,       color: '#60a5fa' },
  { href: '/sla',         label: 'SLA Monitor',      icon: FileText,        color: '#a78bfa' },
  { href: '/settings',    label: 'Settings',         icon: Settings,        color: '#94a3b8' },
]

function AgentTicker() {
  const messages = [
    '🤖 MarketDynamicsAgent: Electronics prices stable — Refurbish routing maintained',
    '📦 InventoryAgent: WH-KOL critically low on SKU-TECH-042 — redistributing return',
    '🚨 FraudAgent: High-risk pattern detected in Mumbai — escalated to review',
    '✅ ResolutionAgent: 47 returns processed — ₹1.2L recovered today',
    '💡 CognitiveProcurement: Auto-PO for 15x Battery Pack units raised',
    '🌱 CarbonTracker: 128 kg CO₂ saved this week via refurbishment',
    '🏆 AuctionAgent: Item AUC-3F2A1B won at ₹8,400 (+32% above reserve)',
    '💎 CLVAgent: Platinum customer auto-approved — ₹85K LTV protected',
  ]
  return (
    <div className="h-8 bg-surface-800/80 border-b border-white/5 flex items-center overflow-hidden flex-shrink-0">
      <div className="flex-shrink-0 px-3 bg-brand-500/20 border-r border-brand-500/20 h-full flex items-center gap-2">
        <span className="text-brand-400 text-xs font-mono font-bold tracking-wider">LIVE</span>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 relative">
          <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping-soft" />
        </div>
      </div>
      <div className="overflow-hidden flex-1 ml-3">
        <div className="animate-marquee whitespace-nowrap inline-flex gap-16">
          {[...messages, ...messages].map((m, i) => (
            <span key={i} className="text-xs text-white/45 font-mono">{m}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function SoundToggle() {
  const [on, setOn] = useState(false)
  return (
    <button onClick={() => setOn(v => !v)}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all w-full ${on ? 'bg-brand-500/15 text-brand-300' : 'text-white/30 hover:text-white/60 hover:bg-white/4'}`}>
      <Music size={11} />
      <span>{on ? '♪ Ambient On' : '♪ Sound Off'}</span>
    </button>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [sideCollapsed, setSideCollapsed] = useState(false)

  useEffect(() => {
    const u = typeof window !== 'undefined' ? localStorage.getItem('rl_user') : null
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
  }, [router])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(v => !v) }
      if (e.key === 'Escape') { setSearchOpen(false); setNotifOpen(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const notifs = [
    { title: 'High Fraud Alert', body: 'Return RL-9834 flagged — Mumbai', color: '#f43f5e', time: '2m ago' },
    { title: 'SLA Breach', body: 'Order ORD-4521 overdue by 6h', color: '#f59e0b', time: '15m ago' },
    { title: 'Auction Won', body: 'AUC-3F2A recovered ₹8,400', color: '#10b981', time: '1h ago' },
  ]

  const filteredNav = searchQ.trim()
    ? NAV.filter(n => n.label.toLowerCase().includes(searchQ.toLowerCase()))
    : NAV

  const activeHref = NAV.find(n => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href + '/')))?.href

  return (
    <div className="flex flex-col h-screen bg-surface-900 overflow-hidden">
      <AgentTicker />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          animate={{ width: sideCollapsed ? 56 : 218 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="sidebar-glass flex flex-col z-20 overflow-hidden flex-shrink-0"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 py-4 border-b border-white/5 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-brand">
              <span className="text-white text-xs font-black">RL</span>
            </div>
            <AnimatePresence>
              {!sideCollapsed && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="overflow-hidden">
                  <p className="text-white font-bold text-sm leading-none">RL Platform</p>
                  <p className="text-white/30 text-[10px] mt-0.5">v2.0 Pro — Multi-Agent</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-2 overflow-y-auto space-y-0.5 scrollbar-thin">
            {NAV.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div whileHover={{ x: sideCollapsed ? 0 : 2 }}
                    className={`sidebar-item ${active ? 'active' : ''} ${sideCollapsed ? 'justify-center px-2' : ''}`}
                    title={sideCollapsed ? item.label : undefined}>
                    <item.icon size={15} style={{ color: active ? item.color : undefined, flexShrink: 0 }} />
                    <AnimatePresence>
                      {!sideCollapsed && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-[13px] truncate flex-1">{item.label}</motion.span>
                      )}
                    </AnimatePresence>
                    {item.badge && !sideCollapsed && (
                      <span className="text-[9px] bg-brand-500 text-white px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </motion.div>
                </Link>
              )
            })}
          </nav>

          {/* Bottom */}
          <div className="border-t border-white/5 px-2 py-2 space-y-0.5 flex-shrink-0">
            {!sideCollapsed && <SoundToggle />}
            <button onClick={() => setSideCollapsed(v => !v)}
              className="sidebar-item w-full justify-center">
              <ChevronRight size={13} className={`transition-transform duration-200 ${sideCollapsed ? '' : 'rotate-180'}`} />
              {!sideCollapsed && <span className="text-xs">Collapse</span>}
            </button>
            {user && !sideCollapsed && (
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {user.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs font-medium truncate">{user.name}</p>
                  <p className="text-white/30 text-[10px] capitalize">{user.role}</p>
                </div>
              </div>
            )}
            <button onClick={() => { if (typeof window !== 'undefined') { localStorage.clear(); router.push('/login'); } }}
              className={`sidebar-item text-rose-400 hover:bg-rose-500/10 w-full ${sideCollapsed ? 'justify-center px-2' : ''}`}
              title={sideCollapsed ? 'Sign Out' : undefined}>
              <LogOut size={13} />
              {!sideCollapsed && <span className="text-xs">Sign Out</span>}
            </button>
          </div>
        </motion.aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="h-12 border-b border-white/5 flex items-center px-4 gap-3 flex-shrink-0 bg-surface-900/60 backdrop-blur-xl">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-white/25 text-xs hidden md:block">RL Platform</span>
              <ChevronRight size={10} className="text-white/15 hidden md:block" />
              <span className="text-white/60 text-xs font-medium capitalize">
                {pathname.split('/').filter(Boolean).pop()?.replace('-', ' ') ?? 'Dashboard'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSearchOpen(v => !v)}
                className="btn-ghost py-1 px-2.5 flex items-center gap-1.5 text-xs">
                <Search size={12} />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden sm:inline text-white/20 text-[10px] border border-white/10 px-1 rounded ml-1">⌘K</kbd>
              </button>
              <div className="relative">
                <button onClick={() => setNotifOpen(v => !v)} className="btn-ghost py-1 px-2 relative">
                  <Bell size={13} />
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 rounded-full text-[8px] flex items-center justify-center text-white font-bold">
                    {notifs.length}
                  </span>
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      className="absolute right-0 top-10 w-72 card-glass rounded-2xl p-2 z-50 shadow-glass">
                      <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                        <span className="text-white text-xs font-semibold">Notifications</span>
                        <button onClick={() => setNotifOpen(false)}><X size={11} className="text-white/40" /></button>
                      </div>
                      {notifs.map((n, i) => (
                        <div key={i} className="px-3 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.color }} />
                            <div className="min-w-0 flex-1">
                              <p className="text-white text-xs font-medium">{n.title}</p>
                              <p className="text-white/40 text-[11px] mt-0.5">{n.body}</p>
                            </div>
                            <span className="text-white/20 text-[10px] flex-shrink-0">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* CMD+K Search */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
                onClick={() => setSearchOpen(false)}>
                <motion.div initial={{ y: -20, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: -20, scale: 0.95 }}
                  className="w-full max-w-lg card-glass rounded-2xl overflow-hidden shadow-glass"
                  onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
                    <Search size={15} className="text-white/40" />
                    <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)}
                      placeholder="Search pages…" className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30" />
                    <kbd className="text-white/20 text-xs border border-white/10 px-1.5 py-0.5 rounded">ESC</kbd>
                  </div>
                  <div className="p-2 max-h-72 overflow-y-auto">
                    {filteredNav.map(n => (
                      <Link key={n.href} href={n.href} onClick={() => setSearchOpen(false)}>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/6 transition-colors cursor-pointer">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${n.color}22` }}>
                            <n.icon size={14} style={{ color: n.color }} />
                          </div>
                          <span className="text-white/80 text-sm">{n.label}</span>
                          {n.badge && <span className="ml-auto badge-info text-[10px]">{n.badge}</span>}
                        </div>
                      </Link>
                    ))}
                    {filteredNav.length === 0 && (
                      <p className="text-white/30 text-sm text-center py-6">No pages found for "{searchQ}"</p>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Page */}
          <main className="flex-1 overflow-y-auto bg-surface-900 bg-grid-pattern">
            <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}>
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  )
}
