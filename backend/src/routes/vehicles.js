import express from 'express';
import prisma from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET all vehicles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { reg_no: 'asc' }
    });
    res.json(vehicles);
  } catch (error) {
    console.error('Fetch vehicles error:', error);
    res.status(500).json({ error: 'Server error retrieving vehicles' });
  }
});

// POST create vehicle - FleetManager only
router.post('/', authenticateToken, requireRole('FleetManager'), async (req, res) => {
  const { reg_no, name, type, max_load_kg, odometer_km, acquisition_cost, status, region } = req.body;

  if (!reg_no || !name || !type || max_load_kg === undefined || odometer_km === undefined || acquisition_cost === undefined || !status || !region) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if unique registration number already exists
    const existing = await prisma.vehicle.findUnique({
      where: { reg_no: reg_no.toUpperCase().trim() }
    });

    if (existing) {
      return res.status(400).json({ error: `Vehicle registration number '${reg_no}' already exists.` });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        reg_no: reg_no.toUpperCase().trim(),
        name,
        type,
        max_load_kg: parseFloat(max_load_kg),
        odometer_km: parseFloat(odometer_km),
        acquisition_cost: parseFloat(acquisition_cost),
        status,
        region
      }
    });

    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Server error creating vehicle' });
  }
});

// PUT update vehicle - FleetManager only
router.put('/:id', authenticateToken, requireRole('FleetManager'), async (req, res) => {
  const { id } = req.params;
  const { reg_no, name, type, max_load_kg, odometer_km, acquisition_cost, status, region } = req.body;

  if (!reg_no || !name || !type || max_load_kg === undefined || odometer_km === undefined || acquisition_cost === undefined || !status || !region) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const vehicleId = parseInt(id);
    
    // Check duplicate reg_no
    const existing = await prisma.vehicle.findFirst({
      where: {
        reg_no: reg_no.toUpperCase().trim(),
        id: { not: vehicleId }
      }
    });

    if (existing) {
      return res.status(400).json({ error: `Vehicle registration number '${reg_no}' is already used by another vehicle.` });
    }

    // Check if currently On Trip and trying to change status to retired or something?
    // Wait, the prompt says "Retire action (blocked if status is On Trip)." Let's enforce that.
    const current = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!current) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (current.status === 'On Trip' && status !== 'On Trip') {
      return res.status(400).json({ error: 'Cannot change status of a vehicle while it is On Trip.' });
    }

    const updated = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        reg_no: reg_no.toUpperCase().trim(),
        name,
        type,
        max_load_kg: parseFloat(max_load_kg),
        odometer_km: parseFloat(odometer_km),
        acquisition_cost: parseFloat(acquisition_cost),
        status,
        region
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Server error updating vehicle' });
  }
});

// DELETE (Retire) vehicle - FleetManager only
router.delete('/:id', authenticateToken, requireRole('FleetManager'), async (req, res) => {
  const { id } = req.params;

  try {
    const vehicleId = parseInt(id);
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ error: 'Cannot retire a vehicle while it is On Trip.' });
    }

    const updated = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: 'Retired' }
    });

    res.json({ message: 'Vehicle successfully retired', vehicle: updated });
  } catch (error) {
    console.error('Retire vehicle error:', error);
    res.status(500).json({ error: 'Server error retiring vehicle' });
  }
});

export default router;
