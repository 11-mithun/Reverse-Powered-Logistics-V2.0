'use client'
import { useState } from 'react'
import { authApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Brain, Eye, EyeOff, Zap, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@rlplatform.com')
  const [password, setPassword] = useState('Admin@123456')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    try {
      const r = await authApi.login(email, password)
      if (typeof window !== 'undefined') {
        localStorage.setItem('rl_token', r.data.token)
        localStorage.setItem('rl_user', JSON.stringify(r.data.user))
      }
      toast.success(`Welcome back, ${r.data.user.name}!`)
      router.push('/dashboard')
    } catch {
      toast.error('Invalid credentials')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface-900 bg-grid-pattern flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0.8, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-black text-2xl mx-auto mb-4 shadow-brand animate-glow-pulse">
            RL
          </motion.div>
          <h1 className="text-white text-3xl font-black">Welcome back</h1>
          <p className="text-white/40 text-sm mt-1.5">Sign in to RL Platform v2.0 Pro</p>
        </div>

        <div className="card-glass rounded-3xl p-8 space-y-5">
          {/* Demo creds */}
          <div className="rounded-xl p-3.5 text-xs space-y-1" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex items-center gap-1.5 text-brand-400 font-semibold mb-1.5">
              <Zap size={11} /> Demo Credentials
            </div>
            <p className="text-white/50">Admin: <span className="text-white/80 font-mono">admin@rlplatform.com</span> / <span className="text-white/80 font-mono">Admin@123456</span></p>
            <p className="text-white/50">Customer: <span className="text-white/80 font-mono">demo@customer.com</span> / <span className="text-white/80 font-mono">Demo@123456</span></p>
          </div>

          <div>
            <label className="text-white/50 text-xs block mb-1.5">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="input-premium" placeholder="you@company.com" />
          </div>

          <div>
            <label className="text-white/50 text-xs block mb-1.5">Password</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="input-premium pr-10" placeholder="••••••••" />
              <button onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <motion.button onClick={handleLogin} disabled={loading} whileTap={{ scale: 0.97 }}
            className="btn-brand w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-60">
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><span>Sign In</span><ArrowRight size={16} /></>}
          </motion.button>

          <p className="text-center text-white/40 text-sm">
            No account?{' '}
            <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 mt-6 text-white/20 text-xs">
          <Link href="/" className="hover:text-white/50 transition-colors">← Homepage</Link>
          <span>•</span>
          <Link href="/portal" className="hover:text-white/50 transition-colors">Customer Portal</Link>
        </div>
      </motion.div>
    </div>
  )
}
