import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import PillBadge from '../components/PillBadge';
import PrimaryButton from '../components/PrimaryButton';
import { 
  BarChart3, 
  Download, 
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Layers,
  Fuel,
  Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Reports() {
  const { token } = useAuth();
  const [performance, setPerformance] = useState([]);
  const [totals, setTotals] = useState({
    totalFuelCost: 0,
    totalMaintenanceCost: 0,
    overallUtilization: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceReport();
  }, []);

  const fetchPerformanceReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/reports/vehicle-performance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPerformance(data.performance);
        setTotals(data.totals);
      }
    } catch (err) {
      console.error('Fetch performance report failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Convert array to CSV and trigger file download
  const handleExportCSV = () => {
    if (performance.length === 0) return;

    // Headers
    const headers = [
      'Registration No',
      'Vehicle Type',
      'Acquisition Cost ($)',
      'Total Revenue ($)',
      'Fuel Cost ($)',
      'Maintenance Cost ($)',
      'Misc Expense Cost ($)',
      'Operational Cost ($)',
      'Fuel Efficiency (km/L)',
      'ROI (%)'
    ];

    // Rows
    const rows = performance.map(v => [
      v.reg_no,
      v.type,
      v.acquisition_cost,
      v.revenue,
      v.fuel_cost,
      v.maintenance_cost,
      v.expense_cost,
      v.operational_cost,
      v.fuel_efficiency.toFixed(2),
      v.roi.toFixed(2)
    ]);

    // Build CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    // Create download element
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TransitOps_Fleet_Performance_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">
            Reports & <span style={{ color: 'var(--accent)' }}>Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Aggregated operational reports, fuel efficiencies, and return on investment audits.</p>
        </div>
        <PrimaryButton onClick={handleExportCSV} disabled={performance.length === 0} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider">
          <Download className="h-4.5 w-4.5 mr-1" />
          <span>Export CSV</span>
        </PrimaryButton>
      </div>

      {/* Fleet Overview Metrics Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard hoverable={false} className="p-5 border border-white/5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Fuel className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Fleet Fuel Expense</span>
            <h3 className="text-xl font-bold text-white mt-0.5">${totals.totalFuelCost.toLocaleString()}</h3>
          </div>
        </GlassCard>

        <GlassCard hoverable={false} className="p-5 border border-white/5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Fleet Maintenance Expense</span>
            <h3 className="text-xl font-bold text-white mt-0.5">${totals.totalMaintenanceCost.toLocaleString()}</h3>
          </div>
        </GlassCard>

        <GlassCard hoverable={false} className="p-5 border border-white/5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overall Fleet Utilization</span>
            <h3 className="text-xl font-bold text-white mt-0.5">{totals.overallUtilization.toFixed(1)}%</h3>
          </div>
        </GlassCard>
      </div>

      {/* Main Reports Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6E6EF6]" />
        </div>
      ) : performance.length === 0 ? (
        <GlassCard hoverable={false} className="p-12 text-center border border-white/5">
          <HelpCircle className="h-10 w-10 text-slate-600 mx-auto mb-4" />
          <h3 className="text-base font-bold text-white mb-1">No Operational Data Found</h3>
          <p className="text-xs text-slate-400">Register assets and complete trips to populate operational performance reports.</p>
        </GlassCard>
      ) : (
        <GlassCard hoverable={false} className="overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-4 px-6">Vehicle</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Acquisition Cost</th>
                  <th className="py-4 px-6">Total Revenue</th>
                  <th className="py-4 px-6">Operational Cost</th>
                  <th className="py-4 px-6">Fuel Efficiency</th>
                  <th className="py-4 px-6 text-right">ROI %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                <AnimatePresence>
                  {performance.map((v, index) => {
                    const isPositiveRoi = v.roi >= 0;
                    return (
                      <motion.tr 
                        key={v.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="hover:bg-white/[0.01] transition-colors"
                      >
                        <td className="py-4 px-6 font-mono font-bold text-white tracking-wider">{v.reg_no}</td>
                        <td className="py-4 px-6">{v.type}</td>
                        <td className="py-4 px-6">${v.acquisition_cost.toLocaleString()}</td>
                        <td className="py-4 px-6 font-medium text-slate-200">${v.revenue.toLocaleString()}</td>
                        <td className="py-4 px-6 text-red-300">${v.operational_cost.toLocaleString()}</td>
                        <td className="py-4 px-6 font-mono text-slate-400">
                          {v.fuel_efficiency > 0 ? `${v.fuel_efficiency.toFixed(2)} km/L` : <span className="text-slate-600">—</span>}
                        </td>
                        <td className={`py-4 px-6 text-right font-mono font-bold ${isPositiveRoi ? 'text-[#34d399]' : 'text-red-400'}`}>
                          <span className="inline-flex items-center gap-1.5 justify-end">
                            {isPositiveRoi ? (
                              <TrendingUp className="h-3.5 w-3.5" style={{ filter: 'drop-shadow(0 0 3px rgba(52,211,153,0.4))' }} />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5" style={{ filter: 'drop-shadow(0 0 3px rgba(248,113,113,0.4))' }} />
                            )}
                            {v.roi.toFixed(1)}%
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
