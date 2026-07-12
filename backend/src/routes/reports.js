import express from 'express';
import prisma from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET dashboard statistics (with filters)
router.get('/dashboard-stats', authenticateToken, async (req, res) => {
  const { type, status, region } = req.query;

  try {
    // 1. Vehicle filters
    const vehicleWhere = {};
    if (type && type !== 'All') vehicleWhere.type = type;
    if (status && status !== 'All') vehicleWhere.status = status;
    if (region && region !== 'All') vehicleWhere.region = region;

    const filteredVehicles = await prisma.vehicle.findMany({
      where: vehicleWhere
    });

    const activeVehicles = filteredVehicles.filter(v => v.status === 'On Trip').length;
    const availableVehicles = filteredVehicles.filter(v => v.status === 'Available').length;
    const inShopVehicles = filteredVehicles.filter(v => v.status === 'In Shop').length;

    const nonRetiredCount = filteredVehicles.filter(v => v.status !== 'Retired').length;
    const utilization = nonRetiredCount > 0 ? (activeVehicles / nonRetiredCount) * 100 : 0;

    // 2. Trip filters based on matching vehicle criteria
    const tripWhere = {};
    if ((type && type !== 'All') || (region && region !== 'All')) {
      tripWhere.vehicle = {};
      if (type && type !== 'All') tripWhere.vehicle.type = type;
      if (region && region !== 'All') tripWhere.vehicle.region = region;
    }

    const trips = await prisma.trip.findMany({
      where: tripWhere
    });

    const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
    const pendingTrips = trips.filter(t => t.status === 'Draft').length;

    // 3. Drivers On Duty (Available or On Trip)
    const drivers = await prisma.driver.findMany();
    const driversOnDuty = drivers.filter(d => d.status === 'Available' || d.status === 'On Trip').length;

    // 4. Vehicle Status Distribution for charts
    const statusDistribution = [
      { name: 'Available', value: filteredVehicles.filter(v => v.status === 'Available').length },
      { name: 'On Trip', value: filteredVehicles.filter(v => v.status === 'On Trip').length },
      { name: 'In Shop', value: filteredVehicles.filter(v => v.status === 'In Shop').length },
      { name: 'Retired', value: filteredVehicles.filter(v => v.status === 'Retired').length }
    ];

    res.json({
      activeVehicles,
      availableVehicles,
      inShopVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      utilization,
      statusDistribution
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ error: 'Server error retrieving dashboard statistics.' });
  }
});

// GET vehicle performance report (Fuel Efficiency, Operational Cost, Revenue, ROI)
router.get('/vehicle-performance', authenticateToken, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        trips: true,
        fuelLogs: true,
        maintenanceLogs: true,
        expenses: true
      }
    });

    const performance = vehicles.map(v => {
      // Completed trips
      const completedTrips = v.trips.filter(t => t.status === 'Completed');
      const revenue = completedTrips.reduce((sum, t) => sum + t.revenue, 0);

      // Fuel Efficiency (km/L) = SUM(planned_distance_km) / SUM(fuel_consumed_l)
      const totalDistance = completedTrips.reduce((sum, t) => sum + t.planned_distance_km, 0);
      const totalFuelConsumed = completedTrips.reduce((sum, t) => sum + (t.fuel_consumed_l || 0), 0);
      const fuelEfficiency = totalFuelConsumed > 0 ? totalDistance / totalFuelConsumed : 0;

      // Cost Components
      const fuelCost = v.fuelLogs.reduce((sum, f) => sum + f.cost, 0);
      const maintenanceCost = v.maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
      const expenseCost = v.expenses.reduce((sum, e) => sum + e.amount, 0);

      // Operational Cost = Fuel + Maintenance + Expenses
      const operationalCost = fuelCost + maintenanceCost + expenseCost;

      // Vehicle ROI % = (Revenue - (Maintenance + Fuel)) / Acquisition Cost * 100
      const totalMaintenanceAndFuel = maintenanceCost + fuelCost;
      const roi = v.acquisition_cost > 0
        ? ((revenue - totalMaintenanceAndFuel) / v.acquisition_cost) * 100
        : 0;

      return {
        id: v.id,
        reg_no: v.reg_no,
        name: v.name,
        type: v.type,
        acquisition_cost: v.acquisition_cost,
        fuel_efficiency: fuelEfficiency,
        operational_cost: operationalCost,
        revenue,
        roi,
        fuel_cost: fuelCost,
        maintenance_cost: maintenanceCost,
        expense_cost: expenseCost
      };
    });

    // Fleet-wide calculations
    const allFuelLogs = await prisma.fuelLog.findMany();
    const allMaintLogs = await prisma.maintenanceLog.findMany();
    const allVehicles = await prisma.vehicle.findMany();

    const totalFuelCost = allFuelLogs.reduce((sum, f) => sum + f.cost, 0);
    const totalMaintenanceCost = allMaintLogs.reduce((sum, m) => sum + m.cost, 0);

    const nonRetiredVehicles = allVehicles.filter(v => v.status !== 'Retired').length;
    const onTripVehicles = allVehicles.filter(v => v.status === 'On Trip').length;
    const overallUtilization = nonRetiredVehicles > 0 ? (onTripVehicles / nonRetiredVehicles) * 100 : 0;

    res.json({
      performance,
      totals: {
        totalFuelCost,
        totalMaintenanceCost,
        overallUtilization
      }
    });
  } catch (error) {
    console.error('Fetch vehicle performance error:', error);
    res.status(500).json({ error: 'Server error retrieving vehicle performance reports.' });
  }
});

export default router;
