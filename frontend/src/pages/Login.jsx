import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertTriangle, Car } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setError(null);
    setLoading(true);

    try {
      await login(quickEmail, quickPassword);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoUsers = [
    { email: 'manager@transitops.com', pass: 'manager123', label: 'Fleet Manager' },
    { email: 'safety@transitops.com', pass: 'safety123', label: 'Safety Officer' },
    { email: 'driver@transitops.com', pass: 'driver123', label: 'Driver' },
    { email: 'finance@transitops.com', pass: 'finance123', label: 'Finance Analyst' },
  ];

  return (
    <div className="login-page-wrapper min-h-screen w-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-transparent z-10 select-none">
      {/* Scope custom cursor with white sparks exclusively inside the login page wrapper */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md z-10"
      >
        {/* Logo Section */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center border border-white/20 bg-white/5" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}>
            <Car className="h-5.5 w-5.5 text-[#6E6EF6]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-white font-sans">
              Transit<span style={{ color: 'var(--accent)' }}>Ops</span>
            </h1>
            <p className="text-[9px] text-slate-400 tracking-widest uppercase">Fleet Operations</p>
          </div>
        </div>

        {/* Frosted Glass Login Panel */}
        <div 
          className="p-8 relative"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
            backdropFilter: 'blur(36px) saturate(160%)',
            WebkitBackdropFilter: 'blur(36px) saturate(160%)',
            borderRadius: '32px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 24px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.35)'
          }}
        >
          <h2 className="text-lg font-bold text-white mb-6 font-sans">Sign In to Platform</h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 p-3.5 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold"
            >
              <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full pl-12 pr-4 py-3.5 text-sm"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                    borderRadius: '14px'
                  }}
                  placeholder="name@transitops.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-12 pr-4 py-3.5 text-sm"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                    borderRadius: '14px'
                  }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <PrimaryButton
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-4 text-xs font-bold uppercase tracking-wider"
            >
              {loading ? 'Verifying Credentials...' : 'Sign In'}
            </PrimaryButton>
          </form>
        </div>

        {/* Quick Demo Access Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Quick Demo Access</p>
          <div className="grid grid-cols-2 gap-3">
            {demoUsers.map((demo) => (
              <button
                key={demo.label}
                onClick={() => handleQuickLogin(demo.email, demo.pass)}
                disabled={loading}
                className="text-left p-3.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                  borderRadius: '18px'
                }}
              >
                <div className="text-xs font-bold text-[#F5F5F7]">{demo.label}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{demo.email}</div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
