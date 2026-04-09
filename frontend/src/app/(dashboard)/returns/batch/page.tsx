'use client'
import { useState, useRef } from 'react'
import { returnsApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function BatchPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handle = async () => {
    if (!file) return
    setLoading(true); setProgress(0)
    const tick = setInterval(() => setProgress(p => Math.min(p + 3, 90)), 200)
    try {
      const res = await returnsApi.batch(file)
      clearInterval(tick); setProgress(100)
      setResult(res.data); toast.success(`Processed ${res.data.processed} returns!`)
    } catch { clearInterval(tick); toast.error('Batch failed') }
    setLoading(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.csv')) setFile(f)
    else toast.error('Please upload a CSV file')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-white text-xl font-bold">Batch Return Processor</h2>
        <p className="text-white/40 text-sm mt-1">Upload a CSV to process hundreds of returns at once via AI classification</p>
      </div>

      {/* Template download */}
      <div className="bg-navy-900 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
        <div className="text-3xl">📋</div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">Download CSV Template</p>
          <p className="text-white/40 text-xs mt-0.5">Required columns: order_id, product_name, category, product_price, return_reason, days_since_purchase, repair_cost, warehouse_location</p>
        </div>
        <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/datasets/sample`}
           className="btn-outline text-sm py-2 px-4 whitespace-nowrap" download>
          ↓ Template
        </a>
      </div>

      {/* Upload zone */}
      <div onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragging(true) }}
           onDragLeave={() => setDragging(false)}
           onClick={() => inputRef.current?.click()}
           className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragging ? 'border-brand-400 bg-brand-500/10' : file ? 'border-green-500/50 bg-green-500/5' : 'border-white/20 hover:border-white/40'}`}>
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }} />
        {file ? (
          <div>
            <div className="text-4xl mb-2">✅</div>
            <p className="text-white font-semibold">{file.name}</p>
            <p className="text-white/40 text-sm">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-3">📁</div>
            <p className="text-white font-semibold">Drop CSV here or click to browse</p>
            <p className="text-white/40 text-sm mt-1">Maximum 500 rows per batch</p>
          </div>
        )}
      </div>

      {file && !result && (
        <button onClick={handle} disabled={loading}
          className="btn-brand w-full py-4 text-base flex items-center justify-center gap-3 disabled:opacity-50">
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing {file.name}... {progress}%
            </>
          ) : `🧠 Process ${file.name} with AI`}
        </button>
      )}

      {loading && (
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full"
            animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      )}

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[['Processed', result.processed, '#22c55e'], ['Errors', result.errors, '#ef4444'], ['Success Rate', `${((result.processed/(result.processed+result.errors||1))*100).toFixed(0)}%`, '#FF6D00']].map(([l,v,c]) => (
              <div key={l as string} className="bg-navy-900 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-black" style={{ color: c as string }}>{v}</div>
                <div className="text-white/40 text-xs mt-1">{l}</div>
              </div>
            ))}
          </div>
          <div className="bg-navy-900 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-white font-semibold text-sm">Results Preview (first 10)</span>
              <Link href="/returns" className="text-brand-400 text-xs">View all in Returns →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-white/10">{['Row','Product','Action','NRV','Fraud'].map(h => <th key={h} className="px-4 py-2 text-left text-white/40 font-semibold">{h}</th>)}</tr></thead>
                <tbody>
                  {(result.results || []).slice(0, 10).map((r: any) => (
                    <tr key={r.row} className="border-b border-white/5">
                      <td className="px-4 py-2 text-white/40">#{r.row}</td>
                      <td className="px-4 py-2 text-white">{r.product_name || r.Product || '—'}</td>
                      <td className="px-4 py-2 text-brand-400 font-semibold">{r.recommended_action}</td>
                      <td className="px-4 py-2 text-white font-mono">₹{parseFloat(r.net_recovery_value||0).toFixed(0)}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${r.fraud_risk==='High'?'bg-red-500/20 text-red-400':r.fraud_risk==='Medium'?'bg-yellow-500/20 text-yellow-400':'bg-green-500/20 text-green-400'}`}>{r.fraud_risk}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <button onClick={() => { setResult(null); setFile(null); setProgress(0) }} className="btn-outline w-full">Process Another File</button>
        </motion.div>
      )}
    </div>
  )
}
