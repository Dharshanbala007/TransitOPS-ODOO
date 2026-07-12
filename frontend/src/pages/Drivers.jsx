import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import PillBadge from '../components/PillBadge';
import PrimaryButton from '../components/PrimaryButton';
import GhostButton from '../components/GhostButton';
import Modal from '../components/Modal';
import { 
  Users, 
  Search, 
  SlidersHorizontal, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Star,
  ShieldAlert,
  Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Drivers() {
  const { token, user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeDriver, setActiveDriver] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [licenseCategory, setLicenseCategory] = useState('Standard (Class C)');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [safetyScore, setSafetyScore] = useState('5.0');
  const [status, setStatus] = useState('Available');

  const [formError, setFormError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);

  const canMutate = user?.role === 'FleetManager' || user?.role === 'SafetyOfficer';

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/drivers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDrivers(data);
      }
    } catch (err) {
      console.error('Fetch drivers failed:', err);
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
      name,
      license_no: licenseNo,
      license_category: licenseCategory,
      license_expiry: licenseExpiry,
      contact_number: contactNumber,
      safety_score: parseFloat(safetyScore),
      status
    };

    try {
      const res = await fetch('http://localhost:5000/api/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add driver');
      }

      showToast(`Driver ${data.name} added successfully.`);
      setIsAddOpen(false);
      resetForm();
      fetchDrivers();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleEditClick = (d) => {
    setActiveDriver(d);
    setName(d.name);
    setLicenseNo(d.license_no);
    setLicenseCategory(d.license_category);
    const formattedDate = d.license_expiry ? new Date(d.license_expiry).toISOString().split('T')[0] : '';
    setLicenseExpiry(formattedDate);
    setContactNumber(d.contact_number);
    setSafetyScore(d.safety_score);
    setStatus(d.status);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      name,
      license_no: licenseNo,
      license_category: licenseCategory,
      license_expiry: licenseExpiry,
      contact_number: contactNumber,
      safety_score: parseFloat(safetyScore),
      status
    };

    try {
      const res = await fetch(`http://localhost:5000/api/drivers/${activeDriver.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update driver');
      }

      showToast(`Driver ${data.name} updated successfully.`);
      setIsEditOpen(false);
      resetForm();
      fetchDrivers();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete driver ${name}?`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/drivers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete driver');
      }

      showToast(`Driver ${name} deleted successfully.`);
      fetchDrivers();
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setName('');
    setLicenseNo('');
    setLicenseCategory('Standard (Class C)');
    setLicenseExpiry('');
    setContactNumber('');
    setSafetyScore('5.0');
    setStatus('Available');
    setActiveDriver(null);
    setFormError(null);
  };

  const isLicenseExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  // Calculations for Widgets
  const avgSafetyScore = drivers.length > 0
    ? (drivers.reduce((acc, curr) => acc + curr.safety_score, 0) / drivers.length).toFixed(1)
    : '0.0';

  const expiredLicensesCount = drivers.filter(d => isLicenseExpired(d.license_expiry)).length;
  const suspendedDriversCount = drivers.filter(d => d.status === 'Suspended').length;

  // Search & Filter Logic
  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(search.toLowerCase()) || 
      d.license_no.toLowerCase().includes(search.toLowerCase()) ||
      d.contact_number.includes(search);
      
    const matchesCategory = filterCategory === 'All' || d.license_category === filterCategory;
    const matchesStatus = filterStatus === 'All' || d.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title + Action Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">
            Driver <span style={{ color: 'var(--accent)' }}>Profiles</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage personnel, review certifications, license validation, and safety logs.</p>
        </div>
        {canMutate && (
          <PrimaryButton onClick={() => { resetForm(); setIsAddOpen(true); }} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider">
            <Plus className="h-4.5 w-4.5" />
            <span>Add Driver</span>
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

      {/* Stunning Grid Layout: Safety Gauges + List split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Safety Metrics Gauge Widget (Left Column) */}
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
            {/* Header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/5 mb-6 shrink-0">
              <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <ShieldAlert className="h-4 w-4 text-[#6E6EF6]" />
                Safety Overview
              </span>
              <span className="text-[8px] bg-indigo-500/10 text-accent-indigo border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                AUDIT SECURE
              </span>
            </div>

            {/* Circular score gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              {/* SVG Radial Meter */}
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="72" 
                  cy="72" 
                  r="62" 
                  stroke="rgba(255,255,255,0.05)" 
                  strokeWidth="8" 
                  fill="transparent" 
                />
                <circle 
                  cx="72" 
                  cy="72" 
                  r="62" 
                  stroke="#6E6EF6" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray={389}
                  strokeDashoffset={389 - (389 * (parseFloat(avgSafetyScore) || 0)) / 5.0}
                  strokeLinecap="round"
                  style={{
                    filter: 'drop-shadow(0 0 4px rgba(110, 110, 246, 0.4))',
                    transition: 'stroke-dashoffset 1s ease-in-out'
                  }}
                />
              </svg>
              {/* Inner score reading */}
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold text-white tracking-tight">{avgSafetyScore}</span>
                <span className="text-slate-500 text-[10px] block font-bold uppercase tracking-wider mt-0.5">Fleet Rating</span>
              </div>
            </div>

            {/* Expiry alerts & counts */}
            <div className="w-full mt-6 space-y-3 text-[9px] font-bold tracking-wider uppercase pt-4 border-t border-white/5 shrink-0">
              <div className="flex justify-between items-center text-slate-500">
                <span>Total Drivers</span>
                <span className="text-white font-mono">{drivers.length}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>License Expired Flags</span>
                <span className={`${expiredLicensesCount > 0 ? 'text-red-400' : 'text-slate-400'} font-mono`}>
                  {expiredLicensesCount}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Suspended Profiles</span>
                <span className={`${suspendedDriversCount > 0 ? 'text-red-400' : 'text-slate-400'} font-mono`}>
                  {suspendedDriversCount}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Table & Filters (Right Columns) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters */}
          <GlassCard hoverable={false} className="p-4 border border-white/5">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search bar */}
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name, license no, phone..."
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
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-transparent border border-white/10 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-[#6E6EF6]/40 transition-all font-medium"
                    style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)' }}
                  >
                    <option value="All" className="bg-[#121214]">All Categories</option>
                    <option value="Heavy Truck (Class A)" className="bg-[#121214]">Heavy Truck (Class A)</option>
                    <option value="Commercial (Class B)" className="bg-[#121214]">Commercial (Class B)</option>
                    <option value="Standard (Class C)" className="bg-[#121214]">Standard (Class C)</option>
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
                    <option value="Off Duty" className="bg-[#121214]">Off Duty</option>
                    <option value="Suspended" className="bg-[#121214]">Suspended</option>
                  </select>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Drivers Table */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6E6EF6]" />
            </div>
          ) : filteredDrivers.length === 0 ? (
            <GlassCard hoverable={false} className="p-12 text-center border border-white/5">
              <HelpCircle className="h-10 w-10 text-slate-600 mx-auto mb-4" />
              <h3 className="text-base font-bold text-white mb-1">No Drivers Registered</h3>
              <p className="text-xs text-slate-400">Try adjusting your filters or add a new driver profile.</p>
            </GlassCard>
          ) : (
            <GlassCard hoverable={false} className="overflow-hidden border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="py-4 px-6">Driver Name</th>
                      <th className="py-4 px-6">License Details</th>
                      <th className="py-4 px-6">Expiry Date</th>
                      <th className="py-4 px-6">Contact Info</th>
                      <th className="py-4 px-6">Safety Score</th>
                      <th className="py-4 px-6">Status</th>
                      {canMutate && <th className="py-4 px-6 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    <AnimatePresence>
                      {filteredDrivers.map((d, index) => {
                        const expired = isLicenseExpired(d.license_expiry);
                        return (
                          <motion.tr 
                            key={d.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: index * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className={`hover:bg-white/[0.01] transition-colors ${expired ? 'bg-red-500/[0.015]' : ''}`}
                          >
                            <td className="py-4 px-6 font-medium text-white flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-slate-300 text-[10px]">
                                {d.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-200">{d.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">ID: #{d.id}</div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-semibold text-slate-300">{d.license_category}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{d.license_no}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className={`${expired ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                                  {new Date(d.license_expiry).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                                {expired && (
                                  <span className="inline-flex items-center gap-1 text-[9px] text-red-400 font-bold mt-0.5 tracking-wider">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                    EXPIRED LICENSE
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 font-mono text-slate-400">{d.contact_number}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-1.5">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                <span className="font-bold text-white">{d.safety_score.toFixed(1)}</span>
                                <span className="text-slate-500 text-[10px]">/ 5.0</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <PillBadge status={d.status} />
                            </td>
                            {canMutate && (
                              <td className="py-4 px-6 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleEditClick(d)}
                                    className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer"
                                    title="Edit Driver"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(d.id, d.name)}
                                    disabled={d.status === 'On Trip'}
                                    className={`p-1.5 rounded-full transition-all duration-300 ${
                                      d.status === 'On Trip' 
                                        ? 'text-slate-600 cursor-not-allowed opacity-30' 
                                        : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer'
                                    }`}
                                    title={d.status === 'On Trip' ? 'Cannot delete while On Trip' : 'Delete Driver'}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            )}
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

      </div>

      {/* Add Driver Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Driver Profile"
        layoutId="add-driver"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Driver Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Marcus Miller"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full text-xs py-2.5 px-3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">License Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. DL-883920"
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">License Category</label>
              <select
                value={licenseCategory}
                onChange={(e) => setLicenseCategory(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              >
                <option value="Heavy Truck (Class A)" className="bg-[#121214]">Heavy Truck (Class A)</option>
                <option value="Commercial (Class B)" className="bg-[#121214]">Commercial (Class B)</option>
                <option value="Standard (Class C)" className="bg-[#121214]">Standard (Class C)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">License Expiry Date *</label>
              <input
                type="date"
                required
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contact Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. +1-555-0192"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Safety Score (1.0 - 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={safetyScore}
                onChange={(e) => setSafetyScore(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              >
                <option value="Available" className="bg-[#121214]">Available</option>
                <option value="Off Duty" className="bg-[#121214]">Off Duty</option>
                <option value="Suspended" className="bg-[#121214]">Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <GhostButton onClick={() => setIsAddOpen(false)}>Cancel</GhostButton>
            <PrimaryButton type="submit">Add Profile</PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Edit Driver Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Driver: ${activeDriver?.name}`}
        layoutId="edit-driver"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Driver Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full text-xs py-2.5 px-3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">License Number *</label>
              <input
                type="text"
                required
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">License Category</label>
              <select
                value={licenseCategory}
                onChange={(e) => setLicenseCategory(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              >
                <option value="Heavy Truck (Class A)" className="bg-[#121214]">Heavy Truck (Class A)</option>
                <option value="Commercial (Class B)" className="bg-[#121214]">Commercial (Class B)</option>
                <option value="Standard (Class C)" className="bg-[#121214]">Standard (Class C)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">License Expiry Date *</label>
              <input
                type="date"
                required
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contact Number *</label>
              <input
                type="text"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Safety Score (1.0 - 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={safetyScore}
                onChange={(e) => setSafetyScore(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={activeDriver?.status === 'On Trip'}
                className={`glass-input w-full text-xs py-2.5 px-3 ${activeDriver?.status === 'On Trip' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {activeDriver?.status === 'On Trip' ? (
                  <option value="On Trip" className="bg-[#121214]">On Trip</option>
                ) : (
                  <>
                    <option value="Available" className="bg-[#121214]">Available</option>
                    <option value="Off Duty" className="bg-[#121214]">Off Duty</option>
                    <option value="Suspended" className="bg-[#121214]">Suspended</option>
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
