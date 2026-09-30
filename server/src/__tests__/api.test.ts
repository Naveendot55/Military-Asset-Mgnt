import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import mongoose from 'mongoose';

afterAll(async () => {
  await mongoose.disconnect();
});

let adminToken: string;
let alphaToken: string;
let bravoToken: string;
let logisticsToken: string;

let alphaBaseId: string;
let bravoBaseId: string;
let rifleEquipmentId: string;
let ammoEquipmentId: string;

beforeAll(async () => {
  // 1. Get tokens
  const adminRes = await request(app).post('/api/auth/login').send({
    email: 'admin@demo.com',
    password: 'password123',
  });
  adminToken = adminRes.body.data.token;

  const alphaRes = await request(app).post('/api/auth/login').send({
    email: 'alpha@demo.com',
    password: 'password123',
  });
  alphaToken = alphaRes.body.data.token;
  alphaBaseId = alphaRes.body.data.user.baseId;

  const bravoRes = await request(app).post('/api/auth/login').send({
    email: 'bravo@demo.com',
    password: 'password123',
  });
  bravoToken = bravoRes.body.data.token;
  bravoBaseId = bravoRes.body.data.user.baseId;

  const logRes = await request(app).post('/api/auth/login').send({
    email: 'logistics@demo.com',
    password: 'password123',
  });
  logisticsToken = logRes.body.data.token;

  // 2. Query equipment IDs
  const eqRes = await request(app).get('/api/equipment').set('Authorization', `Bearer ${adminToken}`);
  const rifle = eqRes.body.data.find((e: any) => e.name.includes('Assault Rifle'));
  rifleEquipmentId = rifle.id;
  const ammo = eqRes.body.data.find((e: any) => e.name.includes('Ammunition'));
  ammoEquipmentId = ammo.id;
});

