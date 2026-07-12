import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import BackgroundWaves from './components/BackgroundWaves';
import GlassCard from './components/GlassCard';
import { Wrench } from 'lucide-react';

// Simple placeholder page for other members
function ComingSoon({ title, member }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <GlassCard hoverable={false} className="p-8 max-w-md text-center border-brand-border-active/20">
        <div className="mx-auto w-16 h-16 bg-accent-indigo/10 border border-brand-border-active/30 rounded-2xl flex items-center justify-center mb-6">
          <Wrench className="h-8 w-8 text-accent-cyan" style={{ color: 'var(--accent)' }} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-[var(--text-secondary)] mb-6">
          This module is part of the system split and is designated for implementation.
        </p>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#6E6EF6]/10 text-[#6E6EF6] border border-[#6E6EF6]/20 tracking-wide select-none">
          Assigned to: Member {member}
        </span>
      </GlassCard>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Global Wavy Backdrop & Noise Layer */}
        <BackgroundWaves />
        
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/vehicles" 
            element={
              <ProtectedRoute>
                <Vehicles />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/drivers" 
            element={
              <ProtectedRoute>
                <Drivers />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/trips" 
            element={
              <ProtectedRoute>
                <Trips />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/maintenance" 
            element={
              <ProtectedRoute>
                <Maintenance />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/expenses" 
            element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
