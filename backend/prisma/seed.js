import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing data (deleting children/dependencies first)
  await prisma.fuelLog.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.maintenanceLog.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.driver.deleteMany({});

  // 2. Create users
  const salt = await bcrypt.genSalt(10);
  const managerPassword = await bcrypt.hash('manager123', salt);
  const driverPassword = await bcrypt.hash('driver123', salt);
  const safetyPassword = await bcrypt.hash('safety123', salt);
  const financePassword = await bcrypt.hash('finance123', salt);

  const users = [
    {
      email: 'manager@transitops.com',
      password: managerPassword,
      name: 'Sarah Connor (Fleet Manager)',
      role: 'FleetManager'
    },
    {
      email: 'driver@transitops.com',
      password: driverPassword,
      name: 'John Doe (Driver)',
      role: 'Driver'
    },
    {
      email: 'safety@transitops.com',
      password: safetyPassword,
      name: 'Ellen Ripley (Safety Officer)',
      role: 'SafetyOfficer'
    },
    {
      email: 'finance@transitops.com',
      password: financePassword,
      name: 'Christian Wolff (Financial Analyst)',
      role: 'FinancialAnalyst'
    }
  ];

  // Programmatically generate 50 additional mock users for cybersecurity and scale testing
  const roles = ['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst'];
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

  for (let i = 1; i <= 50; i++) {
    const fn = firstNames[(i * 3) % firstNames.length];
    const ln = lastNames[(i * 7) % lastNames.length];
    const role = roles[i % roles.length];
    const email = `user${i}@transitops.com`;
    const passwordText = `password${i}`;
    const passwordHash = await bcrypt.hash(passwordText, salt);
    
    users.push({
      email,
      password: passwordHash,
      name: `${fn} ${ln} (${role})`,
      role
    });
  }

  for (const u of users) {
    await prisma.user.create({ data: u });
  }
  console.log('Users seeded.');

  // 3. Create Vehicles
  const vehicles = [
    {
      reg_no: 'VAN-05',
      name: 'Ford Transit Cargo Van',
      type: 'Van',
      max_load_kg: 1500,
      odometer_km: 42000,
      acquisition_cost: 32000,
      status: 'Available',
      region: 'North'
    },
    {
      reg_no: 'TRK-12',
      name: 'Volvo FH16 Semi Truck',
      type: 'Truck',
      max_load_kg: 18000,
      odometer_km: 180000,
      acquisition_cost: 115000,
      status: 'Available',
      region: 'East'
    },
    {
      reg_no: 'TRK-09',
      name: 'Scania R500 Flatbed',
      type: 'Truck',
      max_load_kg: 12000,
      odometer_km: 95000,
      acquisition_cost: 85000,
      status: 'In Shop', // Edge Case: In Shop
      region: 'South'
    },
    {
      reg_no: 'VAN-02',
      name: 'Mercedes Sprinter Van',
      type: 'Van',
      max_load_kg: 2000,
      odometer_km: 250000,
      acquisition_cost: 45000,
      status: 'Retired', // Edge Case: Retired
      region: 'West'
    },
    {
      reg_no: 'SED-01',
      name: 'Toyota Prius Courier Sedan',
      type: 'Sedan',
      max_load_kg: 400,
      odometer_km: 68000,
      acquisition_cost: 24000,
      status: 'Available',
      region: 'North'
    }
  ];

  for (const v of vehicles) {
    await prisma.vehicle.create({ data: v });
  }
  console.log('Vehicles seeded.');

  // 4. Create Drivers
  const drivers = [
    {
      name: 'Marcus Miller',
      license_no: 'DL-883920',
      license_category: 'Heavy Truck (Class A)',
      license_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      contact_number: '+1-555-0192',
      safety_score: 4.8,
      status: 'Available'
    },
    {
      name: 'Dominic Toretto',
      license_no: 'DL-994821',
      license_category: 'Heavy Truck (Class A)',
      license_expiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
      contact_number: '+1-555-0100',
      safety_score: 4.9,
      status: 'Available'
    },
    {
      name: 'James Smith',
      license_no: 'DL-112233',
      license_category: 'Standard (Class C)',
      license_expiry: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (EXPIRED)
      contact_number: '+1-555-0144',
      safety_score: 3.2,
      status: 'Off Duty'
    },
    {
      name: 'Walter White',
      license_no: 'DL-445566',
      license_category: 'Commercial (Class B)',
      license_expiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      contact_number: '+1-555-0177',
      safety_score: 2.1,
      status: 'Suspended' // Edge Case: Suspended
    }
  ];

  for (const d of drivers) {
    await prisma.driver.create({ data: d });
  }
  console.log('Drivers seeded.');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
