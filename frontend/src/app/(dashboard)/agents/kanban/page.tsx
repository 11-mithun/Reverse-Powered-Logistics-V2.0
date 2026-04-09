'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { RotateCcw, ShieldAlert, Zap, CheckCircle, AlertTriangle, Package, Filter } from 'lucide-react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

type KanbanStatus = 'pending' | 'processing' | 'completed' | 'escalated'

const COLS: { id: KanbanStatus; label: string; color: string; icon: any }[] = [
  { id: 'pending',    label: 'Pending Review', color: '#f59e0b', icon: AlertTriangle },
  { id: 'processing', label: 'Processing',     color: '#6366f1', icon: RotateCcw },
  { id: 'completed',  label: 'Completed',      color: '#10b981', icon: CheckCircle },
  { id: 'escalated',  label: 'Escalated',      color: '#f43f5e', icon: ShieldAlert },
]

const DAMAGE_COLORS: Record<string, string> = {
  'No Damage': '#10b981', 'Minor Damage': '#06b6d4',
  'Moderate Damage': '#f59e0b', 'Severe Damage': '#f43f5e',
}

function KanbanCard({ item, onMove }: { item: any; onMove: (id: string, s: KanbanStatus) => void }) {
  const [dragging, setDragging] = useState(false)
  const dmgColor = DAMAGE_COLORS[item.damage_level] || '#94a3b8'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`kanban-card ${dragging ? 'dragging' : ''}`}
      draggable
      onDragStart={() => setDragging(true)}
      onDragEnd={() => setDragging(false)}
    >
      {/* Top */}
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs font-mono text-white/40">{item.order_id || 'ORD-???'}</div>
        <div className="badge" style={{ background: `${dmgColor}18`, color: dmgColor, border: `1px solid ${dmgColor}30`, fontSize: 9 }}>
          {item.damage_level || 'Unknown'}
        </div>
      </div>
      {/* Product */}
      <div className="text-sm font-semibold text-white mb-1 truncate">{item.product_name || 'Product'}</div>
      <div className="text-xs text-white/40 mb-3">{item.category} · ₹{(item.product_price || 0).toLocaleString()}</div>
      {/* NRV */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-white/40">NRV</div>
        <div className={`text-sm font-bold ${(item.net_recovery_value || 0) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          ₹{(item.net_recovery_value || 0).toLocaleString()}
        </div>
      </div>
      {/* Action */}
      <div className="text-xs bg-brand-500/10 border border-brand-500/20 rounded-lg px-2 py-1.5 text-brand-300 mb-3 truncate">
        {item.recommended_action || 'Pending'}
      </div>
      {/* Move buttons */}
      <div className="flex gap-1 flex-wrap">
        {COLS.filter(c => c.id !== item.status).map(c => (
          <button key={c.id} onClick={() => onMove(item.id, c.id)}
            className="text-[10px] px-2 py-1 rounded-md border border-white/10 hover:border-white/30 text-white/40 hover:text-white transition-colors">
            → {c.label.split(' ')[0]}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

function KanbanCol({ col, items, onDrop, onMove }: any) {
  const [over, setOver] = useState(false)

  return (
    <div
      className={`kanban-col flex flex-col transition-all ${over ? 'border-brand-500/40 bg-brand-500/5' : ''}`}
      style={{ minWidth: 260 }}
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); onDrop(col.id) }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-white/[0.06]">
        <col.icon size={14} style={{ color: col.color }} />
        <span className="text-sm font-semibold text-white">{col.label}</span>
        <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{ background: `${col.color}20`, color: col.color }}>
          {items.length}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        <AnimatePresence>
          {items.map((item: any) => (
            <KanbanCard key={item.id} item={item} onMove={onMove} />
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <div className="text-center py-10 text-white/20 text-sm">
            <div className="text-2xl mb-2">📭</div>
            Drop items here
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanbanPage() {
  const [items, setItems] = useState<any[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const h = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    axios.get(`${API}/api/returns?per_page=60`, h)
      .then(r => setItems(r.data.items || []))
      .catch(() => {
        // Demo data
        setItems(Array.from({ length: 20 }, (_, i) => ({
          id: `demo-${i}`,
          order_id: `ORD-${Math.random().toString(36).substr(2,6).toUpperCase()}`,
          product_name: ['Samsung Galaxy S23', 'Noise Cancelling Headphones', 'iPhone 14 Pro', 'Dyson V11', 'MacBook Air M2'][i % 5],
          category: ['Electronics', 'Electronics', 'Electronics', 'Home & Kitchen', 'Electronics'][i % 5],
          product_price: [62999, 12999, 89999, 35000, 115000][i % 5],
          damage_level: ['No Damage','Minor Damage','Moderate Damage','Severe Damage'][i % 4],
          recommended_action: ['Restock','Repack and Discount','Refurbish','Liquidate'][i % 4],
          net_recovery_value: Math.floor(Math.random() * 30000 - 5000),
          status: ['pending','processing','completed','escalated'][i % 4] as KanbanStatus,
          fraud_risk: ['Low','Low','Medium','High'][i % 4],
        })))
      })
  }, [])

  const moveItem = (id: string, newStatus: KanbanStatus) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item))
    const token = localStorage.getItem('token')
    if (token) {
      axios.patch(`${API}/api/returns/${id}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    }
  }

  const handleDrop = (colId: KanbanStatus) => {
    if (draggingId) {
      moveItem(draggingId, colId)
      setDraggingId(null)
    }
  }

  const filteredItems = filter === 'all' ? items : items.filter(i => i.fraud_risk === filter || i.damage_level?.includes(filter))

  return (
    <div style={{ padding: 24 }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">Kanban Return Board</h1>
          <p className="text-sm text-white/40">Drag-and-drop returns across processing stages</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-white/40" />
          <select value={filter} onChange={e => setFilter(e.target.value)} className="input-premium text-sm w-40">
            <option value="all">All Returns</option>
            <option value="High">High Fraud</option>
            <option value="Severe">Severe Damage</option>
          </select>
          <div className="badge badge-info">{filteredItems.length} items</div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {COLS.map(c => {
          const count = filteredItems.filter(i => i.status === c.id).length
          return (
            <div key={c.id} className="card-glass p-3 flex items-center gap-3">
              <c.icon size={16} style={{ color: c.color }} />
              <div>
                <div className="text-lg font-bold text-white">{count}</div>
                <div className="text-[10px] text-white/40">{c.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" onDragStart={e => {
        const id = (e.target as HTMLElement).closest('[data-id]')?.getAttribute('data-id')
        if (id) setDraggingId(id)
      }}>
        {COLS.map(col => (
          <KanbanCol
            key={col.id}
            col={col}
            items={filteredItems.filter(i => i.status === col.id)}
            onDrop={handleDrop}
            onMove={moveItem}
          />
        ))}
      </div>
    </div>
  )
}
