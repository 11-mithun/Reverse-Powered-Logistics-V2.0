'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { returnsApi, premiumApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Brain, Globe, ChevronRight, CheckCircle, AlertTriangle, Zap } from 'lucide-react'

const CATEGORIES = ['Electronics','Clothing','Home & Kitchen','Sports','Furniture','Books','Toys','Beauty','Automotive']
const CITIES = ['Mumbai','Delhi','Bangalore','Chennai','Hyderabad','Pune','Kolkata','Ahmedabad','Jaipur','Surat']

const DAMAGE_INFO: Record<string, { color: string; label: string }> = {
  'No Damage':       { color: '#10b981', label: '✅ No Damage' },
  'Minor Damage':    { color: '#f59e0b', label: '⚠️ Minor Damage' },
  'Moderate Damage': { color: '#f97316', label: '🔶 Moderate Damage' },
  'Severe Damage':   { color: '#f43f5e', label: '🚨 Severe Damage' },
}

export default function SubmitReturnPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [lang, setLang] = useState('en')
  const [langs, setLangs] = useState<any[]>([])
  const [strings, setStrings] = useState<any>({})

  const [form, setForm] = useState({
    product_name: '', category: 'Electronics', product_price: '',
    days_since_purchase: '', return_reason: '', customer_email: '',
    customer_name: '', warehouse_location: 'Mumbai', sku: '',
    supplier_name: '', repair_cost: '0',
    customer_total_orders: '5', customer_avg_order: '',
    customer_return_count: '1',
  })

  // F11: Multi-language
  useEffect(() => {
    premiumApi.languages().then(r => setLangs(r.data)).catch(() => {})
  }, [])
  useEffect(() => {
    premiumApi.translate(lang).then(r => setStrings(r.data.strings || {})).catch(() => {})
  }, [lang])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.product_name || !form.product_price || !form.return_reason) {
      toast.error('Please fill all required fields'); return
    }
    setLoading(true)
    try {
      const r = await returnsApi.create({
        ...form,
        product_price: parseFloat(form.product_price),
        days_since_purchase: parseInt(form.days_since_purchase) || 7,
        repair_cost: parseFloat(form.repair_cost) || 0,
        customer_avg_order: parseFloat(form.customer_avg_order) || parseFloat(form.product_price),
        customer_total_orders: parseInt(form.customer_total_orders) || 5,
        customer_return_count: parseInt(form.customer_return_count) || 1,
      })
      setResult(r.data)
      setStep(3)
      toast.success('Return submitted & AI decision complete!')
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Submission failed')
    }
    setLoading(false)
  }

  const dmg = result ? DAMAGE_INFO[result.damage_level] || DAMAGE_INFO['Moderate Damage'] : null

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">{strings.submit || 'Submit Return'}</h1>
          <p className="text-white/40 text-sm">AI-powered instant decision</p>
        </div>
        {/* F11: Language selector */}
        <div className="flex items-center gap-2">
          <Globe size={13} className="text-white/40"/>
          <select value={lang} onChange={e => setLang(e.target.value)}
            className="bg-surface-800 border border-white/10 text-white/70 text-xs rounded-lg px-2 py-1.5 outline-none">
            {langs.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1,2,3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step>s ? 'bg-emerald-500 text-white' : step===s ? 'bg-brand-500 text-white' : 'bg-white/8 text-white/30'
            }`}>{step>s ? '✓' : s}</div>
            {s < 3 && <div className={`h-px w-16 transition-all ${step>s ? 'bg-emerald-500/50' : 'bg-white/8'}`}/>}
          </div>
        ))}
        <span className="text-white/40 text-xs ml-2">{step===1?'Product Info':step===2?'Customer Info':'Result'}</span>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1 */}
        {step === 1 && (
          <motion.div key="s1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
            className="card-glass rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-white/50 text-xs block mb-1.5">Product Name *</label>
                <input value={form.product_name} onChange={e=>set('product_name',e.target.value)}
                  placeholder="e.g. Sony WH-1000XM5 Headphones" className="input-premium"/>
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1.5">Category *</label>
                <select value={form.category} onChange={e=>set('category',e.target.value)} className="input-premium bg-surface-800">
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1.5">Product Price (₹) *</label>
                <input type="number" value={form.product_price} onChange={e=>set('product_price',e.target.value)}
                  placeholder="24999" className="input-premium"/>
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1.5">Days Since Purchase *</label>
                <input type="number" value={form.days_since_purchase} onChange={e=>set('days_since_purchase',e.target.value)}
                  placeholder="7" className="input-premium"/>
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1.5">Repair Cost Estimate (₹)</label>
                <input type="number" value={form.repair_cost} onChange={e=>set('repair_cost',e.target.value)}
                  placeholder="0" className="input-premium"/>
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1.5">SKU (optional)</label>
                <input value={form.sku} onChange={e=>set('sku',e.target.value)} placeholder="SKU-001" className="input-premium"/>
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1.5">Supplier Name</label>
                <input value={form.supplier_name} onChange={e=>set('supplier_name',e.target.value)} placeholder="Samsung India" className="input-premium"/>
              </div>
              <div className="md:col-span-2">
                <label className="text-white/50 text-xs block mb-1.5">{strings.reason_label || 'Return Reason'} *</label>
                <textarea value={form.return_reason} onChange={e=>set('return_reason',e.target.value)} rows={3}
                  placeholder="Describe the issue in detail…" className="input-premium resize-none"/>
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1.5">Warehouse Location</label>
                <select value={form.warehouse_location} onChange={e=>set('warehouse_location',e.target.value)} className="input-premium bg-surface-800">
                  {CITIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <motion.button onClick={()=>setStep(2)} whileTap={{scale:0.97}}
                className="btn-brand flex items-center gap-2">
                Next: Customer Info <ChevronRight size={14}/>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <motion.div key="s2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
            className="card-glass rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/50 text-xs block mb-1.5">Customer Name</label>
                <input value={form.customer_name} onChange={e=>set('customer_name',e.target.value)} placeholder="Raj Kumar" className="input-premium"/>
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1.5">Customer Email</label>
                <input type="email" value={form.customer_email} onChange={e=>set('customer_email',e.target.value)} placeholder="raj@example.com" className="input-premium"/>
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1.5">Total Orders (all time)</label>
                <input type="number" value={form.customer_total_orders} onChange={e=>set('customer_total_orders',e.target.value)} className="input-premium"/>
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1.5">Previous Returns (90d)</label>
                <input type="number" value={form.customer_return_count} onChange={e=>set('customer_return_count',e.target.value)} className="input-premium"/>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-brand-500/8 border border-brand-500/20">
              <div className="flex items-start gap-2">
                <Brain size={14} className="text-brand-400 mt-0.5 flex-shrink-0"/>
                <p className="text-white/60 text-xs">Customer data is used for CLV analysis, fraud scoring, and hyper-personalized disposition. High LTV customers may be auto-approved.</p>
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={()=>setStep(1)} className="btn-ghost py-2 px-4 text-sm">← Back</button>
              <motion.button onClick={submit} disabled={loading} whileTap={{scale:0.97}}
                className="btn-brand flex items-center gap-2">
                <Zap size={14}/>
                {loading ? 'AI Processing…' : 'Submit & Get AI Decision'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Result */}
        {step === 3 && result && (
          <motion.div key="s3" initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
            className="space-y-4">
            {/* Main decision */}
            <div className="card-glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{background:`${dmg?.color}18`,border:`1px solid ${dmg?.color}30`}}>
                  {result.damage_level==='No Damage'?'✅':result.damage_level==='Minor Damage'?'⚠️':result.damage_level==='Severe Damage'?'🚨':'🔶'}
                </div>
                <div>
                  <p className="text-white font-black text-xl">{result.recommended_action}</p>
                  <p className="text-white/50 text-sm">{dmg?.label} • {result.routing_destination}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-white/40 text-xs">Net Recovery</p>
                  <p className={`text-2xl font-black ${(result.net_recovery_value||0)>=0?'text-emerald-400':'text-rose-400'}`}>
                    {(result.net_recovery_value||0)>=0?'+':''}₹{(result.net_recovery_value||0).toFixed(0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  {label:'Salvage Value',val:`${result.salvage_value_percent?.toFixed(1)}%`,color:'#6366f1'},
                  {label:'Resale Value',val:`₹${result.resale_value?.toFixed(0)}`,color:'#10b981'},
                  {label:'Fraud Risk',val:result.fraud_risk,color:result.fraud_risk==='High'?'#f43f5e':result.fraud_risk==='Medium'?'#f59e0b':'#10b981'},
                  {label:'Priority',val:result.priority_level,color:result.priority_level==='High'?'#f43f5e':'#f59e0b'},
                ].map((item,i)=>(
                  <div key={i} className="rounded-xl p-3 text-center" style={{background:`${item.color}10`,border:`1px solid ${item.color}25`}}>
                    <p className="text-white/40 text-xs">{item.label}</p>
                    <p className="font-bold text-base mt-0.5" style={{color:item.color}}>{item.val}</p>
                  </div>
                ))}
              </div>

              {/* Cost breakdown */}
              <div className="space-y-2 mb-4">
                {[
                  {label:'Holding Cost',val:result.holding_cost,neg:true},
                  {label:'Transport Cost',val:result.transport_cost,neg:true},
                  {label:'Repair Cost',val:result.repair_cost||0,neg:true},
                ].map((item,i)=>(
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-white/40">{item.label}</span>
                    <span className="text-rose-400 font-medium">−₹{(item.val||0).toFixed(0)}</span>
                  </div>
                ))}
                <div className="divider-brand my-2"/>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-white">Net Recovery Value</span>
                  <span className={(result.net_recovery_value||0)>=0?'text-emerald-400':'text-rose-400'}>
                    ₹{(result.net_recovery_value||0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* AI Reasoning */}
              {result.ai_reasoning && (
                <div className="p-3 rounded-xl bg-brand-500/6 border border-brand-500/15">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Brain size={12} className="text-brand-400"/>
                    <span className="text-brand-400 text-xs font-semibold">AI Reasoning ({result.engine || 'rule-based'})</span>
                  </div>
                  <p className="text-white/55 text-xs leading-relaxed">{result.ai_reasoning}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={()=>{setStep(1);setResult(null);setForm({product_name:'',category:'Electronics',product_price:'',days_since_purchase:'',return_reason:'',customer_email:'',customer_name:'',warehouse_location:'Mumbai',sku:'',supplier_name:'',repair_cost:'0',customer_total_orders:'5',customer_avg_order:'',customer_return_count:'1'})}}
                className="btn-outline py-2 px-5 text-sm">Submit Another</button>
              <button onClick={()=>router.push('/returns')} className="btn-brand py-2 px-5 text-sm">View All Returns</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
