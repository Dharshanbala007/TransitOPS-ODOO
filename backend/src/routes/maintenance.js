import express from 'express';
import prisma from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET all maintenance records (with vehicle info)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const logs = await prisma.maintenanceLog.findMany({
      include: {
        vehicle: true
      },
      orderBy: { opened_date: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    console.error('Fetch maintenance logs error:', error);
    res.status(500).json({ error: 'Server error retrieving maintenance records' });
  }
});

// GET eligible vehicles for new maintenance (excludes On Trip and Retired)
router.get('/eligible-vehicles', authenticateToken, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: {
          notIn: ['On Trip', 'Retired']
        }
      },
      orderBy: { reg_no: 'asc' }
    });
    res.json(vehicles);
  } catch (error) {
    console.error('Fetch eligible vehicles error:', error);
    res.status(500).json({ error: 'Server error retrieving eligible vehicles' });
  }
});

// POST create maintenance log - FleetManager only
router.post('/', authenticateToken, requireRole('FleetManager'), async (req, res) => {
  const { vehicle_id, type, cost, notes } = req.body;

  if (vehicle_id === undefined || !type || cost === undefined) {
    return res.status(400).json({ error: 'All fields (vehicle_id, type, cost) are required.' });
  }

  try {
    const vehicleId = parseInt(vehicle_id);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    // Enforce business rules:
    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ error: 'Cannot put a vehicle in maintenance while it is On Trip.' });
    }
    if (vehicle.status === 'Retired') {
      return res.status(400).json({ error: 'Cannot put a retired vehicle in maintenance.' });
    }

    // Atomically create maintenance record and set vehicle status to In Shop
    const [log] = await prisma.$transaction([
      prisma.maintenanceLog.create({
        data: {
          vehicle_id: vehicleId,
          type,
          cost: parseFloat(cost),
          notes: notes || '',
          status: 'Active',
          opened_date: new Date()
        },
        include: { vehicle: true }
      }),
      prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'In Shop' }
      })
    ]);

    res.status(201).json(log);
  } catch (error) {
    console.error('Create maintenance log error:', error);
    res.status(500).json({ error: 'Server error creating maintenance record.' });
  }
});

// POST close maintenance log - FleetManager only
router.post('/:id/close', authenticateToken, requireRole('FleetManager'), async (req, res) => {
  const { id } = req.params;

  try {
    const logId = parseInt(id);
    const log = await prisma.maintenanceLog.findUnique({ where: { id: logId } });
    if (!log) {
      return res.status(404).json({ error: 'Maintenance record not found.' });
    }

    if (log.status === 'Closed') {
      return res.status(400).json({ error: 'Maintenance record is already closed.' });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: log.vehicle_id } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    // Atomically close maintenance record and restore vehicle status to Available (unless Retired)
    const transactionOperations = [
      prisma.maintenanceLog.update({
        where: { id: logId },
        data: {
          status: 'Closed',
          closed_date: new Date()
        },
        include: { vehicle: true }
      })
    ];

    if (vehicle.status !== 'Retired') {
      transactionOperations.push(
        prisma.vehicle.update({
          where: { id: log.vehicle_id },
          data: { status: 'Available' }
        })
      );
    }

    const [updatedLog] = await prisma.$transaction(transactionOperations);
    res.json(updatedLog);
  } catch (error) {
    console.error('Close maintenance log error:', error);
    res.status(500).json({ error: 'Server error closing maintenance record.' });
  }
});

export default router;
