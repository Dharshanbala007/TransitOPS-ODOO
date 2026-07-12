import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import GhostButton from '../components/GhostButton';
import Modal from '../components/Modal';
import { 
  Fuel, 
  DollarSign, 
  Plus, 
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Calendar,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Expenses() {
  const { token, user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isFuelOpen, setIsFuelOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);

  // Fuel Form state
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [fuelTripId, setFuelTripId] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelDate, setFuelDate] = useState('');

  // Expense Form state
  const [expVehicleId, setExpVehicleId] = useState('');
  const [expCategory, setExpCategory] = useState('Toll');
  const [expAmount, setExpAmount] = useState('');
  const [expNotes, setExpNotes] = useState('');
  const [expDate, setExpDate] = useState('');

  const [formError, setFormError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);

  const isAuthorized = user?.role === 'FleetManager' || user?.role === 'FinancialAnalyst';

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
      fetchVehicles();
    }
  }, [isAuthorized]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resFuel, resExp] = await Promise.all([
        fetch('http://localhost:5000/api/expenses/fuel-logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/expenses/expenses', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (resFuel.ok) {
        const fuelData = await resFuel.json();
        setFuelLogs(fuelData);
      }
      if (resExp.ok) {
        const expData = await resExp.json();
        setExpenses(expData);
      }
    } catch (err) {
      console.error('Fetch logs failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Don't list retired vehicles for logging new fuel/expenses
        setVehicles(data.filter(v => v.status !== 'Retired'));
      }
    } catch (err) {
      console.error('Fetch vehicles failed:', err);
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

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      vehicle_id: parseInt(fuelVehicleId),
      liters: parseFloat(fuelLiters),
      cost: parseFloat(fuelCost)
    };

    if (fuelTripId) {
      payload.trip_id = parseInt(fuelTripId);
    }
    if (fuelDate) {
      payload.date = new Date(fuelDate);
    }

    try {
      const res = await fetch('http://localhost:5000/api/expenses/fuel-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to log fuel entry');
      }

      showToast(`Fuel run of ${data.liters}L logged for ${data.vehicle.reg_no}.`);
      setIsFuelOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      vehicle_id: parseInt(expVehicleId),
      category: expCategory,
      amount: parseFloat(expAmount),
      notes: expNotes
    };

    if (expDate) {
      payload.date = new Date(expDate);
    }

    try {
      const res = await fetch('http://localhost:5000/api/expenses/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to log expense');
      }

      showToast(`Expense of $${data.amount} (${data.category}) logged for ${data.vehicle.reg_no}.`);
      setIsExpenseOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.message);
    }
  };

  // If not authorized to edit or view expenses log
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <GlassCard hoverable={false} className="p-8 max-w-md text-center border-red-500/20 shadow-[0_0_25px_rgba(239,68,68,0.1)]">
          <div className="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
            <ShieldAlert className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-6">
            Only Fleet Managers and Financial Analysts are authorized to access or log operational fuel runs and expenses.
          </p>
          <div className="text-xs font-mono text-slate-500 bg-black/20 p-2.5 rounded-lg border border-brand-border">
            Current Profile: {user?.role || 'Guest'}
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">
            Fuel & Expense <span style={{ color: 'var(--accent)' }}>Logging</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Log per-vehicle fuel purchases and miscellaneous operational expenses directly.</p>
        </div>
        <div className="flex gap-3">
          <PrimaryButton onClick={() => { setFormError(null); setFuelVehicleId(''); setFuelTripId(''); setFuelLiters(''); setFuelCost(''); setFuelDate(''); setIsFuelOpen(true); }} className="px-4 py-2 text-xs font-bold uppercase tracking-wider">
            <Fuel className="h-4.5 w-4.5 mr-1" />
            <span>Log Fuel</span>
          </PrimaryButton>
          <PrimaryButton onClick={() => { setFormError(null); setExpVehicleId(''); setExpCategory('Toll'); setExpAmount(''); setExpNotes(''); setExpDate(''); setIsExpenseOpen(true); }} className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-indigo-600/35 border-indigo-500/30 text-white hover:bg-indigo-600/50">
            <DollarSign className="h-4.5 w-4.5 mr-1" />
            <span>Log Expense</span>
          </PrimaryButton>
        </div>
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

      {/* Dashboard Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Fuel Log Runs */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Fuel className="h-4.5 w-4.5 text-[#6E6EF6]" />
            Recent Fuel Runs
          </h3>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6E6EF6]" />
            </div>
          ) : fuelLogs.length === 0 ? (
            <GlassCard hoverable={false} className="p-8 text-center border border-white/5">
              <HelpCircle className="h-10 w-10 text-slate-600 mx-auto mb-4" />
              <h4 className="text-sm font-bold text-white mb-1">No Fuel Logs Found</h4>
              <p className="text-xs text-slate-400">Add fuel purchases to display logs here.</p>
            </GlassCard>
          ) : (
            <GlassCard hoverable={false} className="overflow-hidden border border-white/5">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 bg-[#0d0d10] z-10">
                      <th className="py-3.5 px-5">Date</th>
                      <th className="py-3.5 px-5">Vehicle</th>
                      <th className="py-3.5 px-5">Liters</th>
                      <th className="py-3.5 px-5">Cost</th>
                      <th className="py-3.5 px-5">Trip ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    <AnimatePresence>
                      {fuelLogs.map((l, index) => (
                        <motion.tr 
                          key={l.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-white/[0.01] transition-colors"
                        >
                          <td className="py-3.5 px-5 text-slate-400">{new Date(l.date).toLocaleDateString()}</td>
                          <td className="py-3.5 px-5 font-mono font-bold text-white">{l.vehicle.reg_no}</td>
                          <td className="py-3.5 px-5">{l.liters} L</td>
                          <td className="py-3.5 px-5 font-semibold text-emerald-400">${l.cost.toLocaleString()}</td>
                          <td className="py-3.5 px-5 text-slate-500 font-mono">
                            {l.trip_id ? `#${l.trip_id}` : <span className="text-slate-600">—</span>}
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

        {/* Right Column: Miscellaneous Expenses */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <DollarSign className="h-4.5 w-4.5 text-indigo-400" />
            Operational Expenses
          </h3>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6E6EF6]" />
            </div>
          ) : expenses.length === 0 ? (
            <GlassCard hoverable={false} className="p-8 text-center border border-white/5">
              <HelpCircle className="h-10 w-10 text-slate-600 mx-auto mb-4" />
              <h4 className="text-sm font-bold text-white mb-1">No Expenses Logged</h4>
              <p className="text-xs text-slate-400">Log toll, insurance, permits, and repair costs here.</p>
            </GlassCard>
          ) : (
            <GlassCard hoverable={false} className="overflow-hidden border border-white/5">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 bg-[#0d0d10] z-10">
                      <th className="py-3.5 px-5">Date</th>
                      <th className="py-3.5 px-5">Vehicle</th>
                      <th className="py-3.5 px-5">Category</th>
                      <th className="py-3.5 px-5">Amount</th>
                      <th className="py-3.5 px-5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    <AnimatePresence>
                      {expenses.map((e, index) => (
                        <motion.tr 
                          key={e.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-white/[0.01] transition-colors"
                        >
                          <td className="py-3.5 px-5 text-slate-400">{new Date(e.date).toLocaleDateString()}</td>
                          <td className="py-3.5 px-5 font-mono font-bold text-white">{e.vehicle.reg_no}</td>
                          <td className="py-3.5 px-5">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 border border-white/10 uppercase tracking-wider">
                              {e.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-red-400">${e.amount.toLocaleString()}</td>
                          <td className="py-3.5 px-5 text-slate-400 truncate max-w-xs" title={e.notes}>
                            {e.notes || <span className="text-slate-600">—</span>}
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

      {/* Log Fuel Modal */}
      <Modal
        isOpen={isFuelOpen}
        onClose={() => setIsFuelOpen(false)}
        title="Log Vehicle Fuel Purchase"
        layoutId="log-fuel"
      >
        <form onSubmit={handleFuelSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Vehicle *</label>
            <select
              required
              value={fuelVehicleId}
              onChange={(e) => setFuelVehicleId(e.target.value)}
              className="glass-select w-full text-xs py-2.5 px-3"
            >
              <option value="">Choose Active Vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.reg_no} - {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Liters Purchased *</label>
              <input
                type="number"
                required
                min="0.1"
                step="any"
                placeholder="e.g. 80.5"
                value={fuelLiters}
                onChange={(e) => setFuelLiters(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Total Cost ($) *</label>
              <input
                type="number"
                required
                min="0.1"
                step="any"
                placeholder="e.g. 120.75"
                value={fuelCost}
                onChange={(e) => setFuelCost(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Associate Trip ID (Optional)</label>
              <input
                type="number"
                placeholder="e.g. 4"
                value={fuelTripId}
                onChange={(e) => setFuelTripId(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Log Date (Optional)</label>
              <input
                type="date"
                value={fuelDate}
                onChange={(e) => setFuelDate(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3 text-slate-300"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <GhostButton type="button" onClick={() => setIsFuelOpen(false)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider">
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" className="px-5 py-2 text-xs font-bold uppercase tracking-wider">
              Submit Fuel Run
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Log Expense Modal */}
      <Modal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        title="Log Misc Fleet Expense"
        layoutId="log-expense"
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Vehicle *</label>
            <select
              required
              value={expVehicleId}
              onChange={(e) => setExpVehicleId(e.target.value)}
              className="glass-select w-full text-xs py-2.5 px-3"
            >
              <option value="">Choose Active Vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.reg_no} - {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Expense Category *</label>
              <select
                required
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="glass-select w-full text-xs py-2.5 px-3"
              >
                <option value="Toll">Toll Taxes</option>
                <option value="Insurance">Insurance Fee</option>
                <option value="Permit">Permits & Licenses</option>
                <option value="Maintenance">Scheduled Maintenance</option>
                <option value="Other">Other Miscellaneous</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Total Amount ($) *</label>
              <input
                type="number"
                required
                min="0.1"
                step="any"
                placeholder="e.g. 45.00"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                className="glass-input w-full text-xs py-2.5 px-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Log Date (Optional)</label>
            <input
              type="date"
              value={expDate}
              onChange={(e) => setExpDate(e.target.value)}
              className="glass-input w-full text-xs py-2.5 px-3 text-slate-300"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notes / Description</label>
            <textarea
              rows="3"
              placeholder="e.g. Toll charges on interstate route 90..."
              value={expNotes}
              onChange={(e) => setExpNotes(e.target.value)}
              className="glass-input w-full text-xs py-2.5 px-3 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <GhostButton type="button" onClick={() => setIsExpenseOpen(false)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider">
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" className="px-5 py-2 text-xs font-bold uppercase tracking-wider">
              Submit Expense
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