describe('1. Authentication Tests', () => {
  it('should authenticate valid user and return token and user profile', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@demo.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  it('should reject invalid credentials with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@demo.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject protected route without token with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('2. RBAC Tests', () => {
  it('Admin should be able to create a base', async () => {
    const res = await request(app)
      .post('/api/bases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Delta Outpost',
        code: `DLT-${Date.now().toString().slice(-4)}`,
        location: 'Western Hills',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('Base Commander should NOT be able to create a base (Forbidden)', async () => {
    const res = await request(app)
      .post('/api/bases')
      .set('Authorization', `Bearer ${alphaToken}`)
      .send({
        name: 'Echo Station',
        code: 'ECH',
        location: 'Southern Dunes',
      });
    expect(res.status).toBe(403);
  });

  it('Base Commander should be blocked from accessing another base data via query param', async () => {
    const res = await request(app)
      .get(`/api/dashboard?baseId=${bravoBaseId}`)
      .set('Authorization', `Bearer ${alphaToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });

  it('Logistics Officer should be blocked from creating equipment types', async () => {
    const res = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${logisticsToken}`)
      .send({
        name: 'Laser Sight',
        category: 'Accessories',
        unit: 'pcs',
      });
    expect(res.status).toBe(403);
  });
});

describe('3. Purchases & Audit Tests', () => {
  it('should allow valid purchase and create an audit log', async () => {
    const res = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        baseId: alphaBaseId,
        equipmentTypeId: rifleEquipmentId,
        quantity: 25,
        supplier: 'Defense Supply Agency',
        notes: 'Test batch purchase',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.quantity).toBe(25);

    // Verify audit log
    const auditRes = await request(app)
      .get('/api/audit-logs?action=PURCHASE_CREATED')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(auditRes.status).toBe(200);
    const log = auditRes.body.data.find((l: any) => l.entityId === res.body.data.id);
    expect(log).toBeDefined();
  });

  it('should reject purchase with invalid/negative quantity', async () => {
    const res = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        baseId: alphaBaseId,
        equipmentTypeId: rifleEquipmentId,
        quantity: -10,
      });
    expect(res.status).toBe(422); // Zod validation failure
  });

  it('Base Commander cannot create purchase for a base they do not command', async () => {
    const res = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${alphaToken}`)
      .send({
        baseId: bravoBaseId, // Alpha Commander trying to purchase for Bravo
        equipmentTypeId: rifleEquipmentId,
        quantity: 5,
      });
    expect(res.status).toBe(403);
  });
});

describe('4. Transfers & Inventory Safety Tests', () => {
  it('should reject transfer when source and destination are the same', async () => {
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sourceBaseId: alphaBaseId,
        destinationBaseId: alphaBaseId,
        equipmentTypeId: rifleEquipmentId,
        quantity: 5,
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Source and destination base cannot be the same');
  });

  it('should reject transfer when source has insufficient inventory', async () => {
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sourceBaseId: alphaBaseId,
        destinationBaseId: bravoBaseId,
        equipmentTypeId: rifleEquipmentId,
        quantity: 999999, // Impossible stock
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Unable to complete the transfer. The source base does not have enough available inventory.');
  });

  it('should atomically transfer assets and create audit log', async () => {
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sourceBaseId: alphaBaseId,
        destinationBaseId: bravoBaseId,
        equipmentTypeId: rifleEquipmentId,
        quantity: 10,
        referenceNumber: 'TRF-TEST-ATOM',
        notes: 'Test transfer atomic check',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transferOut.quantity).toBe(10);
    expect(res.body.data.transferIn.quantity).toBe(10);

    // Verify audit log
    const auditRes = await request(app)
      .get('/api/audit-logs?action=TRANSFER_CREATED')
      .set('Authorization', `Bearer ${adminToken}`);
    const log = auditRes.body.data.find((l: any) => l.entityId === res.body.data.transferOut.id);
    expect(log).toBeDefined();
  });
});

describe('5. Assignments, Expenditures, and Audit Tests', () => {
  it('should create an assignment and audit entry', async () => {
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${alphaToken}`)
      .send({
        baseId: alphaBaseId,
        equipmentTypeId: rifleEquipmentId,
        quantity: 5,
        personnelName: 'Sgt. Johnson',
        notes: 'Field rifle assignment',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const auditRes = await request(app)
      .get('/api/audit-logs?action=ASSIGNMENT_CREATED')
      .set('Authorization', `Bearer ${adminToken}`);
    const log = auditRes.body.data.find((l: any) => l.entityId === res.body.data.id);
    expect(log).toBeDefined();
  });

  it('should create an expenditure and audit entry', async () => {
    const res = await request(app)
      .post('/api/expenditures')
      .set('Authorization', `Bearer ${alphaToken}`)
      .send({
        baseId: alphaBaseId,
        equipmentTypeId: ammoEquipmentId,
        quantity: 10,
        reason: 'Target Practice',
        notes: 'Range drill',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const auditRes = await request(app)
      .get('/api/audit-logs?action=EXPENDITURE_CREATED')
      .set('Authorization', `Bearer ${adminToken}`);
    const log = auditRes.body.data.find((l: any) => l.entityId === res.body.data.id);
    expect(log).toBeDefined();
  });
});

describe('6. Dashboard & Calculation Tests', () => {
  it('should return valid dashboard metrics respecting calculation rules', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const { metrics } = res.body.data;

    expect(typeof metrics.openingBalance).toBe('number');
    expect(typeof metrics.closingBalance).toBe('number');
    expect(typeof metrics.netMovement).toBe('number');

    // Rule: Net Movement = Purchases + Transfer In - Transfer Out
    expect(metrics.netMovement).toBe(metrics.purchases + metrics.transferIn - metrics.transferOut);

    // Rule: Closing Balance = Opening Balance + Net Movement - Assigned - Expended
    expect(metrics.closingBalance).toBe(
      metrics.openingBalance + metrics.netMovement - metrics.assigned - metrics.expended
    );
  });

  it('should return net movement breakdown modal details', async () => {
    const res = await request(app)
      .get('/api/dashboard/net-movement')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.netMovement).toBe(
      res.body.data.purchases + res.body.data.transferIn - res.body.data.transferOut
    );
  });
});
