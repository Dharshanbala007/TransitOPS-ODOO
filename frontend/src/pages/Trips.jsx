import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import PillBadge from '../components/PillBadge';
import PrimaryButton from '../components/PrimaryButton';
import GhostButton from '../components/GhostButton';
import Modal from '../components/Modal';
import { 
  Route, 
  Search, 
  SlidersHorizontal, 
  Plus, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Activity,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Trips() {
  const { token, user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [eligibleVehicles, setEligibleVehicles] = useState([]);
  const [eligibleDrivers, setEligibleDrivers] = useState([]);
  
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [activeTrip, setActiveTrip] = useState(null);

  // Create Form State
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');
  const [revenue, setRevenue] = useState('');

  // Complete Form State
  const [finalOdometer, setFinalOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');

  const [formError, setFormError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/trips', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
      }
    } catch (err) {
      console.error('Fetch trips failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleOptions = async () => {
    try {
      const [resVehicles, resDrivers] = await Promise.all([
        fetch('http://localhost:5000/api/trips/eligible-vehicles', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/trips/eligible-drivers', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (resVehicles.ok) {
        const vData = await resVehicles.json();
        setEligibleVehicles(vData);
      }
      if (resDrivers.ok) {
        const dData = await resDrivers.json();
        setEligibleDrivers(dData);
      }
    } catch (err) {
      console.error('Fetch eligible dropdown options failed:', err);
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

  const handleOpenCreateModal = async () => {
    setFormError(null);
    setSource('');
    setDestination('');
    setVehicleId('');
    setDriverId('');
    setCargoWeight('');
    setPlannedDistance('');
    setRevenue('');
    
    // Fetch pre-filtered options
    await fetchEligibleOptions();
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      source,
      destination,
      vehicle_id: parseInt(vehicleId),
      driver_id: parseInt(driverId),
      cargo_weight_kg: parseFloat(cargoWeight),
      planned_distance_km: parseFloat(plannedDistance),
      revenue: parseFloat(revenue)
    };

    try {
      const res = await fetch('http://localhost:5000/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create trip');
      }

      showToast(`Trip from ${data.source} to ${data.destination} created in Draft status.`);
      setIsCreateOpen(false);
      fetchTrips();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDispatch = async (tripId) => {
    setFormError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/trips/${tripId}/dispatch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Dispatch failed');
      }
      showToast('Trip dispatched successfully. Vehicle and driver status updated to On Trip.');
      fetchTrips();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenCompleteModal = (trip) => {
    setActiveTrip(trip);
    setFinalOdometer('');
    setFuelConsumed('');
    setFormError(null);
    setIsCompleteOpen(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      final_odometer_km: parseFloat(finalOdometer),
      fuel_consumed_l: parseFloat(fuelConsumed)
    };

    try {
      const res = await fetch(`http://localhost:5000/api/trips/${activeTrip.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Completion failed');
      }
      showToast('Trip completed. Vehicle and driver released. Fuel log created.');
      setIsCompleteOpen(false);
      fetchTrips();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleCancel = async (tripId) => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) {
      return;
    }
    setFormError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/trips/${tripId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cancellation failed');
      }
      showToast('Trip cancelled successfully.');
      fetchTrips();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Filter Logic
  const filteredTrips = trips.filter(t => {
    const matchesSearch = 
      t.source.toLowerCase().includes(search.toLowerCase()) || 
      t.destination.toLowerCase().includes(search.toLowerCase()) ||
      t.vehicle.reg_no.toLowerCase().includes(search.toLowerCase()) ||
      t.driver.name.toLowerCase().includes(search.toLowerCase());
      
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const totalRevenue = trips
    .filter(t => t.status === 'Completed')
    .reduce((sum, t) => sum + t.revenue, 0);

  const activeTripsCount = trips.filter(t => t.status === 'Dispatched').length;
  const draftTripsCount = trips.filter(t => t.status === 'Draft').length;

  return (
    <div className="space-y-6">
      {/* Title + Action Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">
            Trip <span style={{ color: 'var(--accent)' }}>Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Dispatch vehicle trips, complete routes, log telemetry, and track lifecycle status.</p>
        </div>
        <PrimaryButton onClick={handleOpenCreateModal} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider">
          <Plus className="h-4.5 w-4.5" />
          <span>Create Trip</span>
        </PrimaryButton>
      </div>

      {/* API Notifications */}
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
        
        {/* Left Column: Diagnostics Summary */}
        <div className="lg:col-span-1 space-y-4">
          <div 
            className="p-6 border border-white/10 flex flex-col justify-between h-full relative overflow-hidden"
            style={{
              background: 'var(--glass-fill)',
              backdropFilter: 'blur(28px) saturate(140%)',
              WebkitBackdropFilter: 'blur(28px) saturate(140%)',
              borderRadius: '24px',
              boxShadow: '0 8px 32px var(--shadow-ambient), inset 0 1px 0 var(--glass-highlight)',
              minHeight: '380px'
            }}
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/5 mb-6">
              <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Route className="h-4 w-4 text-[#6E6EF6]" />
                Lifecycle Diagnostics
              </span>
            </div>

            <div className="space-y-6 flex-1 flex flex-col justify-center">
              {/* Stat 1 */}
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Dispatches</span>
                  <h3 className="text-xl font-bold text-white mt-0.5">{activeTripsCount} Trips</h3>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed Revenue</span>
                  <h3 className="text-xl font-bold text-white mt-0.5">${totalRevenue.toLocaleString()}</h3>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-[#c084fc]/10 border border-[#c084fc]/20 flex items-center justify-center text-[#c084fc]">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Dispatch (Draft)</span>
                  <h3 className="text-xl font-bold text-white mt-0.5">{draftTripsCount} Drafts</h3>
                </div>
              </div>
            </div>

            <div className="w-full mt-6 text-[8px] font-mono text-slate-500 uppercase tracking-wider pt-3 border-t border-white/5">
              Updates in real-time on status change transitions
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
                  placeholder="Search by locations, vehicle, driver..."
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
                  <option value="All" className="bg-[#121214]">All Statuses</option>
                  <option value="Draft" className="bg-[#121214]">Draft</option>
                  <option value="Dispatched" className="bg-[#121214]">Dispatched</option>
                  <option value="Completed" className="bg-[#121214]">Completed</option>
                  <option value="Cancelled" className="bg-[#121214]">Cancelled</option>
                </select>
              </div>
            </div>
          </GlassCard>

          {/* Trips Table */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6E6EF6]" />
            </div>
          ) : filteredTrips.length === 0 ? (
            <GlassCard hoverable={false} className="p-12 text-center border border-white/5">
              <HelpCircle className="h-10 w-10 text-slate-600 mx-auto mb-4" />
              <h3 className="text-base font-bold text-white mb-1">No Trips Registered</h3>
              <p className="text-xs text-slate-400">Try adjusting your filters or create a new trip lifecycle.</p>
            </GlassCard>
          ) : (
            <GlassCard hoverable={false} className="overflow-hidden border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="py-4 px-6">Route</th>
                      <th className="py-4 px-6">Vehicle</th>
                      <th className="py-4 px-6">Driver</th>
                      <th className="py-4 px-6">Cargo</th>
                      <th className="py-4 px-6">Distance</th>
                      <th className="py-4 px-6">Revenue</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    <AnimatePresence>
                      {filteredTrips.map((t, index) => (
                        <motion.tr 
                          key={t.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className="hover:bg-white/[0.01] transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="font-semibold text-white">{t.source}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">to {t.destination}</div>
                          </td>
                          <td className="py-4 px-6 font-mono font-bold text-[#6E6EF6]">{t.vehicle.reg_no}</td>
                          <td className="py-4 px-6 font-medium text-slate-200">{t.driver.name}</td>
                          <td className="py-4 px-6">{t.cargo_weight_kg.toLocaleString()} kg</td>
                          <td className="py-4 px-6">{t.planned_distance_km.toLocaleString()} km</td>
                          <td className="py-4 px-6">${t.revenue.toLocaleString()}</td>
                          <td className="py-4 px-6">
                            <PillBadge status={t.status} />
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-2">
                              {t.status === 'Draft' && (
                                <>
                                  <button
                                    onClick={() => handleDispatch(t.id)}
                                    className="px-2.5 py-1 text-[10px] font-bold text-white bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/25 transition-all duration-300 cursor-pointer uppercase tracking-wider"
                                  >
                                    Dispatch
                                  </button>
                                  <button
                                    onClick={() => handleCancel(t.id)}
                                    className="px-2.5 py-1 text-[10px] font-bold text-slate-400 hover:text-red-400 bg-white/5 border border-white/5 rounded-lg hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300 cursor-pointer uppercase tracking-wider"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {t.status === 'Dispatched' && (
                                <>
                                  <button
                                    onClick={() => handleOpenCompleteModal(t)}
                                    className="px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/25 transition-all duration-300 cursor-pointer uppercase tracking-wider"
                                  >
                                    Complete
                                  </button>
                                  <button
                                    onClick={() => handleCancel(t.id)}
                                    className="px-2.5 py-1 text-[10px] font-bold text-slate-400 hover:text-red-400 bg-white/5 border border-white/5 rounded-lg hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300 cursor-pointer uppercase tracking-wider"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {(t.status === 'Completed' || t.status === 'Cancelled') && (
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold px-2 py-1 select-none">
                                  Archived
                                </span>
                              )}
                            </div>
                          </td>
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

      {/* Create Trip Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule & Dispatch Trip"
        layoutId="create-trip"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Origin / Source *</label>
              <input
                type="text"
                required
                placeholder="e.g. Chicago Port"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Destination *</label>
              <input
                type="text"
                required
                placeholder="e.g. New York Hub"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assign Vehicle *</label>
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              >
                <option value="" className="bg-[#121214]">Select Available Vehicle</option>
                {eligibleVehicles.map(v => (
                  <option key={v.id} value={v.id} className="bg-[#121214]">
                    {v.reg_no} - {v.name} (Max Load: {v.max_load_kg}kg)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assign Driver *</label>
              <select
                required
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              >
                <option value="" className="bg-[#121214]">Select Available Driver</option>
                {eligibleDrivers.map(d => (
                  <option key={d.id} value={d.id} className="bg-[#121214]">
                    {d.name} ({d.license_category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cargo Weight (kg) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="450"
                value={cargoWeight}
                onChange={(e) => setCargoWeight(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Distance (km) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="750"
                value={plannedDistance}
                onChange={(e) => setPlannedDistance(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Revenue ($) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="1200"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <GhostButton type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider">
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" className="px-5 py-2 text-xs font-bold uppercase tracking-wider">
              Create Draft
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Complete Trip Modal */}
      <Modal
        isOpen={isCompleteOpen}
        onClose={() => setIsCompleteOpen(false)}
        title="Complete Trip Dispatch"
        layoutId="complete-trip"
      >
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {activeTrip && (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs text-slate-300">
              <div>
                <span className="font-semibold text-slate-400">Route:</span> {activeTrip.source} to {activeTrip.destination}
              </div>
              <div>
                <span className="font-semibold text-slate-400">Vehicle:</span> {activeTrip.vehicle.reg_no} ({activeTrip.vehicle.name})
              </div>
              <div>
                <span className="font-semibold text-slate-400">Starting Odometer:</span> {activeTrip.vehicle.odometer_km} km
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Final Odometer (km) *</label>
            <input
              type="number"
              required
              min="0"
              placeholder="e.g. 42850"
              value={finalOdometer}
              onChange={(e) => setFinalOdometer(e.target.value)}
              className="glass-input w-full text-xs py-2.5 px-3"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fuel Consumed (liters) *</label>
            <input
              type="number"
              required
              min="0"
              placeholder="e.g. 120"
              value={fuelConsumed}
              onChange={(e) => setFuelConsumed(e.target.value)}
              className="glass-input w-full text-xs py-2.5 px-3"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <GhostButton type="button" onClick={() => setIsCompleteOpen(false)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider">
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" className="px-5 py-2 text-xs font-bold uppercase tracking-wider">
              Complete Dispatch
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
