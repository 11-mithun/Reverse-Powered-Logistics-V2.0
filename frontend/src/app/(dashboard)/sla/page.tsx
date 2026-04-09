'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { slaApi } from '@/lib/api'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Link from 'next/link'

function Countdown({ minutes }: { minutes: number | null }) {
  if (minutes === null) return <span className="text-white/30 text-xs">No deadline</span>
  const abs = Math.abs(minutes)
  const h = Math.floor(abs / 60), m = abs % 60
  const label = minutes < 0 ? `${h}h ${m}m overdue` : `${h}h ${m}m left`
  const color = minutes < 0 ? 'text-red-400' : minutes < 60 ? 'text-red-400' : minutes < 240 ? 'text-yellow-400' : 'text-green-400'
  return <span className={`${color} font-mono text-xs font-bold`}>{label}</span>
}

const URGENCY_STYLES: Record<string, string> = {
  critical: 'border-l-4 border-l-red-500 bg-red-500/5',
  high: 'border-l-4 border-l-yellow-500 bg-yellow-500/5',
  medium: 'border-l-4 border-l-blue-500 bg-blue-500/5',
  low: 'border-l-4 border-l-white/10',
}

export default function SlaPage() {
  const qc = useQueryClient()
  const { data: queue, isLoading } = useQuery({
    queryKey: ['sla-queue'],
    queryFn: () => slaApi.queue().then(r => r.data),
    refetchInterval: 30000,
  })

  const escalateMut = useMutation({
    mutationFn: (id: string) => slaApi.escalate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sla-queue'] }); toast.success('Escalated!') },
  })

  const urgencyGroups = {
    critical: (queue || []).filter((r: any) => r.urgency === 'critical'),
    high: (queue || []).filter((r: any) => r.urgency === 'high'),
    medium: (queue || []).filter((r: any) => r.urgency === 'medium'),
    low: (queue || []).filter((r: any) => r.urgency === 'low'),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">SLA Priority Queue</h2>
          <p className="text-white/40 text-sm mt-0.5">Returns sorted by deadline urgency — refreshes every 30s</p>
        </div>
        <div className="flex gap-3">
          {Object.entries(urgencyGroups).map(([k, v]) => (
            <div key={k} className="text-center">
              <div className={`text-lg font-black ${k === 'critical' ? 'text-red-400' : k === 'high' ? 'text-yellow-400' : k === 'medium' ? 'text-blue-400' : 'text-white/40'}`}>{v.length}</div>
              <div className="text-white/30 text-xs capitalize">{k}</div>
            </div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-white/30">Loading queue...</div>
      ) : (queue || []).length === 0 ? (
        <div className="py-20 text-center text-white/30">
          <div className="text-5xl mb-4">✅</div>
          <p>No pending items in the queue</p>
          <Link href="/returns/submit" className="text-brand-400 text-sm mt-2 block">Submit a return →</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {(queue || []).map((r: any, i: number) => (
            <motion.div key={r.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className={`bg-navy-900 rounded-xl p-4 ${URGENCY_STYLES[r.urgency] || ''}`}>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold text-sm truncate">{r.product_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                      r.urgency === 'critical' ? 'bg-red-500/20 text-red-400' :
                      r.urgency === 'high' ? 'bg-yellow-500/20 text-yellow-400' :
                      r.urgency === 'medium' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/40'
                    }`}>{r.urgency}</span>
                  </div>
                  <div className="flex gap-4 mt-1 flex-wrap">
                    <span className="text-white/40 text-xs">{r.category}</span>
                    <span className="text-white/40 text-xs">₹{r.product_price?.toLocaleString()}</span>
                    <span className="text-white/40 text-xs">{r.recommended_action}</span>
                    <Countdown minutes={r.minutes_remaining} />
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/returns/${r.id}`}
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors">
                    View
                  </Link>
                  {r.urgency !== 'critical' && (
                    <button onClick={() => escalateMut.mutate(r.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors font-semibold">
                      Escalate
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
