'use client'
import { useState } from 'react'
import { authApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) { toast.error('All fields required'); return }
    setLoading(true)
    try {
      const r = await authApi.register(form.email, form.name, form.password)
      if (typeof window !== 'undefined') {
        localStorage.setItem('rl_token', r.data.token)
        localStorage.setItem('rl_user', JSON.stringify(r.data.user))
      }
      toast.success('Account created!')
      router.push('/dashboard')
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface-900 bg-grid-pattern flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-violet-500/8 rounded-full blur-3xl" />
      </div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-black text-xl mx-auto mb-4 shadow-brand">RL</div>
          <h1 className="text-white text-3xl font-black">Create account</h1>
          <p className="text-white/40 text-sm mt-1.5">Join RL Platform — free to start</p>
        </div>
        <div className="card-glass rounded-3xl p-8 space-y-4">
          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Jane Smith' },
            { label: 'Email Address', key: 'email', type: 'email', placeholder: 'jane@company.com' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="text-white/50 text-xs block mb-1.5">{label}</label>
              <input type={type} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="input-premium" placeholder={placeholder} />
            </div>
          ))}
          <div>
            <label className="text-white/50 text-xs block mb-1.5">Password</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                className="input-premium pr-10" placeholder="Min 8 characters" />
              <button onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <motion.button onClick={handleRegister} disabled={loading} whileTap={{ scale: 0.97 }}
            className="btn-brand w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-60">
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><span>Create Account</span><ArrowRight size={16} /></>}
          </motion.button>
          <p className="text-center text-white/40 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
