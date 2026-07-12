import express from 'express';
import prisma from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET all fuel logs (FleetManager, FinancialAnalyst, Driver, SafetyOfficer)
router.get('/fuel-logs', authenticateToken, async (req, res) => {
  try {
    const logs = await prisma.fuelLog.findMany({
      include: {
        vehicle: true,
        trip: true
      },
      orderBy: { date: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    console.error('Fetch fuel logs error:', error);
    res.status(500).json({ error: 'Server error retrieving fuel logs.' });
  }
});

// POST log fuel entry - FleetManager or FinancialAnalyst only
router.post('/fuel-logs', authenticateToken, requireRole('FleetManager', 'FinancialAnalyst'), async (req, res) => {
  const { vehicle_id, trip_id, liters, cost, date } = req.body;

  if (vehicle_id === undefined || liters === undefined || cost === undefined) {
    return res.status(400).json({ error: 'All fields (vehicle_id, liters, cost) are required.' });
  }

  try {
    const vehicleId = parseInt(vehicle_id);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    const payload = {
      vehicle_id: vehicleId,
      liters: parseFloat(liters),
      cost: parseFloat(cost),
      date: date ? new Date(date) : new Date()
    };

    if (trip_id) {
      payload.trip_id = parseInt(trip_id);
    }

    const log = await prisma.fuelLog.create({
      data: payload,
      include: { vehicle: true }
    });

    res.status(201).json(log);
  } catch (error) {
    console.error('Log fuel entry error:', error);
    res.status(500).json({ error: 'Server error logging fuel entry.' });
  }
});

// GET all expenses (FleetManager, FinancialAnalyst, Driver, SafetyOfficer)
router.get('/expenses', authenticateToken, async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        vehicle: true
      },
      orderBy: { date: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    console.error('Fetch expenses error:', error);
    res.status(500).json({ error: 'Server error retrieving expenses.' });
  }
});

// POST log expense entry - FleetManager or FinancialAnalyst only
router.post('/expenses', authenticateToken, requireRole('FleetManager', 'FinancialAnalyst'), async (req, res) => {
  const { vehicle_id, category, amount, date, notes } = req.body;

  if (vehicle_id === undefined || !category || amount === undefined) {
    return res.status(400).json({ error: 'All fields (vehicle_id, category, amount) are required.' });
  }

  try {
    const vehicleId = parseInt(vehicle_id);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    const expense = await prisma.expense.create({
      data: {
        vehicle_id: vehicleId,
        category,
        amount: parseFloat(amount),
        notes: notes || '',
        date: date ? new Date(date) : new Date()
      },
      include: { vehicle: true }
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Log expense error:', error);
    res.status(500).json({ error: 'Server error logging expense.' });
  }
});

export default router;
