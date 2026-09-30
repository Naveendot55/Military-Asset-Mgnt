# Military Asset Management System

[![Deploy to GitHub Pages](https://github.com/Naveendot55/Military-Asset-Mgnt/actions/workflows/deploy.yml/badge.svg)](https://github.com/Naveendot55/Military-Asset-Mgnt/actions/workflows/deploy.yml)

- 🌐 **Live Application URL**: [https://naveendot55.github.io/Military-Asset-Mgnt/](https://naveendot55.github.io/Military-Asset-Mgnt/)
- 💻 **GitHub Repository**: [https://github.com/Naveendot55/Military-Asset-Mgnt](https://github.com/Naveendot55/Military-Asset-Mgnt)

A production-grade, full-stack military logistics ledger and asset tracking platform built with **React**, **Node.js/Express**, **TypeScript**, and **MongoDB**.

---

## 1. Overview
The **Military Asset Management System** is a mission-critical web application engineered to manage and audit the lifecycle of defense equipment across distributed fictional military bases. It features an immutable double-entry style ledger tracking purchases, inter-base transfers, personnel equipment assignments, and certified ammunition/wear expenditures.

---

## 2. Key Features

- **Dynamic Operational Dashboard**:
  - Real-time calculations of **Opening Balance**, **Net Movement**, **Assigned**, **Expended**, and **Closing Balance**.
  - Interactive charts powered by Recharts (inventory by equipment category, base distribution, and historical movement).
- **Accessible Net Movement Breakdown (Bonus Feature)**:
  - Accessible modal dialog breaking down `Purchases (+)`, `Transfer In (+)`, and `Transfer Out (-)`.
  - Accessible via mouse and keyboard navigation (`Escape`, Enter/Space, focus trapping).
- **Procurement & Purchases**:
  - Full purchase order registration with supplier references, quantities, and operational notes.
  - Paginated, filterable audit history.
- **Inter-Base Transfers**:
  - Dual ledger entries: `TRANSFER_OUT` at origin base and `TRANSFER_IN` at destination base.
  - Concurrency checks ensuring no transfer can push source inventory below zero.
  - Rollback safety.
- **Personnel Equipment Assignments**:
  - Assign equipment to specific fictional units or personnel with available inventory validation.
- **Asset Expenditures**:
  - Record live-fire training consumption or operational decommissioning.
- **Cryptographic Security & Audit Logs**:
  - Automatic audit records generated for every critical action (`PURCHASE_CREATED`, `TRANSFER_CREATED`, `ASSIGNMENT_CREATED`, `EXPENDITURE_CREATED`, `LOGIN_SUCCESS`, `LOGIN_FAILED`).
  - Immutable historical viewer with IP tracking and metadata payloads.
- **Enterprise Role-Based Access Control (RBAC)**:
  - Three distinct operational roles (`ADMIN`, `BASE_COMMANDER`, `LOGISTICS_OFFICER`).
  - Strict server-side authorization preventing unauthorized base access or parameter spoofing.

---

## 3. Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript (Strict Mode)
- **Tooling**: Vite
- **Styling**: Tailwind CSS (Tailored dark enterprise theme)
- **Routing**: React Router v6
- **Server State & Data Fetching**: TanStack Query (React Query)
- **Form Management**: React Hook Form + Zod
- **Visualizations**: Recharts
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js with TypeScript
- **Database & ORM**: **MongoDB** (native document storage via Prisma ORM)
- **Authentication**: Stateless JSON Web Tokens (JWT) + bcrypt password hashing
- **Input Validation**: Zod runtime schema validation
- **Security Middleware**: Helmet, CORS, and Express Rate Limiting

### Testing
- **Test Runner**: Vitest
- **HTTP Assertion**: Supertest

---

## 4. Database Architecture: MongoDB with Prisma
The system uses **MongoDB** as its primary persistent store. Prisma ORM integrates with MongoDB using native ObjectIds, cross-collection relations, and indexed queries:
1. **Document Storage**: High performance reads and writes across collections (`User`, `Base`, `EquipmentType`, `InventoryTransaction`, `AuditLog`).
2. **Compound Indexing**: Targeted compound indexes on `baseId`, `equipmentTypeId`, `transactionType`, and `transactionDate` to accelerate complex aggregation and reporting queries.
3. **Ledger Immutability**: All inventory movements are appended as distinct transactions rather than overwriting document state, preserving audit compliance.

---

## 5. Database Schema & Collections

- **`User`**: `id` (`ObjectId`), `name`, `email`, `passwordHash`, `role` (`ADMIN`, `BASE_COMMANDER`, `LOGISTICS_OFFICER`), `baseId` (`ObjectId`), `createdAt`, `updatedAt`.
- **`Base`**: `id` (`ObjectId`), `name`, `code` (unique), `location`, `createdAt`, `updatedAt`.
- **`EquipmentType`**: `id` (`ObjectId`), `name`, `category` (e.g. Vehicles, Weapons, Ammunition, Communication, Protective Equipment), `unit`, `description`.
- **`InventoryTransaction`**:
  - `id` (`ObjectId`), `baseId`, `equipmentTypeId`, `transactionType` (`OPENING_BALANCE`, `PURCHASE`, `TRANSFER_IN`, `TRANSFER_OUT`, `ASSIGNMENT`, `EXPENDITURE`), `quantity`, `referenceId`, `transactionDate`, `createdBy`, `notes`, `createdAt`.
  - Indexed by `baseId`, `equipmentTypeId`, `transactionType`, and `transactionDate`.
- **`AuditLog`**:
  - `id` (`ObjectId`), `userId`, `action`, `entity`, `entityId`, `baseId`, `metadata`, `ipAddress`, `timestamp`.

---

## 6. Inventory Calculation Logic

All metrics displayed on the dashboard are mathematically derived directly from transaction ledger records:

### 1. Opening Balance
Represents the total inventory state immediately prior to the start of the selected reporting period:
$$\text{Opening Balance} = \sum (\text{OPENING\_BALANCE} + \text{PURCHASE} + \text{TRANSFER\_IN}) - \sum (\text{TRANSFER\_OUT} + \text{ASSIGNMENT} + \text{EXPENDITURE})$$
*(For all records where $\text{transactionDate} < \text{startDate}$)*.

### 2. Net Movement
Net Movement strictly reflects logistics procurement and inter-base movement. As mandated, **Assignments and Expenditures are NOT included in Net Movement**:
$$\text{Net Movement} = \text{Purchases} + \text{Transfer In} - \text{Transfer Out}$$

### 3. Closing Balance
Represents the available, unassigned inventory remaining at the end of the reporting period:
$$\text{Closing Balance} = \text{Opening Balance} + \text{Net Movement} - \text{Assigned} - \text{Expended}$$

---

## 7. Role-Based Access Control (RBAC)

Authorization is strictly enforced **server-side** in middleware and service handlers:

| Role | Dashboard | Bases & Equipment Admin | Purchases | Transfers | Assignments & Expenditures | Audit Logs |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **ADMIN** | All Bases | Full Create/Edit | Full Access | Full Access | Full Access | Full Access |
| **BASE_COMMANDER** | Assigned Base Only | View Only | Own Base Only | Involving Own Base | Own Base Only | Own Base Only |
| **LOGISTICS_OFFICER**| All Bases | View Only | Full Access | Full Access | Blocked | Blocked |

### Base Isolation Guard
If a `BASE_COMMANDER` attempts to query or mutate records belonging to a different base via route parameters, query strings, or request bodies, the API immediately halts execution with **`403 Forbidden`**.

---

## 8. Security Architecture

- **Stateless Authentication**: Signed JWTs with an 8-hour expiry.
- **Password Security**: Strong salt-hashed passwords using `bcrypt`.
- **HTTP Security Headers**: Configured via `helmet`.
- **CORS Protection**: Restricted to authorized client origin.
- **Rate Limiting**: `express-rate-limit` prevents brute-force login and denial of service.
- **Input Sanitization & Validation**: Strong typing and Zod schemas reject invalid formats, negative quantities, or injection payloads before reaching controllers.
- **Audit Immutability**: Audit logs cannot be deleted or modified through the API.

---

## 9. API Documentation

### Authentication
- `POST /api/auth/login`: Authenticate credentials, return JWT and profile.
- `GET /api/auth/me`: Fetch current authenticated user.

### Dashboard
- `GET /api/dashboard?baseId=&equipmentTypeId=&startDate=&endDate=`: Returns metrics and chart aggregations.
- `GET /api/dashboard/net-movement?baseId=&equipmentTypeId=&startDate=&endDate=`: Returns detailed breakdown of Purchases, Transfer In, and Transfer Out.

### Operations
- `GET /api/bases` | `POST /api/bases` (Admin only)
- `GET /api/equipment` | `POST /api/equipment` (Admin only)
- `GET /api/purchases` | `POST /api/purchases`
- `GET /api/transfers` | `POST /api/transfers`
- `GET /api/assignments` | `POST /api/assignments`
- `GET /api/expenditures` | `POST /api/expenditures`
- `GET /api/audit-logs`: Paginated audit history.

---

## 10. Environment Variables

### Server (`server/.env`)
```env
DATABASE_URL="mongodb://127.0.0.1:27018/military_assets?replicaSet=rs0&directConnection=true"
JWT_SECRET="super-secret-jwt-key-change-in-production"
PORT=3000
CLIENT_URL="http://localhost:5173"
```

### Client (`client/.env`)
```env
VITE_API_URL="http://localhost:3000/api"
```

---

## 11. Installation & Running Locally

### Step 1: Install Dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### Step 2: Initialize Database & Seed
```bash
cd server
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
```

### Step 3: Run the Servers
Open two terminals:

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```
*Backend runs on `http://localhost:3000`*

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 12. Running Automated Tests

The backend test suite verifies authentication, RBAC boundaries, transfer rollbacks, validation errors, and audit log generation against MongoDB:

```bash
cd server
npm test
```

**Results:**
- `17 passing automated unit and integration tests (100% pass rate)`.

---

## 13. Demo Credentials

Quick 1-click login buttons are provided on the login page for convenience:

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@demo.com` | `password123` | Full System Access |
| **Alpha Commander** | `alpha@demo.com` | `password123` | Alpha Base Only |
| **Bravo Commander** | `bravo@demo.com` | `password123` | Bravo Base Only |
| **Logistics Officer** | `logistics@demo.com` | `password123` | Purchases & Transfers |
