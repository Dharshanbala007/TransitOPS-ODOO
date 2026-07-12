import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { 
  Car, 
  Route, 
  Users, 
  Wrench, 
  TrendingUp, 
  Activity, 
  SlidersHorizontal,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

// Custom CountUp Component for Eased Numeric Transitions
function CountUp({ value, duration = 1200, suffix = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }
    const totalMiliseconds = duration;
    const incrementTime = 16; // ~60fps
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalMiliseconds, 1);
      
      // Easing out quadratic
      const easedProgress = progress * (2 - progress);
      const current = easedProgress * end;
      
      if (progress >= 1) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(current);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  const formattedCount = Number.isInteger(parseFloat(value))
    ? Math.round(count).toLocaleString()
    : count.toFixed(1);

  return <span>{formattedCount}{suffix}</span>;
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState({
    activeVehicles: 0,
    availableVehicles: 0,
    inShopVehicles: 0,
    activeTrips: 0,
    pendingTrips: 0,
    driversOnDuty: 0,
    utilization: 0,
    statusDistribution: []
  });

  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [filterType, filterStatus, filterRegion]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        type: filterType,
        status: filterStatus,
        region: filterRegion
      }).toString();

      const res = await fetch(`http://localhost:5000/api/reports/dashboard-stats?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Fetch dashboard stats failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartColors = {
    'Available': '#34d399', // Emerald
    'On Trip': '#60a5fa',   // Blue
    'In Shop': '#fbbf24',   // Amber
    'Retired': '#a1a1aa'    // Zinc
  };

  const kpis = [
    {
      title: 'Active Vehicles',
      value: stats.activeVehicles,
      icon: Car,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      title: 'Available Vehicles',
      value: stats.availableVehicles,
      icon: Car,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Vehicles In Shop',
      value: stats.inShopVehicles,
      icon: Wrench,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Active Trips',
      value: stats.activeTrips,
      icon: Route,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      title: 'Pending Trips (Draft)',
      value: stats.pendingTrips,
      icon: Route,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      title: 'Drivers On Duty',
      value: stats.driversOnDuty,
      icon: Users,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Fleet Utilization',
      value: stats.utilization,
      icon: TrendingUp,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      suffix: '%'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">
            Fleet <span style={{ color: 'var(--accent)' }}>Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Real-time telemetry diagnostics, active asset utilisation, and routing insight parameters.</p>
        </div>
      </div>

      {/* Filters Module */}
      <GlassCard hoverable={false} className="p-4 border border-white/5">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
            <SlidersHorizontal className="h-4 w-4 text-[#6E6EF6]" />
            <span>Dashboard Filters</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="glass-select text-slate-300 text-xs font-medium flex-1 md:flex-none"
            >
              <option value="All">All Types</option>
              <option value="Van">Vans</option>
              <option value="Truck">Trucks</option>
              <option value="Sedan">Sedans</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="glass-select text-slate-300 text-xs font-medium flex-1 md:flex-none"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>

            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="glass-select text-slate-300 text-xs font-medium flex-1 md:flex-none"
            >
              <option value="All">All Regions</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* KPI Cards Row (Animated transition) */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6E6EF6]" />
          </div>
        ) : (
          <motion.div
            key={JSON.stringify(stats)}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            {/* Grid of KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpis.map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <GlassCard key={idx} hoverable={true} className="p-6 relative overflow-hidden border border-white/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.title}</span>
                        <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
                          <CountUp value={kpi.value} suffix={kpi.suffix || ''} />
                        </h3>
                      </div>
                      <div className={`h-9 w-9 rounded-lg border flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            {/* Distribution Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Card */}
              <GlassCard hoverable={false} className="p-6 lg:col-span-2 border border-white/5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Activity className="h-4.5 w-4.5 text-[#6E6EF6]" />
                    Asset Distribution Status
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={stats.statusDistribution}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            background: 'rgba(20, 20, 25, 0.9)', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '11px'
                          }} 
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1000}>
                          {stats.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors[entry.name] || '#6E6EF6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </GlassCard>

              {/* Status Mini Summary Card */}
              <GlassCard hoverable={false} className="p-6 border border-white/5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <LayoutDashboard className="h-4.5 w-4.5 text-[#6E6EF6]" />
                    Fleet Status Summary
                  </h3>
                  <div className="space-y-4">
                    {stats.statusDistribution.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ 
                              backgroundColor: chartColors[item.name] || '#6E6EF6',
                              boxShadow: `0 0 6px ${chartColors[item.name] || '#6E6EF6'}`
                            }}
                          />
                          <span className="font-semibold text-slate-300">{item.name}</span>
                        </div>
                        <span className="font-mono font-bold text-white text-sm">{item.value} Assets</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mt-4">
                  Aggregations filtered for: Type {filterType} | Region {filterRegion}
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
