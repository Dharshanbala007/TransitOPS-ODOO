import express from 'express';
import prisma from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET all trips (with vehicle & driver info)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      include: {
        vehicle: true,
        driver: true
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(trips);
  } catch (error) {
    console.error('Fetch trips error:', error);
    res.status(500).json({ error: 'Server error retrieving trips' });
  }
});

// GET eligible vehicles for new trip (status = Available)
router.get('/eligible-vehicles', authenticateToken, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: 'Available' },
      orderBy: { reg_no: 'asc' }
    });
    res.json(vehicles);
  } catch (error) {
    console.error('Fetch eligible vehicles error:', error);
    res.status(500).json({ error: 'Server error retrieving eligible vehicles' });
  }
});

// GET eligible drivers for new trip (status = Available, license not expired)
router.get('/eligible-drivers', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const drivers = await prisma.driver.findMany({
      where: {
        status: 'Available',
        license_expiry: { gte: today }
      },
      orderBy: { name: 'asc' }
    });
    res.json(drivers);
  } catch (error) {
    console.error('Fetch eligible drivers error:', error);
    res.status(500).json({ error: 'Server error retrieving eligible drivers' });
  }
});

// POST create trip - FleetManager or Driver only
router.post('/', authenticateToken, requireRole('FleetManager', 'Driver'), async (req, res) => {
  const { source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, revenue } = req.body;

  if (!source || !destination || vehicle_id === undefined || driver_id === undefined || cargo_weight_kg === undefined || planned_distance_km === undefined || revenue === undefined) {
    return res.status(400).json({ error: 'All fields (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, revenue) are required.' });
  }

  try {
    const vehicleId = parseInt(vehicle_id);
    const driverId = parseInt(driver_id);
    const weight = parseFloat(cargo_weight_kg);
    const distance = parseFloat(planned_distance_km);
    const rev = parseFloat(revenue);

    // 1. Fetch vehicle & check status
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }
    if (vehicle.status !== 'Available') {
      return res.status(400).json({ error: `Vehicle is not Available (current status: ${vehicle.status}).` });
    }

    // 2. Fetch driver & check status + license expiry
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found.' });
    }
    if (driver.status !== 'Available') {
      return res.status(400).json({ error: `Driver is not Available (current status: ${driver.status}).` });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(driver.license_expiry) < today) {
      return res.status(400).json({ error: "Driver's license is expired." });
    }

    // 3. Check load capacity limit
    if (weight > vehicle.max_load_kg) {
      return res.status(400).json({ error: `Cargo weight ${weight}kg exceeds vehicle max load ${vehicle.max_load_kg}kg` });
    }

    // 4. Create Draft trip
    const trip = await prisma.trip.create({
      data: {
        source,
        destination,
        vehicle_id: vehicleId,
        driver_id: driverId,
        cargo_weight_kg: weight,
        planned_distance_km: distance,
        revenue: rev,
        status: 'Draft'
      },
      include: {
        vehicle: true,
        driver: true
      }
    });

    res.status(201).json(trip);
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'Server error creating trip.' });
  }
});

// POST dispatch trip - FleetManager or Driver only
router.post('/:id/dispatch', authenticateToken, requireRole('FleetManager', 'Driver'), async (req, res) => {
  const { id } = req.params;

  try {
    const tripId = parseInt(id);
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    if (trip.status !== 'Draft') {
      return res.status(400).json({ error: `Only Draft trips can be dispatched (current status: ${trip.status}).` });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicle_id } });
    const driver = await prisma.driver.findUnique({ where: { id: trip.driver_id } });

    if (!vehicle || vehicle.status !== 'Available') {
      return res.status(400).json({ error: 'Vehicle is no longer Available.' });
    }
    if (!driver || driver.status !== 'Available') {
      return res.status(400).json({ error: 'Driver is no longer Available.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(driver.license_expiry) < today) {
      return res.status(400).json({ error: "Driver's license has expired since the draft trip was created." });
    }

    // Atomically dispatch trip and set statuses to On Trip
    const [updatedTrip] = await prisma.$transaction([
      prisma.trip.update({
        where: { id: tripId },
        data: { status: 'Dispatched' },
        include: { vehicle: true, driver: true }
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicle_id },
        data: { status: 'On Trip' }
      }),
      prisma.driver.update({
        where: { id: trip.driver_id },
        data: { status: 'On Trip' }
      })
    ]);

    res.json(updatedTrip);
  } catch (error) {
    console.error('Dispatch trip error:', error);
    res.status(500).json({ error: 'Server error dispatching trip.' });
  }
});

