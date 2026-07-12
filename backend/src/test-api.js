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

  console.log('--- ALL API TESTS COMPLETED ---');
}

runTests();
