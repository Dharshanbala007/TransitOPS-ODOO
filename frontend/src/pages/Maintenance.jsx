import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import PillBadge from '../components/PillBadge';
import PrimaryButton from '../components/PrimaryButton';
import GhostButton from '../components/GhostButton';
import Modal from '../components/Modal';
import { 
  Wrench, 
  Search, 
  SlidersHorizontal, 
  Plus, 
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Clock,
  Wrench as WrenchIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Maintenance() {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [eligibleVehicles, setEligibleVehicles] = useState([]);
  
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [vehicleId, setVehicleId] = useState('');
  const [type, setType] = useState('Routine');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);

  const isManager = user?.role === 'FleetManager';

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/maintenance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Fetch logs failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleVehicles = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/maintenance/eligible-vehicles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEligibleVehicles(data);
      }
    } catch (err) {
      console.error('Fetch eligible vehicles failed:', err);
    }
  };

  const showToast = (msg, type = 'success') => {
    if (type === 'success') {
      setApiSuccess(msg);
      setTimeout(() => setApiSuccess(null), 4000);
    } else {
      setFormError(msg);
      setTimeout(() => setFormError(null), 4000);
    }
  };

  const handleOpenAddModal = async () => {
    setFormError(null);
    setVehicleId('');
    setType('Routine');
    setCost('');
    setNotes('');
    
    // Fetch pre-filtered options
    await fetchEligibleVehicles();
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      vehicle_id: parseInt(vehicleId),
      type,
      cost: parseFloat(cost),
      notes
    };

    try {
      const res = await fetch('http://localhost:5000/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to open maintenance log');
      }

      showToast(`Maintenance log opened for vehicle ${data.vehicle.reg_no}. Vehicle status updated to In Shop.`);
      setIsAddOpen(false);
      fetchLogs();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleCloseLog = async (logId) => {
    setFormError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/maintenance/${logId}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to close maintenance log');
      }
      showToast(`Maintenance log closed. Vehicle ${data.vehicle.reg_no} is now Available.`);
      fetchLogs();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Filter Logic
  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.type.toLowerCase().includes(search.toLowerCase()) || 
      l.notes.toLowerCase().includes(search.toLowerCase()) ||
      l.vehicle.reg_no.toLowerCase().includes(search.toLowerCase());
      
    const matchesStatus = filterStatus === 'All' || l.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const activeCount = logs.filter(l => l.status === 'Active').length;
  const totalSpent = logs.reduce((sum, l) => sum + l.cost, 0);

  return (
    <div className="space-y-6">
      {/* Title + Action Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">
            Maintenance <span style={{ color: 'var(--accent)' }}>Registry</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Open maintenance entries, log fleet repair costs, and release vehicles back to service.</p>
        </div>
        {isManager && (
          <PrimaryButton onClick={handleOpenAddModal} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider">
            <Plus className="h-4.5 w-4.5" />
            <span>Open Maintenance</span>
          </PrimaryButton>
        )}
      </div>

      {/* Notifications */}
      {apiSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#34d399] text-xs font-semibold flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-ping" />
          {apiSuccess}
        </motion.div>
      )}

      {formError && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          {formError}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Stats */}
        <div className="lg:col-span-1 space-y-4">
          <div 
            className="p-6 border border-white/10 flex flex-col justify-between h-full relative overflow-hidden"
            style={{
              background: 'var(--glass-fill)',
              backdropFilter: 'blur(28px) saturate(140%)',
              WebkitBackdropFilter: 'blur(28px) saturate(140%)',
              borderRadius: '24px',
              boxShadow: '0 8px 32px var(--shadow-ambient), inset 0 1px 0 var(--glass-highlight)',
              minHeight: '340px'
            }}
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/5 mb-6">
              <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Wrench className="h-4 w-4 text-[#6E6EF6]" />
                Fleet Health Telemetry
              </span>
            </div>

            <div className="space-y-6 flex-1 flex flex-col justify-center">
              {/* Active Repairs */}
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vehicles In Shop</span>
                  <h3 className="text-xl font-bold text-white mt-0.5">{activeCount} Active</h3>
                </div>
              </div>

              {/* Total Expenses */}
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <WrenchIcon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Repair Costs</span>
                  <h3 className="text-xl font-bold text-white mt-0.5">${totalSpent.toLocaleString()}</h3>
                </div>
              </div>
            </div>

            <div className="w-full mt-6 text-[8px] font-mono text-slate-500 uppercase tracking-wider pt-3 border-t border-white/5">
              Service logs lock vehicles from dispatch lists
            </div>
          </div>
        </div>

        {/* Right Columns: Filters & Table */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters Card */}
          <GlassCard hoverable={false} className="p-4 border border-white/5">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search bar */}
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by vehicle reg, type, notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="glass-input w-full pl-11 pr-4 py-2.5 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 justify-end ml-auto">
                <SlidersHorizontal className="h-4 w-4 text-[#6E6EF6]" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent border border-white/10 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-[#6E6EF6]/40 transition-all font-medium"
                  style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)' }}
                >
                  <option value="All" className="bg-[#121214]">All Records</option>
                  <option value="Active" className="bg-[#121214]">Active</option>
                  <option value="Closed" className="bg-[#121214]">Closed</option>
                </select>
              </div>
            </div>
          </GlassCard>

          {/* Maintenance Table */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6E6EF6]" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <GlassCard hoverable={false} className="p-12 text-center border border-white/5">
              <HelpCircle className="h-10 w-10 text-slate-600 mx-auto mb-4" />
              <h3 className="text-base font-bold text-white mb-1">No Maintenance Records</h3>
              <p className="text-xs text-slate-400">Try adjusting your filters or open a new service log.</p>
            </GlassCard>
          ) : (
            <GlassCard hoverable={false} className="overflow-hidden border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="py-4 px-6">Vehicle</th>
                      <th className="py-4 px-6">Service Type</th>
                      <th className="py-4 px-6">Opened</th>
                      <th className="py-4 px-6">Closed</th>
                      <th className="py-4 px-6">Cost</th>
                      <th className="py-4 px-6">Notes</th>
                      <th className="py-4 px-6">Status</th>
                      {isManager && <th className="py-4 px-6 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    <AnimatePresence>
                      {filteredLogs.map((l, index) => (
                        <motion.tr 
                          key={l.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className="hover:bg-white/[0.01] transition-colors"
                        >
                          <td className="py-4 px-6 font-mono font-bold text-[#6E6EF6]">{l.vehicle.reg_no}</td>
                          <td className="py-4 px-6 font-medium text-white">{l.type}</td>
                          <td className="py-4 px-6">{new Date(l.opened_date).toLocaleDateString()}</td>
                          <td className="py-4 px-6">
                            {l.closed_date ? new Date(l.closed_date).toLocaleDateString() : <span className="text-slate-500">—</span>}
                          </td>
                          <td className="py-4 px-6">${l.cost.toLocaleString()}</td>
                          <td className="py-4 px-6 max-w-xs truncate" title={l.notes}>{l.notes || <span className="text-slate-500">—</span>}</td>
                          <td className="py-4 px-6">
                            <PillBadge status={l.status === 'Active' ? 'inshop' : 'available'} />
                          </td>
                          {isManager && (
                            <td className="py-4 px-6 text-right">
                              {l.status === 'Active' ? (
                                <button
                                  onClick={() => handleCloseLog(l.id)}
                                  className="px-2.5 py-1 text-[10px] font-bold text-white bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500/25 transition-all duration-300 cursor-pointer uppercase tracking-wider"
                                >
                                  Close
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold px-2 py-1 select-none">
                                  Closed
                                </span>
                              )}
                            </td>
                          )}
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* New Maintenance Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Open Maintenance Entry"
        layoutId="create-maintenance"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Vehicle asset *</label>
            <select
              required
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="glass-input w-full text-xs py-2.5 px-3"
            >
              <option value="" className="bg-[#121214]">Choose Eligible Vehicle</option>
              {eligibleVehicles.map(v => (
                <option key={v.id} value={v.id} className="bg-[#121214]">
                  {v.reg_no} - {v.name} (Current: {v.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Maintenance Type *</label>
              <select
                required
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              >
                <option value="Routine" className="bg-[#121214]">Routine Service</option>
                <option value="Brakes" className="bg-[#121214]">Brake Repairs</option>
                <option value="Engine" className="bg-[#121214]">Engine Repairs</option>
                <option value="Electrical" className="bg-[#121214]">Electrical Fixes</option>
                <option value="Body" className="bg-[#121214]">Body Work</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Est. Cost ($) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 350"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Maintenance Notes / Issues</label>
            <textarea
              rows="3"
              placeholder="e.g. Brake pad wear detected, replacing pads and rotors..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="glass-input w-full text-xs py-2.5 px-3 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <GhostButton type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider">
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" className="px-5 py-2 text-xs font-bold uppercase tracking-wider">
              Open Log
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
