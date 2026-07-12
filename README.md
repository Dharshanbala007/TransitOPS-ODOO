# TransitOps - Integrated Fleet Command Console

TransitOps is a modern, high-fidelity fleet operations and telemetry analytics console. It integrates vehicle registry management, driver compliance scoring, real-time trip dispatches, active maintenance logs, per-vehicle fuel/expense logging, and live ROI financial audits in a single glassmorphic dashboard.

---

## 1. Project Tech Stack

*   **Frontend**: React (v19) + Vite + Tailwind CSS + Framer Motion (micro-animations) + Recharts (data visualizations).
*   **Backend**: Node.js + Express (REST APIs, JWT sessions, Role-Based Access Control).
*   **Database**: MySQL + Prisma ORM (relational entity mapping, parameterization).
*   **Security**: bcryptjs password hashing (10 rounds), signed JWT tokens, CORS shielding, and role validation.

---

## 2. Directory Structure

```text
TransitOPS-ODOO-main/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database Schema Models
│   │   └── seed.js            # Table Seeding Script (54 Users)
│   ├── src/
│   │   ├── routes/            # REST Controller Routes
│   │   ├── middleware/        # JWT Authentication & RBAC Filters
│   │   ├── server.js          # App Server Startup
│   │   └── test-api.js        # 17-Point Automated Verification Suite
│   └── .env                   # DB Connection & Port Env Config
├── frontend/
│   ├── public/
│   │   └── images/            # Organized Asset Folder (Login & Dashboard Bgs)
│   ├── src/
│   │   ├── components/        # Shared Glass Cards, Buttons, and Layout
│   │   ├── context/           # React Auth State Provider
│   │   ├── pages/             # Dashboard, Registry, Trips, Expenses, Reports
│   │   └── index.css          # Design Tokens & Glass Styles
│   └── package.json
└── README.md
```

---

## 3. Installation & Getting Started

### 3.1 Prerequisites
*   **Node.js**: v18 or later.
*   **MySQL Server**: Running on port `3306`.

### 3.2 Database Configuration
1. Create a MySQL database named `transitops` locally.
2. Configure `backend/.env` with your database connection string:
   ```env
   DATABASE_URL="mysql://root:PASSWORD@localhost:3306/transitops"
   PORT=5000
   JWT_SECRET="transitops-super-secret-key-12345"
   ```

### 3.3 Database Sync and Seeding
In the `backend/` directory, run:
```bash
# Install backend packages
npm install

# Push database schema tables to your MySQL instance
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed database with users, vehicles, and drivers
node prisma/seed.js
```

### 3.4 Start the Backend Server
In the `backend/` directory, run:
```bash
npm run dev
```
The server will start listening on port `5000` ([http://localhost:5000/api/health](http://localhost:5000/api/health)).

### 3.5 Start the Frontend Client
In the `frontend/` directory, run:
```bash
# Install frontend packages
npm install

# Run the client dev server
npm run dev
```
The client console will launch at [http://localhost:5173/](http://localhost:5173/).

---

## 4. Default Seed Credentials

The database is seeded with **54 users** with roles mapped to platform access:

### 4.1 Demo Quick-Access Profiles
You can sign in with these using the one-click quick login pills on the sign-in screen:
*   **Fleet Manager**: `manager@transitops.com` / `manager123`
*   **Safety Officer**: `safety@transitops.com` / `safety123`
*   **Financial Analyst**: `finance@transitops.com` / `finance123`
*   **Driver**: `driver@transitops.com` / `driver123`

### 4.2 Programmatic Scale Users (50 accounts)
Seeded for cybersecurity verification and load checking:
*   **Emails**: `user1@transitops.com` through `user50@transitops.com`
*   **Passwords**: `password1` through `password50`
*   **Roles**: Cyclic roles (`FleetManager`, `Driver`, `SafetyOfficer`, `FinancialAnalyst`).

---

## 5. Security & Access Rules

1.  **Strict Authentication Check**: All routes (except `/login`) verify signed JWT tokens.
2.  **Role-Based Access Control (RBAC)**:
    *   *Vehicles & Drivers registry*: Managed by `FleetManager` and `SafetyOfficer`.
    *   *Trip Dispatches & Telemetry*: Managed by `FleetManager`.
    *   *Maintenance Logs*: Opened/Closed by `FleetManager`.
    *   *Fuel Runs & Operational Expenses*: Mutated by `FleetManager` and `FinancialAnalyst`.
3.  **Data Sanitization**: Input parameters (cargo weight, odometer, fuel quantities) are validated on the server. Out of bounds values are rejected.
4.  **SQL Injection Protection**: Built on Prisma ORM, utilizing parameterized queries for all interactions.

---

## 6. Automated Testing

To run the verification suite containing **17 comprehensive tests** (verifying route protections, lifecycles, and aggregation calculations), run this in the `backend/` directory:
```bash
node src/test-api.js
```
All outputs should show `✔ Passed`.