// POST complete trip - FleetManager or Driver only
router.post('/:id/complete', authenticateToken, requireRole('FleetManager', 'Driver'), async (req, res) => {
  const { id } = req.params;
  const { final_odometer_km, fuel_consumed_l } = req.body;

  if (final_odometer_km === undefined || fuel_consumed_l === undefined) {
    return res.status(400).json({ error: 'Final odometer (km) and fuel consumed (liters) are required to complete trip.' });
  }

  try {
    const tripId = parseInt(id);
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ error: `Only Dispatched trips can be completed (current status: ${trip.status}).` });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicle_id } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    const finalOdo = parseFloat(final_odometer_km);
    const fuelCons = parseFloat(fuel_consumed_l);

    if (finalOdo < vehicle.odometer_km) {
      return res.status(400).json({
        error: `Final odometer (${finalOdo} km) cannot be less than vehicle's current odometer (${vehicle.odometer_km} km).`
      });
    }

    // Atomically complete trip, release vehicle & driver, create fuel log
    const [updatedTrip] = await prisma.$transaction([
      prisma.trip.update({
        where: { id: tripId },
        data: {
          status: 'Completed',
          final_odometer_km: finalOdo,
          fuel_consumed_l: fuelCons
        },
        include: { vehicle: true, driver: true }
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicle_id },
        data: {
          odometer_km: finalOdo,
          status: 'Available'
        }
      }),
      prisma.driver.update({
        where: { id: trip.driver_id },
        data: { status: 'Available' }
      }),
      prisma.fuelLog.create({
        data: {
          vehicle_id: trip.vehicle_id,
          trip_id: tripId,
          liters: fuelCons,
          cost: fuelCons * 1.5, // default cost estimate
          date: new Date()
        }
      })
    ]);

    res.json(updatedTrip);
  } catch (error) {
    console.error('Complete trip error:', error);
    res.status(500).json({ error: 'Server error completing trip.' });
  }
});

// POST cancel trip - FleetManager or Driver only
router.post('/:id/cancel', authenticateToken, requireRole('FleetManager', 'Driver'), async (req, res) => {
  const { id } = req.params;

  try {
    const tripId = parseInt(id);
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    if (trip.status !== 'Draft' && trip.status !== 'Dispatched') {
      return res.status(400).json({ error: `Only Draft or Dispatched trips can be cancelled (current status: ${trip.status}).` });
    }

    let updatedTrip;
    if (trip.status === 'Dispatched') {
      // Release vehicle and driver back to Available
      const [resTrip] = await prisma.$transaction([
        prisma.trip.update({
          where: { id: tripId },
          data: { status: 'Cancelled' },
          include: { vehicle: true, driver: true }
        }),
        prisma.vehicle.update({
          where: { id: trip.vehicle_id },
          data: { status: 'Available' }
        }),
        prisma.driver.update({
          where: { id: trip.driver_id },
          data: { status: 'Available' }
        })
      ]);
      updatedTrip = resTrip;
    } else {
      // For Draft, just cancel trip (vehicle and driver were never locked)
      updatedTrip = await prisma.trip.update({
        where: { id: tripId },
        data: { status: 'Cancelled' },
        include: { vehicle: true, driver: true }
      });
    }

    res.json(updatedTrip);
  } catch (error) {
    console.error('Cancel trip error:', error);
    res.status(500).json({ error: 'Server error cancelling trip.' });
  }
});

export default router;
