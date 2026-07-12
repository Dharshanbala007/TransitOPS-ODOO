async function runTests() {
  console.log('--- STARTING TRANSITOPS API VERIFICATION TESTS ---');
  const host = 'http://localhost:5000/api';
  
  // Test 1: Health check
  try {
    const healthRes = await fetch(`${host}/health`);
    const healthData = await healthRes.json();
    console.log('✔ Test 1: Health Check Passed ->', healthData);
  } catch (err) {
    console.error('❌ Test 1: Health Check Failed. Ensure server is running on port 5000.');
    return;
  }

  // Test 2: Invalid Login
  try {
    const res = await fetch(`${host}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@transitops.com', password: 'wrongpassword' })
    });
    
    if (res.status === 401) {
      console.log('✔ Test 2: Invalid Login correctly returns 401 Unauthorized');
    } else {
      console.error('❌ Test 2: Invalid Login returned status:', res.status);
    }
  } catch (err) {
    console.error('❌ Test 2: Failed with error:', err.message);
  }

  // Test 3: Successful Fleet Manager Login & JWT Generation
  let managerToken = '';
  try {
    const res = await fetch(`${host}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@transitops.com', password: 'manager123' })
    });
    
    const data = await res.json();
    if (res.ok && data.token) {
      managerToken = data.token;
      console.log('✔ Test 3: Manager Login successful. JWT token received.');
    } else {
      console.error('❌ Test 3: Manager Login failed:', data.error);
    }
  } catch (err) {
    console.error('❌ Test 3: Failed with error:', err.message);
  }

  // Test 4: Driver Login & JWT Generation
  let driverToken = '';
  try {
    const res = await fetch(`${host}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@transitops.com', password: 'driver123' })
    });
    
    const data = await res.json();
    if (res.ok && data.token) {
      driverToken = data.token;
      console.log('✔ Test 4: Driver Login successful. JWT token received.');
    } else {
      console.error('❌ Test 4: Driver Login failed:', data.error);
    }
  } catch (err) {
    console.error('❌ Test 4: Failed with error:', err.message);
  }

  // Test 5: Fetch Vehicles (Authenticated)
  try {
    const res = await fetch(`${host}/vehicles`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    
    const data = await res.json();
    if (res.ok && Array.isArray(data)) {
      console.log(`✔ Test 5: Fetch Vehicles successful. Found ${data.length} vehicles.`);
    } else {
      console.error('❌ Test 5: Fetch Vehicles failed:', data.error);
    }
  } catch (err) {
    console.error('❌ Test 5: Failed with error:', err.message);
  }

  // Test 6: RBAC Block - Driver attempts to create a vehicle (should return 403)
  try {
    const res = await fetch(`${host}/vehicles`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driverToken}` 
      },
      body: JSON.stringify({
        reg_no: 'TRK-99',
        name: 'Forbidden Truck',
        type: 'Truck',
        max_load_kg: 5000,
        odometer_km: 100,
        acquisition_cost: 40000,
        status: 'Available',
        region: 'North'
      })
    });
    
    if (res.status === 403) {
      console.log('✔ Test 6: Driver blocked from creating vehicle (403 Forbidden)');
    } else {
      console.error('❌ Test 6: Driver vehicle creation not blocked. Status code:', res.status);
    }
  } catch (err) {
    console.error('❌ Test 6: Failed with error:', err.message);
  }

  // Test 7: Fleet Manager creates a vehicle and checks unique reg_no
  try {
    // 7a. Create unique vehicle
    const testReg = `TEST-${Math.floor(Math.random() * 10000)}`;
    const createRes = await fetch(`${host}/vehicles`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}` 
      },
      body: JSON.stringify({
        reg_no: testReg,
        name: 'Verification Sedan',
        type: 'Sedan',
        max_load_kg: 500,
        odometer_km: 1000,
        acquisition_cost: 15000,
        status: 'Available',
        region: 'South'
      })
    });
    
    const createData = await createRes.json();
    if (createRes.ok) {
      console.log(`✔ Test 7a: Vehicle ${testReg} created successfully by Manager.`);
    } else {
      console.error('❌ Test 7a: Manager failed to create vehicle:', createData.error);
    }

    // 7b. Attempt duplicate reg_no creation
    const dupRes = await fetch(`${host}/vehicles`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}` 
      },
      body: JSON.stringify({
        reg_no: testReg,
        name: 'Duplicate Vehicle',
        type: 'Sedan',
        max_load_kg: 500,
        odometer_km: 1000,
        acquisition_cost: 15000,
        status: 'Available',
        region: 'South'
      })
    });

    const dupData = await dupRes.json();
    if (dupRes.status === 400 && dupData.error.includes('already exists')) {
      console.log('✔ Test 7b: Duplicate vehicle registration correctly rejected with error:', dupData.error);
    } else {
      console.error('❌ Test 7b: Duplicate vehicle registration check failed. Status:', dupRes.status, 'Error:', dupData.error);
    }
  } catch (err) {
    console.error('❌ Test 7: Failed with error:', err.message);
  }

  // --- TRIP & MAINTENANCE LIFE-CYCLE VERIFICATION TESTS ---
  console.log('\n--- STARTING TRIP & MAINTENANCE LIFE-CYCLE TESTS ---');

  let testVehicleId = 0;
  let testDriverId = 0;
  let testTripId = 0;

  // Setup: Fetch available vehicle and driver to use for trip tests
  try {
    const vRes = await fetch(`${host}/trips/eligible-vehicles`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    const vehicles = await vRes.json();
    const dRes = await fetch(`${host}/trips/eligible-drivers`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    const drivers = await dRes.json();

    if (vehicles.length > 0 && drivers.length > 0) {
      testVehicleId = vehicles[0].id;
      testDriverId = drivers[0].id;
      console.log(`✔ Setup: Found test vehicle ID ${testVehicleId} (${vehicles[0].reg_no}, max load: ${vehicles[0].max_load_kg}kg) and driver ID ${testDriverId}`);
    } else {
      console.error('❌ Setup: No available vehicles or drivers to perform trip tests.');
      return;
    }
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    return;
  }

  // Test 8: Trip weight rule check (Cargo Weight > Max Load)
  try {
    const invalidWeightRes = await fetch(`${host}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        source: 'Warehouse A',
        destination: 'Retail Hub B',
        vehicle_id: testVehicleId,
        driver_id: testDriverId,
        cargo_weight_kg: 999999, // Way above max load
        planned_distance_km: 150,
        revenue: 800
      })
    });
    const invalidData = await invalidWeightRes.json();
    if (invalidWeightRes.status === 400 && invalidData.error.includes('exceeds vehicle max load')) {
      console.log(`✔ Test 8: Invalid cargo weight successfully rejected with message: "${invalidData.error}"`);
    } else {
      console.error('❌ Test 8: Trip with invalid cargo weight was not rejected. Status:', invalidWeightRes.status, 'Error:', invalidData.error);
    }
  } catch (err) {
    console.error('❌ Test 8 Failed with error:', err.message);
  }

  // Test 9: Valid Trip creation (Draft status)
  try {
    const validRes = await fetch(`${host}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        source: 'Warehouse A',
        destination: 'Retail Hub B',
        vehicle_id: testVehicleId,
        driver_id: testDriverId,
        cargo_weight_kg: 100, // Valid load
        planned_distance_km: 150,
        revenue: 800
      })
    });
    const tripData = await validRes.json();
    if (validRes.ok && tripData.status === 'Draft') {
      testTripId = tripData.id;
      console.log(`✔ Test 9: Valid trip created successfully. ID: ${testTripId}, Status: ${tripData.status}`);
    } else {
      console.error('❌ Test 9: Valid trip creation failed:', tripData.error);
    }
  } catch (err) {
    console.error('❌ Test 9 Failed with error:', err.message);
  }

  // Test 10: Dispatch Trip (Draft -> Dispatched) & Status changes
  try {
    const dispatchRes = await fetch(`${host}/trips/${testTripId}/dispatch`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    const dispData = await dispatchRes.json();
    if (dispatchRes.ok && dispData.status === 'Dispatched') {
      console.log(`✔ Test 10a: Trip ID ${testTripId} successfully Dispatched.`);
      
      // Verify that vehicle & driver status updated to "On Trip"
      const vCheck = await fetch(`${host}/vehicles`, {
        headers: { 'Authorization': `Bearer ${managerToken}` }
      });
      const allVehicles = await vCheck.json();
      const testVehicle = allVehicles.find(v => v.id === testVehicleId);
      
      const dCheck = await fetch(`${host}/drivers`, {
        headers: { 'Authorization': `Bearer ${managerToken}` }
      });
      const allDrivers = await dCheck.json();
      const testDriver = allDrivers.find(d => d.id === testDriverId);

      if (testVehicle.status === 'On Trip' && testDriver.status === 'On Trip') {
        console.log(`✔ Test 10b: Vehicle status (${testVehicle.status}) and Driver status (${testDriver.status}) correctly updated to "On Trip".`);
      } else {
        console.error(`❌ Test 10b: Incorrect statuses. Vehicle: ${testVehicle.status}, Driver: ${testDriver.status}`);
      }
    } else {
      console.error('❌ Test 10a: Dispatch trip failed:', dispData.error);
    }
  } catch (err) {
    console.error('❌ Test 10 Failed with error:', err.message);
  }

  // Test 11: Complete Trip (Dispatched -> Completed) & Odometer updates & Fuel Log
  try {
    // 11a. Test odometer validation (less than current)
    const odoCheckRes = await fetch(`${host}/trips/${testTripId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        final_odometer_km: -10, // Invalid odometer
        fuel_consumed_l: 50
      })
    });
    const odoErr = await odoCheckRes.json();
    if (odoCheckRes.status === 400 && odoErr.error.includes('cannot be less than')) {
      console.log(`✔ Test 11a: Odometer validation correctly rejected: "${odoErr.error}"`);
    } else {
      console.error('❌ Test 11a: Odometer check bypassed. Status:', odoCheckRes.status, 'Error:', odoErr.error);
    }

    // Get current vehicle odometer to submit a valid final odometer
    const vCheck = await fetch(`${host}/vehicles`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    const allVehicles = await vCheck.json();
    const currentOdo = allVehicles.find(v => v.id === testVehicleId).odometer_km;
    const finalOdo = currentOdo + 150;

    // 11b. Valid Trip completion
    const completeRes = await fetch(`${host}/trips/${testTripId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        final_odometer_km: finalOdo,
        fuel_consumed_l: 45.5
      })
    });
    const compData = await completeRes.json();
    if (completeRes.ok && compData.status === 'Completed') {
      console.log(`✔ Test 11b: Trip completed successfully.`);

      // Verify vehicle odometer and statuses updated
      const vCheckAfter = await fetch(`${host}/vehicles`, {
        headers: { 'Authorization': `Bearer ${managerToken}` }
      });
      const allVehiclesAfter = await vCheckAfter.json();
      const testVehicleAfter = allVehiclesAfter.find(v => v.id === testVehicleId);

      const dCheckAfter = await fetch(`${host}/drivers`, {
        headers: { 'Authorization': `Bearer ${managerToken}` }
      });
      const allDriversAfter = await dCheckAfter.json();
      const testDriverAfter = allDriversAfter.find(d => d.id === testDriverId);

      if (testVehicleAfter.odometer_km === finalOdo && testVehicleAfter.status === 'Available' && testDriverAfter.status === 'Available') {
        console.log(`✔ Test 11c: Vehicle odometer updated to ${testVehicleAfter.odometer_km} km. Vehicle and Driver released back to "Available".`);
      } else {
        console.error(`❌ Test 11c: Validation failed. Vehicle Odometer: ${testVehicleAfter.odometer_km}, Status: ${testVehicleAfter.status}, Driver Status: ${testDriverAfter.status}`);
      }
    } else {
      console.error('❌ Test 11b: Valid trip completion failed:', compData.error);
    }
  } catch (err) {
    console.error('❌ Test 11 Failed with error:', err.message);
  }

  // Test 12: Maintenance (Open log sets In Shop, excludes from eligible lists, Close log restores Available)
  try {
    // 12a. Open maintenance log
    const openMaintRes = await fetch(`${host}/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        vehicle_id: testVehicleId,
        type: 'Engine',
        cost: 450,
        notes: 'Checking engine check light.'
      })
    });
    const maintData = await openMaintRes.json();
    if (openMaintRes.ok && maintData.status === 'Active') {
      console.log(`✔ Test 12a: Maintenance log opened successfully. ID: ${maintData.id}`);

      // Verify vehicle status is now In Shop
      const vCheck = await fetch(`${host}/vehicles`, {
        headers: { 'Authorization': `Bearer ${managerToken}` }
      });
      const allVehicles = await vCheck.json();
      const testVehicle = allVehicles.find(v => v.id === testVehicleId);
      if (testVehicle.status === 'In Shop') {
        console.log(`✔ Test 12b: Vehicle is now set to "In Shop".`);
      } else {
        console.error(`❌ Test 12b: Incorrect vehicle status: ${testVehicle.status}`);
      }

      // Verify vehicle is excluded from eligible vehicles list for trips
      const eligibleRes = await fetch(`${host}/trips/eligible-vehicles`, {
        headers: { 'Authorization': `Bearer ${managerToken}` }
      });
      const eligibleVehicles = await eligibleRes.json();
      const isStillAvailable = eligibleVehicles.some(v => v.id === testVehicleId);
      if (!isStillAvailable) {
        console.log(`✔ Test 12c: Vehicle in maintenance successfully excluded from eligible dispatch list.`);
      } else {
        console.error('❌ Test 12c: Vehicle in maintenance is still present in eligible dispatch list!');
      }

      // 12d. Close maintenance log
      const closeRes = await fetch(`${host}/maintenance/${maintData.id}/close`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${managerToken}` }
      });
      const closedData = await closeRes.json();
      if (closeRes.ok && closedData.status === 'Closed') {
        console.log(`✔ Test 12d: Maintenance log closed successfully.`);

        // Verify vehicle status returned to Available
        const vCheckAfter = await fetch(`${host}/vehicles`, {
          headers: { 'Authorization': `Bearer ${managerToken}` }
        });
        const allVehiclesAfter = await vCheckAfter.json();
        const testVehicleAfter = allVehiclesAfter.find(v => v.id === testVehicleId);
        if (testVehicleAfter.status === 'Available') {
          console.log(`✔ Test 12e: Vehicle status successfully restored to "Available".`);
        } else {
          console.error(`❌ Test 12e: Incorrect vehicle status after closing maintenance: ${testVehicleAfter.status}`);
        }
      } else {
        console.error('❌ Test 12d: Failed to close maintenance log:', closedData.error);
      }
    } else {
      console.error('❌ Test 12a: Failed to open maintenance log:', maintData.error);
    }
  } catch (err) {
    console.error('❌ Test 12 Failed with error:', err.message);
  }

  // Test 13: RBAC block (Driver role blocked from opening maintenance logs)
  try {
    const res = await fetch(`${host}/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        vehicle_id: testVehicleId,
        type: 'Brakes',
        cost: 200
      })
    });
    const data = await res.json();
    if (res.status === 403) {
      console.log(`✔ Test 13: Driver correctly blocked from opening maintenance logs (403 Forbidden). Error message: "${data.error}"`);
    } else {
      console.error('❌ Test 13: Driver role not blocked from maintenance. Status:', res.status);
    }
  } catch (err) {
    console.error('❌ Test 13 Failed with error:', err.message);
  }

  // --- MEMBER 3: DASHBOARD, REPORTS & EXPENSES VERIFICATION TESTS ---
  console.log('\n--- STARTING DASHBOARD, REPORTS & EXPENSES TESTS ---');

  // Test 14: Dashboard stats endpoint & filters
  try {
    const res = await fetch(`${host}/reports/dashboard-stats?type=All&status=All&region=All`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    const data = await res.json();
    if (res.ok && data.statusDistribution !== undefined && data.utilization !== undefined) {
      console.log(`✔ Test 14: Dashboard stats retrieved successfully. Utilization: ${data.utilization.toFixed(1)}%, Available: ${data.availableVehicles}, Active Trips: ${data.activeTrips}`);
    } else {
      console.error('❌ Test 14: Failed to retrieve dashboard stats:', data.error);
    }
  } catch (err) {
    console.error('❌ Test 14 Failed with error:', err.message);
  }

  // Test 15: Vehicle performance reporting & calculations
  try {
    const res = await fetch(`${host}/reports/vehicle-performance`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.performance) && data.totals) {
      console.log(`✔ Test 15a: Vehicle performance reports retrieved successfully. Overall Utilization: ${data.totals.overallUtilization.toFixed(1)}%`);
      
      if (data.performance.length > 0) {
        const testV = data.performance[0];
        console.log(`✔ Test 15b: Aggregates for ${testV.reg_no} -> Revenue: $${testV.revenue}, Operational Cost: $${testV.operational_cost}, ROI: ${testV.roi.toFixed(1)}%`);
      }
    } else {
      console.error('❌ Test 15a: Failed to retrieve performance reports:', data.error);
    }
  } catch (err) {
    console.error('❌ Test 15 Failed with error:', err.message);
  }

  // Test 16: Log Fuel Run (Success for Manager, 403 Forbidden for Driver)
  try {
    // 16a. Driver tries to log fuel (should be blocked)
    const blockRes = await fetch(`${host}/expenses/fuel-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        vehicle_id: testVehicleId,
        liters: 60.5,
        cost: 95.0
      })
    });
    const blockData = await blockRes.json();
    if (blockRes.status === 403) {
      console.log(`✔ Test 16a: Driver correctly blocked from logging fuel (403 Forbidden). Error message: "${blockData.error}"`);
    } else {
      console.error('❌ Test 16a: Driver was not blocked from logging fuel. Status:', blockRes.status);
    }

    // 16b. Manager logs fuel successfully
    const successRes = await fetch(`${host}/expenses/fuel-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        vehicle_id: testVehicleId,
        liters: 60.5,
        cost: 95.0
      })
    });
    const successData = await successRes.json();
    if (successRes.ok && successData.liters === 60.5) {
      console.log(`✔ Test 16b: Manager successfully logged a fuel run of ${successData.liters}L (Cost: $${successData.cost}) for ${successData.vehicle.reg_no}.`);
    } else {
      console.error('❌ Test 16b: Manager failed to log fuel run:', successData.error);
    }
  } catch (err) {
    console.error('❌ Test 16 Failed with error:', err.message);
  }

  // Test 17: Log Expense (Success for Manager, 403 Forbidden for Driver)
  try {
    // 17a. Driver tries to log expense (should be blocked)
    const blockRes = await fetch(`${host}/expenses/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        vehicle_id: testVehicleId,
        category: 'Toll',
        amount: 25.0,
        notes: 'Highway toll charge.'
      })
    });
    const blockData = await blockRes.json();
    if (blockRes.status === 403) {
      console.log(`✔ Test 17a: Driver correctly blocked from logging expenses (403 Forbidden). Error message: "${blockData.error}"`);
    } else {
      console.error('❌ Test 17a: Driver was not blocked from logging expenses. Status:', blockRes.status);
    }

    // 17b. Manager logs expense successfully
    const successRes = await fetch(`${host}/expenses/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        vehicle_id: testVehicleId,
        category: 'Toll',
        amount: 25.0,
        notes: 'Highway toll charge.'
      })
    });
    const successData = await successRes.json();
    if (successRes.ok && successData.amount === 25.0) {
      console.log(`✔ Test 17b: Manager successfully logged a $${successData.amount} (${successData.category}) expense for ${successData.vehicle.reg_no}.`);
    } else {
      console.error('❌ Test 17b: Manager failed to log expense:', successData.error);
    }
  } catch (err) {
    console.error('❌ Test 17 Failed with error:', err.message);
  }

  console.log('--- ALL DASHBOARD, REPORTS & EXPENSES TESTS COMPLETED ---');
  console.log('--- ALL API TESTS COMPLETED ---');
}

runTests();

