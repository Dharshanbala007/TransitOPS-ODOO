import prisma from './db.js';

async function check() {
  try {
    const users = await prisma.user.findMany();
    console.log("=== USERS IN DATABASE ===");
    users.forEach(u => {
      console.log(`ID: ${u.id} | Email: "${u.email}" | Name: "${u.name}" | Role: "${u.role}"`);
    });
  } catch (err) {
    console.error("Error reading database:", err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
