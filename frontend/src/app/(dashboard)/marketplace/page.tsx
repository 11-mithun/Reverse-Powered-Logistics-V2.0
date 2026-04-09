'use client'
import { useQuery, useMutation } from '@tanstack/react-query'
import { marketplaceApi } from '@/lib/api'
import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const TYPE_COLORS: Record<string, string> = {
  repair: 'text-blue-400 bg-blue-500/10',
  liquidation: 'text-yellow-400 bg-yellow-500/10',
  recycling: 'text-green-400 bg-green-500/10',
}

export default function MarketplacePage() {
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [quotePrice, setQuotePrice] = useState('')
  const [quoteResult, setQuoteResult] = useState<any>(null)

  const { data: partners, isLoading } = useQuery({
    queryKey: ['partners', filter],
    queryFn: () => marketplaceApi.list(filter || undefined).then(r => r.data),
  })

  const quoteMut = useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) =>
      marketplaceApi.quote(id, { product_price: price }),
    onSuccess: (res) => { setQuoteResult(res.data); toast.success('Quote generated!') },
    onError: () => toast.error('Quote failed'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white text-xl font-bold">Repair Partner Marketplace</h2>
          <p className="text-white/40 text-sm mt-0.5">Find certified repair, liquidation, and recycling partners</p>
        </div>
        <div className="flex gap-2">
          {[['', 'All'], ['repair', 'Repair'], ['liquidation', 'Liquidation'], ['recycling', 'Recycling']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === v ? 'bg-brand-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-white/30">Loading partners...</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {(partners || []).map((p: any, i: number) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-navy-900 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-bold">{p.name}</h3>
                  <p className="text-white/40 text-xs mt-0.5">{p.city}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[p.partner_type] || 'text-white/50 bg-white/5'}`}>
                  {p.partner_type}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center bg-white/5 rounded-xl p-2">
                  <div className="text-brand-400 font-bold text-lg">{p.rating}</div>
                  <div className="text-white/30 text-xs">Rating</div>
                </div>
                <div className="text-center bg-white/5 rounded-xl p-2">
                  <div className="text-teal-400 font-bold text-lg">{p.avg_turnaround_days}d</div>
                  <div className="text-white/30 text-xs">Turnaround</div>
                </div>
                <div className="text-center bg-white/5 rounded-xl p-2">
                  <div className="text-yellow-400 font-bold text-lg">{p.avg_cost_percent}%</div>
                  <div className="text-white/30 text-xs">Fee</div>
                </div>
              </div>
              {p.specializations?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {p.specializations.map((s: string) => (
                    <span key={s} className="text-xs bg-white/5 text-white/50 rounded-lg px-2 py-0.5">{s}</span>
                  ))}
                </div>
              )}
              <button onClick={() => { setSelected(p); setQuoteResult(null); }}
                className="w-full btn-brand text-sm py-2">Request Quote →</button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quote Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-navy-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-white font-bold text-lg mb-1">Request Quote</h3>
            <p className="text-white/40 text-sm mb-5">{selected.name} · {selected.city}</p>
            {!quoteResult ? (
              <div className="space-y-4">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Product Price (₹)</label>
                  <input type="number" value={quotePrice} onChange={e => setQuotePrice(e.target.value)}
                    placeholder="e.g. 2999" className="w-full bg-navy-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-400" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSelected(null)} className="btn-outline flex-1 text-sm py-2.5">Cancel</button>
                  <button onClick={() => quoteMut.mutate({ id: selected.id, price: +quotePrice })}
                    disabled={!quotePrice || quoteMut.isPending}
                    className="btn-brand flex-1 text-sm py-2.5 disabled:opacity-40">
                    {quoteMut.isPending ? 'Generating...' : 'Get Quote'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl p-4">
                  <div className="text-brand-400 font-black text-2xl">₹{quoteResult.estimated_cost?.toFixed(0)}</div>
                  <div className="text-white/50 text-sm mt-1">Estimated repair cost</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-teal-400 font-bold">{quoteResult.estimated_days} days</div>
                    <div className="text-white/30 text-xs">Turnaround</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-white font-bold font-mono text-xs">{quoteResult.quote_id}</div>
                    <div className="text-white/30 text-xs">Quote ID</div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="btn-brand w-full text-sm py-2.5">Close</button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
