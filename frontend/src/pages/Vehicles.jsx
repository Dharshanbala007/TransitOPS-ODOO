import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import PillBadge from '../components/PillBadge';
import PrimaryButton from '../components/PrimaryButton';
import GhostButton from '../components/GhostButton';
import Modal from '../components/Modal';
import { 
  Car, 
  Search, 
  SlidersHorizontal, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertCircle,
  HelpCircle,
  Compass,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Vehicles() {
  const { token, user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState(null);
  
  // Form state
  const [regNo, setRegNo] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Van');
  const [maxLoad, setMaxLoad] = useState('');
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [region, setRegion] = useState('North');
  const [status, setStatus] = useState('Available');
  
  const [formError, setFormError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);

  // Radar mock coordinate drifts
  const [radarTargets, setRadarTargets] = useState([
    { name: 'VAN-05', x: 42, y: 35, status: 'Available' },
    { name: 'TRK-12', x: 68, y: 55, status: 'Available' },
    { name: 'TRK-09', x: 25, y: 72, status: 'In Shop' }
  ]);

  const isManager = user?.role === 'FleetManager';

  useEffect(() => {
    fetchVehicles();
    
    // Simulate slight coordinate movement for radar sweep realism
    const interval = setInterval(() => {
      setRadarTargets(prev => prev.map(t => ({
        ...t,
        x: Math.max(15, Math.min(85, t.x + (Math.random() - 0.5) * 2)),
        y: Math.max(15, Math.min(85, t.y + (Math.random() - 0.5) * 2))
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/vehicles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error('Fetch vehicles failed:', err);
    } finally {
      setLoading(false);
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

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      reg_no: regNo,
      name,
      type,
      max_load_kg: parseFloat(maxLoad),
      odometer_km: parseFloat(odometer),
      acquisition_cost: parseFloat(cost),
      status,
      region
    };

    try {
      const res = await fetch('http://localhost:5000/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add vehicle');
      }

      showToast(`Vehicle ${data.reg_no} registered successfully.`);
      setIsAddOpen(false);
      resetForm();
      fetchVehicles();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleEditClick = (v) => {
    setActiveVehicle(v);
    setRegNo(v.reg_no);
    setName(v.name);
    setType(v.type);
    setMaxLoad(v.max_load_kg);
    setOdometer(v.odometer_km);
    setCost(v.acquisition_cost);
    setRegion(v.region);
    setStatus(v.status);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      reg_no: regNo,
      name,
      type,
      max_load_kg: parseFloat(maxLoad),
      odometer_km: parseFloat(odometer),
      acquisition_cost: parseFloat(cost),
      status,
      region
    };

    try {
      const res = await fetch(`http://localhost:5000/api/vehicles/${activeVehicle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update vehicle');
      }

      showToast(`Vehicle ${data.reg_no} updated successfully.`);
      setIsEditOpen(false);
      resetForm();
      fetchVehicles();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleRetire = async (id, regNo) => {
    if (!window.confirm(`Are you sure you want to retire vehicle ${regNo}? This marks its status as Retired.`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/vehicles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to retire vehicle');
      }

      showToast(`Vehicle ${regNo} retired successfully.`);
      fetchVehicles();
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setRegNo('');
    setName('');
    setType('Van');
    setMaxLoad('');
    setOdometer('');
    setCost('');
    setRegion('North');
    setStatus('Available');
    setActiveVehicle(null);
    setFormError(null);
  };

  // Search & Filter Logic
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.reg_no.toLowerCase().includes(search.toLowerCase()) || 
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.region.toLowerCase().includes(search.toLowerCase());
      
    const matchesType = filterType === 'All' || v.type === filterType;
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus;
    const matchesRegion = filterRegion === 'All' || v.region === filterRegion;

    return matchesSearch && matchesType && matchesStatus && matchesRegion;
  });

  return (
    <div className="space-y-6">
      {/* Title + Action Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">
            Vehicle <span style={{ color: 'var(--accent)' }}>Registry</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Register new vehicles, manage statuses, and allocate operational regions.</p>
        </div>
        {isManager && (
          <PrimaryButton onClick={() => { resetForm(); setIsAddOpen(true); }} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider">
            <Plus className="h-4.5 w-4.5" />
            <span>Add Vehicle</span>
          </PrimaryButton>
        )}
      </div>

      {/* Success Notification */}
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

      {/* Stunning Grid Layout: Radar Scan + Filter/Table split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fleet Radar Widget Card (Left Column) */}
        <div className="lg:col-span-1 h-full">
          <div 
            className="p-6 border border-white/10 flex flex-col items-center justify-between h-full relative overflow-hidden"
            style={{
              background: 'var(--glass-fill)',
              backdropFilter: 'blur(28px) saturate(140%)',
              WebkitBackdropFilter: 'blur(28px) saturate(140%)',
              borderRadius: '24px',
              boxShadow: '0 8px 32px var(--shadow-ambient), inset 0 1px 0 var(--glass-highlight)',
              minHeight: '380px'
            }}
          >
            {/* Widget header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/5 mb-4 shrink-0">
              <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Radio className="h-4 w-4 text-[#6E6EF6]" />
                Fleet Telemetry
              </span>
              <span className="flex items-center gap-1 text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">
                SWEEP RUNNING
              </span>
            </div>

            {/* Radar Scope */}
            <div className="relative w-44 h-44 rounded-full border border-white/10 flex items-center justify-center bg-black/40 overflow-hidden shrink-0">
              {/* Sweep Line */}
              <div 
                className="absolute inset-0 origin-center animate-radar-sweep pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 50%, rgba(110, 110, 246, 0.25) 100%)'
                }}
              />

              {/* Concentric Grid Rings */}
              <div className="absolute w-[80%] h-[80%] rounded-full border border-white/5" />
              <div className="absolute w-[60%] h-[60%] rounded-full border border-white/5" />
              <div className="absolute w-[40%] h-[40%] rounded-full border border-white/5" />
              
              {/* Grid Crosshairs */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-[1px] bg-white/5" />
                <div className="h-full w-[1px] bg-white/5 absolute" />
              </div>

              {/* Radar targets */}
              {radarTargets.map((target, idx) => (
                <div 
                  key={idx}
                  className="absolute pointer-events-none"
                  style={{ left: `${target.x}%`, top: `${target.y}%` }}
                >
                  {/* Glowing Radar Target dot */}
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-4 h-4 rounded-full bg-[#6E6EF6]/30 animate-radar-pulse" />
                    <span className="w-2 h-2 rounded-full bg-[#6E6EF6]" />
                    <span className="absolute left-3 text-[7.5px] font-mono font-bold text-slate-400 bg-black/60 px-1 py-0.5 rounded border border-white/10">
                      {target.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Target telemetry stats */}
            <div className="w-full mt-6 space-y-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider pt-3 border-t border-white/5 shrink-0">
              <div className="flex justify-between items-center text-slate-500">
                <span>Signal Strength</span>
                <span className="text-white font-mono">98.4%</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Active Trackers</span>
                <span className="text-white font-mono">3 / 3</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Region Hub</span>
                <span className="text-[#6E6EF6] font-mono">NORTH-01</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table & Filters (Right Columns) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters card */}
          <GlassCard hoverable={false} className="p-4 border border-white/5">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search bar */}
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by reg no, name, region..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="glass-input w-full pl-11 pr-4 py-2.5 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 w-full justify-between lg:justify-end">
                <div className="flex items-center gap-2 text-slate-400 text-[9px] uppercase font-bold tracking-widest">
                  <SlidersHorizontal className="h-4 w-4 text-[#6E6EF6]" />
                  <span>Filters</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-transparent border border-white/10 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-[#6E6EF6]/40 transition-all font-medium"
                    style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)' }}
                  >
                    <option value="All" className="bg-[#121214]">All Types</option>
                    <option value="Van" className="bg-[#121214]">Vans</option>
                    <option value="Truck" className="bg-[#121214]">Trucks</option>
                    <option value="Sedan" className="bg-[#121214]">Sedans</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-transparent border border-white/10 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-[#6E6EF6]/40 transition-all font-medium"
                    style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)' }}
                  >
                    <option value="All" className="bg-[#121214]">All Statuses</option>
                    <option value="Available" className="bg-[#121214]">Available</option>
                    <option value="On Trip" className="bg-[#121214]">On Trip</option>
                    <option value="In Shop" className="bg-[#121214]">In Shop</option>
                    <option value="Retired" className="bg-[#121214]">Retired</option>
                  </select>

                  <select
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                    className="bg-transparent border border-white/10 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-[#6E6EF6]/40 transition-all font-medium"
                    style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)' }}
                  >
                    <option value="All" className="bg-[#121214]">All Regions</option>
                    <option value="North" className="bg-[#121214]">North</option>
                    <option value="South" className="bg-[#121214]">South</option>
                    <option value="East" className="bg-[#121214]">East</option>
                    <option value="West" className="bg-[#121214]">West</option>
                  </select>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Vehicles table */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6E6EF6]" />
            </div>
          ) : filteredVehicles.length === 0 ? (
            <GlassCard hoverable={false} className="p-12 text-center border border-white/5">
              <HelpCircle className="h-10 w-10 text-slate-600 mx-auto mb-4" />
              <h3 className="text-base font-bold text-white mb-1">No Vehicles Registered</h3>
              <p className="text-xs text-slate-400">Try adjusting your filters or add a new vehicle entry.</p>
            </GlassCard>
          ) : (
            <GlassCard hoverable={false} className="overflow-hidden border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="py-4 px-6">Reg No</th>
                      <th className="py-4 px-6">Name</th>
                      <th className="py-4 px-6">Type</th>
                      <th className="py-4 px-6">Max Load</th>
                      <th className="py-4 px-6">Odometer</th>
                      <th className="py-4 px-6">Cost</th>
                      <th className="py-4 px-6">Region</th>
                      <th className="py-4 px-6">Status</th>
                      {isManager && <th className="py-4 px-6 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    <AnimatePresence>
                      {filteredVehicles.map((v, index) => (
                        <motion.tr 
                          key={v.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className="hover:bg-white/[0.01] transition-colors"
                        >
                          <td className="py-4 px-6 font-mono font-bold text-white tracking-wider">{v.reg_no}</td>
                          <td className="py-4 px-6 font-medium text-slate-200">{v.name}</td>
                          <td className="py-4 px-6">{v.type}</td>
                          <td className="py-4 px-6">{v.max_load_kg.toLocaleString()} kg</td>
                          <td className="py-4 px-6">{v.odometer_km.toLocaleString()} km</td>
                          <td className="py-4 px-6">${v.acquisition_cost.toLocaleString()}</td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold text-slate-400">
                              {v.region}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <PillBadge status={v.status} />
                          </td>
                          {isManager && (
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEditClick(v)}
                                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer"
                                  title="Edit Vehicle"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleRetire(v.id, v.reg_no)}
                                  disabled={v.status === 'On Trip' || v.status === 'Retired'}
                                  className={`p-1.5 rounded-full transition-all duration-300 ${
                                    v.status === 'On Trip' || v.status === 'Retired' 
                                      ? 'text-slate-600 cursor-not-allowed opacity-30' 
                                      : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer'
                                  }`}
                                  title={v.status === 'On Trip' ? 'Cannot retire while On Trip' : v.status === 'Retired' ? 'Already Retired' : 'Retire Vehicle'}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
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

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register Vehicle Asset"
        layoutId="add-vehicle"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Registration No *</label>
              <input
                type="text"
                required
                placeholder="e.g. VAN-05"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vehicle Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              >
                <option value="Van" className="bg-[#121214]">Van</option>
                <option value="Truck" className="bg-[#121214]">Truck</option>
                <option value="Sedan" className="bg-[#121214]">Sedan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vehicle Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ford Transit Cargo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full text-xs py-2.5 px-3"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Max Load (kg) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="1500"
                value={maxLoad}
                onChange={(e) => setMaxLoad(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Odometer (km) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="42000"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cost ($) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="32000"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              >
                <option value="North" className="bg-[#121214]">North</option>
                <option value="South" className="bg-[#121214]">South</option>
                <option value="East" className="bg-[#121214]">East</option>
                <option value="West" className="bg-[#121214]">West</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              >
                <option value="Available" className="bg-[#121214]">Available</option>
                <option value="In Shop" className="bg-[#121214]">In Shop</option>
                <option value="Retired" className="bg-[#121214]">Retired</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <GhostButton onClick={() => setIsAddOpen(false)}>Cancel</GhostButton>
            <PrimaryButton type="submit">Register Vehicle</PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Vehicle: ${activeVehicle?.reg_no}`}
        layoutId="edit-vehicle"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Registration No *</label>
              <input
                type="text"
                required
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vehicle Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              >
                <option value="Van" className="bg-[#121214]">Van</option>
                <option value="Truck" className="bg-[#121214]">Truck</option>
                <option value="Sedan" className="bg-[#121214]">Sedan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vehicle Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full text-xs py-2.5 px-3"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Max Load (kg) *</label>
              <input
                type="number"
                required
                min="0"
                value={maxLoad}
                onChange={(e) => setMaxLoad(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Odometer (km) *</label>
              <input
                type="number"
                required
                min="0"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cost ($) *</label>
              <input
                type="number"
                required
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              >
                <option value="North" className="bg-[#121214]">North</option>
                <option value="South" className="bg-[#121214]">South</option>
                <option value="East" className="bg-[#121214]">East</option>
                <option value="West" className="bg-[#121214]">West</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={activeVehicle?.status === 'On Trip'}
                className={`glass-input w-full text-xs py-2.5 px-3 ${activeVehicle?.status === 'On Trip' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {activeVehicle?.status === 'On Trip' ? (
                  <option value="On Trip" className="bg-[#121214]">On Trip</option>
                ) : (
                  <>
                    <option value="Available" className="bg-[#121214]">Available</option>
                    <option value="In Shop" className="bg-[#121214]">In Shop</option>
                    <option value="Retired" className="bg-[#121214]">Retired</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <GhostButton onClick={() => setIsEditOpen(false)}>Cancel</GhostButton>
            <PrimaryButton type="submit">Save Changes</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
