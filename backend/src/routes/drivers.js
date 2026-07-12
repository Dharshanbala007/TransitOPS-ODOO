import express from 'express';
import prisma from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET all drivers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(drivers);
  } catch (error) {
    console.error('Fetch drivers error:', error);
    res.status(500).json({ error: 'Server error retrieving drivers' });
  }
});

// POST create driver - FleetManager or SafetyOfficer only
router.post('/', authenticateToken, requireRole('FleetManager', 'SafetyOfficer'), async (req, res) => {
  const { name, license_no, license_category, license_expiry, contact_number, safety_score, status } = req.body;

  if (!name || !license_no || !license_category || !license_expiry || !contact_number || !status) {
    return res.status(400).json({ error: 'All fields (name, license_no, license_category, license_expiry, contact_number, status) are required' });
  }

  try {
    // Check if unique license number already exists
    const existing = await prisma.driver.findUnique({
      where: { license_no: license_no.toUpperCase().trim() }
    });

    if (existing) {
      return res.status(400).json({ error: `Driver with license number '${license_no}' already exists.` });
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        license_no: license_no.toUpperCase().trim(),
        license_category,
        license_expiry: new Date(license_expiry),
        contact_number,
        safety_score: safety_score !== undefined ? parseFloat(safety_score) : 5.0,
        status
      }
    });

    res.status(201).json(driver);
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({ error: 'Server error creating driver' });
  }
});

// PUT update driver - FleetManager or SafetyOfficer only
router.put('/:id', authenticateToken, requireRole('FleetManager', 'SafetyOfficer'), async (req, res) => {
  const { id } = req.params;
  const { name, license_no, license_category, license_expiry, contact_number, safety_score, status } = req.body;

  if (!name || !license_no || !license_category || !license_expiry || !contact_number || !status) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const driverId = parseInt(id);

    // Check duplicate license_no
    const existing = await prisma.driver.findFirst({
      where: {
        license_no: license_no.toUpperCase().trim(),
        id: { not: driverId }
      }
    });

    if (existing) {
      return res.status(400).json({ error: `Driver with license number '${license_no}' already exists for another driver.` });
    }

    const updated = await prisma.driver.update({
      where: { id: driverId },
      data: {
        name,
        license_no: license_no.toUpperCase().trim(),
        license_category,
        license_expiry: new Date(license_expiry),
        contact_number,
        safety_score: parseFloat(safety_score),
        status
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ error: 'Server error updating driver' });
  }
});

// DELETE driver - FleetManager or SafetyOfficer only
router.delete('/:id', authenticateToken, requireRole('FleetManager', 'SafetyOfficer'), async (req, res) => {
  const { id } = req.params;

  try {
    const driverId = parseInt(id);
    
    // Check if driver exists
    const driver = await prisma.driver.findUnique({
      where: { id: driverId }
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check if on trip
    if (driver.status === 'On Trip') {
      return res.status(400).json({ error: 'Cannot delete/retire a driver while they are On Trip.' });
    }

    await prisma.driver.delete({
      where: { id: driverId }
    });

    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({ error: 'Server error deleting driver' });
  }
});

export default router;
