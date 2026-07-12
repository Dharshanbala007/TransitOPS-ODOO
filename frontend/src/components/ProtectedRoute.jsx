import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppShell from './AppShell';
import { ShieldAlert } from 'lucide-react';
import GlassCard from './GlassCard';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-brand-dark">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent-cyan" />
          <div className="absolute h-10 w-10 rounded-full bg-brand-navy border border-brand-border" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <GlassCard hoverable={false} className="p-8 max-w-md text-center border-red-500/20 shadow-[0_0_25px_rgba(239,68,68,0.1)]">
            <div className="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
              <ShieldAlert className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400 mb-6">
              Your account role does not have authorization to view this module. If you believe this is an error, please contact your administrator.
            </p>
            <div className="text-xs font-mono text-slate-500 bg-black/20 p-2.5 rounded-lg border border-brand-border">
              Required: {allowedRoles.join(' or ')}
            </div>
          </GlassCard>
        </div>
      </AppShell>
    );
  }

  return <AppShell>{children}</AppShell>;
}
