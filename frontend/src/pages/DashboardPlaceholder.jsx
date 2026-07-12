import React from 'react';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import { 
  Car, 
  Users, 
  ArrowRight,
  Sparkles,
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useNavigate as useNav } from 'react-router-dom';

export default function DashboardPlaceholder() {
  const { user } = useAuth();
  const navigate = useNav();

  const cards = [
    {
      title: 'Vehicle Registry',
      desc: 'Manage fleet assets, monitor active trucks, configure loads, and track vehicle status.',
      path: '/vehicles',
      icon: Car,
      color: 'text-[#6E6EF6]',
      roles: ['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst']
    },
    {
      title: 'Driver Profiles',
      desc: 'Track licenses, monitor safety scores, view categories, and flag license expirations.',
      path: '/drivers',
      icon: Users,
      color: 'text-[#6E6EF6]',
      roles: ['FleetManager', 'SafetyOfficer', 'Driver', 'FinancialAnalyst']
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">
            Welcome back, <span className="accent-gradient-text" style={{ background: 'linear-gradient(to right, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name || 'Operator'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Here is a quick overview of your fleet registry operations today.</p>
        </div>
        <div 
          className="flex items-center gap-2 border px-4 py-2 rounded-xl text-[10px] font-bold text-slate-300 uppercase tracking-widest"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderColor: 'var(--glass-border)',
            boxShadow: 'inset 0 1px 0 var(--glass-highlight)'
          }}
        >
          <Sparkles className="h-4 w-4 text-[#6E6EF6]" />
          <span>System Status: Operational</span>
        </div>
      </div>

      {/* Mini KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard hoverable={true} className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fleet Strength</span>
              <h3 className="text-3xl font-bold text-white mt-2 tracking-tight">5</h3>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">4 ACTIVE | 1 RETIRED</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
        </GlassCard>

        <GlassCard hoverable={true} className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Driver Pool</span>
              <h3 className="text-3xl font-bold text-white mt-2 tracking-tight">4</h3>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">2 AVAILABLE | 1 EXPIRED</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Activity className="h-4.5 w-4.5" />
            </div>
          </div>
        </GlassCard>

        <GlassCard hoverable={true} className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Safety Flags</span>
              <h3 className="text-3xl font-bold text-red-400 mt-2 tracking-tight">2</h3>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">1 SUSPENDED | 1 EXPIRED</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle className="h-4.5 w-4.5" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Feature Cards */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Core Fleet Modules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <GlassCard 
                key={card.title} 
                onClick={() => navigate(card.path)} 
                className="p-6 border border-white/5 hover:border-[#6E6EF6]/30"
              >
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-white tracking-tight">{card.title}</h4>
                      <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-all duration-300" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{card.desc}</p>
                    <div className="mt-4 flex gap-1.5 flex-wrap">
                      <span className="text-[8px] bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/5 font-mono">
                        MEMBER 1
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
