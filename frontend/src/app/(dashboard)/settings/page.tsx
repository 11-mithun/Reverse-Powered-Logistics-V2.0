'use client'
import { useState } from 'react'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')

  const TABS = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'api', label: 'API Keys', icon: '🔑' },
    { id: 'db', label: 'Database', icon: '🗄️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ]

  const ApiKeySection = () => {
    const [keys, setKeys] = useState({ anthropic: '', gemini: '', openai: '' })
    return (
      <div className="space-y-5">
        <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl p-4 text-sm text-brand-400">
          <strong>Priority Order:</strong> Claude (Anthropic) → Gemini (Google) → GPT (OpenAI) → Rule-based fallback<br />
          Set any ONE key below — the platform auto-selects the best available model.
        </div>
        {[
          { key: 'anthropic', label: 'Anthropic Claude API Key', placeholder: 'sk-ant-...', link: 'https://console.anthropic.com', note: 'Free $5 credits on signup' },
          { key: 'gemini', label: 'Google Gemini API Key', placeholder: 'AIza...', link: 'https://aistudio.google.com/app/apikey', note: 'FREE — 1M requests/day' },
          { key: 'openai', label: 'OpenAI API Key', placeholder: 'sk-...', link: 'https://platform.openai.com/api-keys', note: 'Pay-per-use, GPT-4o-mini' },
        ].map(({ key, label, placeholder, link, note }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-white/70 text-sm font-medium">{label}</label>
              <a href={link} target="_blank" rel="noopener noreferrer" className="text-brand-400 text-xs hover:underline">Get key →</a>
            </div>
            <input type="password" value={(keys as any)[key]} onChange={e => setKeys(k => ({ ...k, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full bg-navy-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder-white/20 outline-none focus:border-brand-400" />
            <p className="text-white/30 text-xs mt-1">{note}</p>
          </div>
        ))}
        <p className="text-white/30 text-xs">Keys are stored in your backend <code className="text-brand-400">.env</code> file — update it directly for production.</p>
        <button onClick={() => toast.success('Update your backend .env file with these keys and restart Flask')} className="btn-brand text-sm py-2.5 px-6">Save to .env</button>
      </div>
    )
  }

  const DatabaseSection = () => (
    <div className="space-y-5">
      <div className="bg-white/5 rounded-xl p-5 space-y-3">
        <h3 className="text-white font-semibold">Current: SQLite</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[['File', 'instance/rl_platform.db'], ['Status', 'Connected'], ['Type', 'SQLite 3'], ['Setup', 'Zero config']].map(([k, v]) => (
            <div key={k}><span className="text-white/40">{k}: </span><span className="text-white">{v}</span></div>
          ))}
        </div>
      </div>
      <div className="bg-white/5 rounded-xl p-5 space-y-3">
        <h3 className="text-white font-semibold">Switch to PostgreSQL (Production)</h3>
        <ol className="text-white/60 text-sm space-y-1 list-decimal list-inside">
          <li>Install: <code className="text-teal-400">pip install psycopg2-binary</code></li>
          <li>Create database: <code className="text-teal-400">createdb rlplatform</code></li>
          <li>Update <code className="text-teal-400">.env</code>: <code className="text-brand-400">DATABASE_URL=postgresql://user:pass@localhost/rlplatform</code></li>
          <li>Restart Flask — tables auto-create</li>
        </ol>
      </div>
      <div className="flex gap-3">
        <button onClick={() => toast.success('Backup: cp backend/instance/rl_platform.db backup.db')} className="btn-outline text-sm py-2.5">💾 Backup DB</button>
        <button onClick={() => toast.error('Warning: This deletes all data! Delete instance/rl_platform.db and restart Flask.')} className="text-red-400 border border-red-400/30 rounded-xl px-4 py-2.5 text-sm hover:bg-red-500/10 transition-colors">🗑️ Reset DB</button>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-white text-xl font-bold">Settings</h2>
        <p className="text-white/40 text-sm mt-0.5">Manage your platform configuration</p>
      </div>
      <div className="flex gap-2 bg-navy-900 rounded-2xl p-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${activeTab === t.id ? 'bg-brand-500 text-white' : 'text-white/40 hover:text-white'}`}>
            <span>{t.icon}</span><span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-navy-900 border border-white/10 rounded-2xl p-6">
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/30 flex items-center justify-center text-brand-400 font-black text-2xl">{user?.name?.[0] || 'U'}</div>
              <div>
                <p className="text-white font-bold text-lg">{user?.name}</p>
                <p className="text-white/40 text-sm">{user?.email}</p>
                <span className="text-xs bg-brand-500/20 text-brand-400 rounded-full px-2 py-0.5 font-semibold capitalize">{user?.role}</span>
              </div>
            </div>
            <hr className="border-white/10" />
            <div className="text-white/50 text-sm space-y-1">
              <p>• To change password: update <code className="text-brand-400">ADMIN_PASSWORD</code> in <code className="text-brand-400">.env</code></p>
              <p>• Then reset the database: <code className="text-brand-400">rm instance/rl_platform.db && python run.py</code></p>
            </div>
          </div>
        )}
        {activeTab === 'api' && <ApiKeySection />}
        {activeTab === 'db' && <DatabaseSection />}
        {activeTab === 'notifications' && (
          <div className="space-y-4 text-white/60 text-sm">
            <p>WebSocket notifications are enabled by default via Socket.IO.</p>
            <p>Events emitted: <code className="text-teal-400">new_return</code>, <code className="text-teal-400">sla_escalation</code></p>
            <p>Frontend listens at <code className="text-brand-400">{process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000'}</code></p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
