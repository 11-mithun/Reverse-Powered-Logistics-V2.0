'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { integrationsApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const PLATFORM_INFO: Record<string, { icon: string; desc: string; category: string }> = {
  shopify: { icon: '🛍️', desc: 'Sync orders and returns from your Shopify store', category: 'E-Commerce' },
  woocommerce: { icon: '🛒', desc: 'WooCommerce orders auto-pushed to returns queue', category: 'E-Commerce' },
  amazon: { icon: '📦', desc: 'Amazon Seller Central returns integration', category: 'E-Commerce' },
  flipkart: { icon: '🏪', desc: 'Flipkart seller returns and RTO management', category: 'E-Commerce' },
  sap: { icon: '🏢', desc: 'SAP ERP bi-directional inventory sync', category: 'ERP/WMS' },
  zoho: { icon: '📊', desc: 'Zoho Inventory real-time stock updates', category: 'ERP/WMS' },
  fedex: { icon: '✈️', desc: 'FedEx parcel tracking and delivery events', category: 'Carriers' },
  ups: { icon: '🚚', desc: 'UPS tracking webhook and label generation', category: 'Carriers' },
}

export default function IntegrationsPage() {
  const qc = useQueryClient()
  const { data: integrations, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationsApi.list().then(r => r.data),
  })

  const connectMut = useMutation({
    mutationFn: (platform: string) => integrationsApi.connect(platform),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['integrations'] }); toast.success('Connected!') },
    onError: () => toast.error('Connection failed'),
  })

  const disconnectMut = useMutation({
    mutationFn: (platform: string) => integrationsApi.disconnect(platform),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['integrations'] }); toast.success('Disconnected') },
  })

  const categories = ['E-Commerce', 'ERP/WMS', 'Carriers']

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-white text-xl font-bold">Integration Hub</h2>
        <p className="text-white/40 text-sm mt-1">Connect your e-commerce stack for real-time return sync</p>
      </div>
      {categories.map(cat => (
        <div key={cat}>
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">{cat}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {(integrations || [])
              .filter((i: any) => PLATFORM_INFO[i.platform]?.category === cat)
              .map((integration: any, idx: number) => {
                const info = PLATFORM_INFO[integration.platform] || { icon: '🔌', desc: '', category: '' }
                const connected = integration.status === 'connected'
                return (
                  <motion.div key={integration.platform} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                    className="bg-navy-900 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${connected ? 'bg-green-500/20' : 'bg-white/5'}`}>
                      {info.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold capitalize">{integration.platform}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${connected ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                          {connected ? '● Connected' : '○ Disconnected'}
                        </span>
                      </div>
                      <p className="text-white/40 text-xs mt-0.5 truncate">{info.desc}</p>
                      {connected && integration.last_sync && (
                        <p className="text-white/20 text-xs mt-0.5">Last sync: {new Date(integration.last_sync).toLocaleString()}</p>
                      )}
                    </div>
                    <button
                      onClick={() => connected ? disconnectMut.mutate(integration.platform) : connectMut.mutate(integration.platform)}
                      className={`flex-shrink-0 text-sm px-4 py-2 rounded-xl font-semibold transition-all ${connected ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'btn-brand'}`}>
                      {connected ? 'Disconnect' : 'Connect'}
                    </button>
                  </motion.div>
                )
              })}
          </div>
        </div>
      ))}

      {/* Webhook config */}
      <div className="bg-navy-900 border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-2">Webhook Endpoint</h3>
        <p className="text-white/40 text-sm mb-4">Use this URL in your platform's webhook settings to auto-push returns</p>
        <div className="flex gap-2">
          <code className="flex-1 bg-navy-950 rounded-xl px-4 py-3 text-teal-400 text-sm font-mono border border-white/10">
            {typeof window !== 'undefined' ? window.location.origin.replace('3000', '5000') : 'http://localhost:5000'}/api/integrations/webhooks?platform=YOUR_PLATFORM
          </code>
          <button onClick={() => { navigator.clipboard.writeText('http://localhost:5000/api/integrations/webhooks?platform=shopify'); toast.success('Copied!') }}
            className="btn-outline text-sm px-4">Copy</button>
        </div>
      </div>
    </div>
  )
}
