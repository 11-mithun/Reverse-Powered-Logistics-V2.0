'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { analyticsApi, agentsApi, returnsApi } from '@/lib/api'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'
import { TrendingUp, BarChart3, MapPin, Leaf, RefreshCw, Globe } from 'lucide-react'

const COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#f43f5e','#8b5cf6','#fb7185','#34d399']
const TT_STYLE = {background:'rgba(10,10,25,0.95)',border:'1px solid rgba(99,102,241,0.3)',borderRadius:12,fontSize:11}

function StatCard({label,value,sub,color,delay=0}:any) {
  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay,duration:0.4}}
      className="holographic rounded-2xl p-4">
      <p className="text-white/40 text-xs mb-1">{label}</p>
      <p className="text-2xl font-black" style={{color}}>{value||'—'}</p>
      {sub && <p className="text-white/30 text-xs mt-0.5">{sub}</p>}
    </motion.div>
  )
}

export default function AnalyticsPage() {
  const [daily, setDaily] = useState<any[]>([])
  const [heatmap, setHeatmap] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [carbon, setCarbon] = useState<any>(null)
  const [forecast, setForecast] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [d,h,s,c,f] = await Promise.allSettled([
      analyticsApi.daily(30), analyticsApi.heatmap(),
      returnsApi.stats(), agentsApi.carbonOffset(), analyticsApi.forecast()
    ])
    if (d.status==='fulfilled') setDaily(d.value.data||[])
    if (h.status==='fulfilled') setHeatmap(h.value.data||[])
    if (s.status==='fulfilled') setStats(s.value.data)
    if (c.status==='fulfilled') setCarbon(c.value.data)
    if (f.status==='fulfilled') {
      const fd = f.value.data
      setForecast(Array.isArray(fd) ? fd : fd?.historical||[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const kpis = [
    {label:'Total Returns',value:stats?.total_returns?.toLocaleString(),sub:'All time',color:'#6366f1',delay:0},
    {label:'Completed',value:stats?.completed?.toLocaleString(),sub:'Successfully resolved',color:'#10b981',delay:0.05},
    {label:'Recovery Value',value:stats?`Rs.${(stats.total_recovery_value/1000).toFixed(0)}K`:null,sub:'Net recovered',color:'#06b6d4',delay:0.1},
    {label:'Avg Salvage',value:stats?`${stats.avg_salvage_percent}%`:null,sub:'Recovery rate',color:'#f59e0b',delay:0.15},
    {label:'Fraud Flags',value:stats?.high_fraud_flags?.toLocaleString(),sub:'High risk',color:'#f43f5e',delay:0.2},
    {label:'CO2 Saved',value:carbon?`${carbon.total_co2_saved_kg?.toFixed(0)}kg`:null,sub:carbon?`${carbon.trees_equivalent} trees`:'ESG impact',color:'#34d399',delay:0.25},
  ]

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Analytics</h1>
          <p className="text-white/40 text-sm mt-0.5">Real-time performance intelligence</p>
        </div>
        <button onClick={load} className="btn-ghost py-2 px-3 flex items-center gap-2 text-sm">
          <RefreshCw size={13}/>Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k,i) => <StatCard key={i} {...k} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Daily trend */}
        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-brand-400"/>
            <span className="text-white font-semibold">Returns & Recovery (30 Days)</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={daily} margin={{top:0,right:0,left:-30,bottom:0}}>
              <defs>
                <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{fontSize:9,fill:'#475569'}} tickFormatter={d=>d.slice(5)}/>
              <YAxis tick={{fontSize:9,fill:'#475569'}}/>
              <Tooltip contentStyle={TT_STYLE}/>
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#ga)" strokeWidth={2} name="Returns"/>
              <Area type="monotone" dataKey="nrv" stroke="#10b981" fill="url(#gb)" strokeWidth={2} name="NRV"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Actions breakdown */}
        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-cyan-400"/>
            <span className="text-white font-semibold">Disposition Breakdown</span>
          </div>
          {stats?.actions_breakdown?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={stats.actions_breakdown} dataKey="count" nameKey="action"
                    cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>
                    {stats.actions_breakdown.map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={TT_STYLE}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {stats.actions_breakdown.map((a:any,i:number)=>(
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:COLORS[i%COLORS.length]}}/>
                    <span className="text-white/50 truncate">{a.action}</span>
                    <span className="text-white/70 font-semibold ml-auto">{a.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="flex items-center justify-center h-40 text-white/20 text-sm">No data yet</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Heatmap / regional */}
        <div className="lg:col-span-2 card-glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={14} className="text-emerald-400"/>
            <span className="text-white font-semibold">Regional NRV Heatmap</span>
          </div>
          {heatmap.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={heatmap} margin={{top:0,right:0,left:-20,bottom:30}}>
                <XAxis dataKey="city" tick={{fontSize:10,fill:'#475569'}} angle={-30} textAnchor="end"/>
                <YAxis tick={{fontSize:9,fill:'#475569'}}/>
                <Tooltip contentStyle={TT_STYLE} formatter={(v:any)=>[`Rs.${Number(v).toFixed(0)}`,'Avg NRV']}/>
                <Bar dataKey="avg_nrv" radius={[6,6,0,0]}>
                  {heatmap.map((h:any,i:number)=>(
                    <Cell key={i} fill={h.avg_nrv<0?'#f43f5e':h.avg_nrv<500?'#f59e0b':'#10b981'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-40 text-white/20 text-sm">No regional data yet</div>}
        </div>

        {/* Category breakdown */}
        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={14} className="text-amber-400"/>
            <span className="text-white font-semibold">By Category</span>
          </div>
          {stats?.category_breakdown?.length > 0 ? (
            <div className="space-y-2">
              {stats.category_breakdown.map((c:any,i:number)=>{
                const pct = Math.round(c.count/stats.total_returns*100)
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{c.category}</span>
                      <span className="text-white/80 font-semibold">{c.count}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width:`${pct}%`,background:COLORS[i%COLORS.length]}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <div className="flex items-center justify-center h-40 text-white/20 text-sm">No data</div>}
        </div>
      </div>

      {/* Carbon offset summary */}
      {carbon && (
        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Leaf size={14} className="text-emerald-400"/>
            <span className="text-white font-semibold">ESG Impact Summary</span>
            <span className="badge-success ml-auto">Grade {carbon.sustainability_grade}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {label:'CO2 Saved',value:`${carbon.total_co2_saved_kg?.toFixed(1)} kg`,color:'#10b981'},
              {label:'Trees Equivalent',value:carbon.trees_equivalent,color:'#34d399'},
              {label:'Cars Off Road',value:carbon.cars_off_road_equivalent,color:'#06b6d4'},
              {label:'ESG Score',value:carbon.esg_score,color:'#6366f1'},
            ].map((item,i)=>(
              <div key={i} className="holographic rounded-xl p-3 text-center">
                <p className="text-white/40 text-xs">{item.label}</p>
                <p className="text-xl font-black mt-1" style={{color:item.color}}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
