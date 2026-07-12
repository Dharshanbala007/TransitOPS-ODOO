import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  Route, 
  Wrench, 
  Fuel, 
  BarChart3, 
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Activity,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Vehicle Registry', path: '/vehicles', icon: Car },
    { name: 'Driver Management', path: '/drivers', icon: Users },
    { name: 'Trip Management', path: '/trips', icon: Route },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Fuel & Expenses', path: '/expenses', icon: Fuel, placeholder: true },
    { name: 'Reports', path: '/reports', icon: BarChart3, placeholder: true },
  ];

  const formatRole = (role) => {
    switch (role) {
      case 'FleetManager': return 'Fleet Manager';
      case 'Driver': return 'Driver';
      case 'SafetyOfficer': return 'Safety Officer';
      case 'FinancialAnalyst': return 'Financial Analyst';
      default: return role;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden p-4 gap-4 bg-transparent relative z-10">
      
      {/* Left Sidebar - Stacked Glass Modules */}
      <div className="w-64 flex flex-col gap-4 shrink-0 h-full bg-transparent">
        
        {/* Module 1: Brand Logo */}
        <div 
          className="h-18 flex items-center gap-3 px-5 py-4 border border-white/10"
          style={{
            background: 'var(--glass-fill)',
            backdropFilter: 'blur(28px) saturate(140%)',
            WebkitBackdropFilter: 'blur(28px) saturate(140%)',
            borderRadius: '20px',
            boxShadow: '0 8px 24px var(--shadow-ambient), inset 0 1px 0 var(--glass-highlight)'
          }}
        >
          <div className="h-9 w-9 rounded-xl flex items-center justify-center border border-white/15 bg-white/5" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }}>
            <Car className="h-5 w-5 text-[#6E6EF6]" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wider text-white">TransitOps</h1>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">Fleet Console</span>
          </div>
        </div>

        {/* Module 2: Navigation Links */}
        <nav 
          className="flex-1 px-3 py-4 space-y-1 overflow-y-auto border border-white/10"
          style={{
            background: 'var(--glass-fill)',
            backdropFilter: 'blur(28px) saturate(140%)',
            WebkitBackdropFilter: 'blur(28px) saturate(140%)',
            borderRadius: '24px',
            boxShadow: '0 8px 32px var(--shadow-ambient), inset 0 1px 0 var(--glass-highlight)'
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => `
                  relative group flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300
                  ${isActive 
                    ? 'text-white border border-white/10' 
                    : 'text-slate-400 hover:text-white border border-transparent'
                  }
                  ${item.placeholder ? 'opacity-65 hover:opacity-90' : ''}
                `}
                style={isActive ? {
                  background: 'rgba(255, 255, 255, 0.05)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                } : {}}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute left-0 w-1 h-5 rounded-full"
                    style={{ backgroundColor: 'var(--accent)' }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
                
                <item.icon className={`h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-105 ${isActive ? 'text-[#6E6EF6]' : 'text-slate-500'}`} />
                
                <div className="flex-1 flex items-center justify-between">
                  <span>{item.name}</span>
                  {item.placeholder && (
                    <span className="text-[7.5px] bg-white/5 text-slate-400 px-1 py-0.5 rounded border border-white/5 font-mono">
                      Dev
                    </span>
                  )}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Module 3: System Status & User Profile */}
        <div 
          className="p-4 border border-white/10 flex flex-col gap-3"
          style={{
            background: 'var(--glass-fill)',
            backdropFilter: 'blur(28px) saturate(140%)',
            WebkitBackdropFilter: 'blur(28px) saturate(140%)',
            borderRadius: '24px',
            boxShadow: '0 8px 24px var(--shadow-ambient), inset 0 1px 0 var(--glass-highlight)'
          }}
        >
          {/* Active Profile */}
          {user && (
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/5 min-w-0">
              <div className="h-8.5 w-8.5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
                <p className="text-[9px] text-slate-400 truncate">{formatRole(user.role)}</p>
              </div>
            </div>
          )}

          {/* Health Stats */}
          <div className="space-y-2 text-[9px] font-bold text-slate-400 tracking-wider uppercase">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-emerald-400" />
                API PING
              </span>
              <span className="text-emerald-400 font-mono">12ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Database className="h-3 w-3 text-[#6E6EF6]" />
                DATABASE
              </span>
              <span className="text-[#6E6EF6] font-mono">MYSQL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Floating Glass Sheet */}
      <div 
        className="flex-1 flex flex-col min-w-0"
        style={{
          background: 'rgba(255, 255, 255, 0.035)',
          backdropFilter: 'blur(32px) saturate(140%)',
          WebkitBackdropFilter: 'blur(32px) saturate(140%)',
          border: '1px solid var(--glass-border)',
          borderRadius: '28px',
          boxShadow: '0 12px 40px var(--shadow-ambient), inset 0 1px 0 var(--glass-highlight)'
        }}
      >
        {/* Topbar inside sheet */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-[#6E6EF6]" />
            <span className="text-xs text-slate-300">
              Session Profile: <span className="font-semibold text-white">{formatRole(user?.role)}</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[9px] font-bold text-slate-500 hidden md:inline tracking-widest uppercase">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-full hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
