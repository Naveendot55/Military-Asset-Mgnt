// Standalone Browser Mock Backend for GitHub Pages Live Demo
// Provides fully interactive, persistent in-browser database & API simulation

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'BASE_COMMANDER' | 'LOGISTICS_OFFICER';
  baseId?: string;
  base?: { id: string; name: string; code: string };
}

export interface MockBase {
  id: string;
  name: string;
  code: string;
  location: string;
}

export interface MockEquipment {
  id: string;
  name: string;
  category: string;
  unit: string;
  description: string;
}

export interface MockTransaction {
  id: string;
  baseId: string;
  equipmentTypeId: string;
  transactionType: 'OPENING_BALANCE' | 'PURCHASE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ASSIGNMENT' | 'EXPENDITURE';
  quantity: number;
  referenceId?: string;
  transactionDate: string;
  createdBy: string;
  notes?: string;
  base?: MockBase;
  equipmentType?: MockEquipment;
  user?: { id: string; name: string };
}

export interface MockAuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  baseId?: string;
  metadata?: any;
  ipAddress?: string;
  timestamp: string;
  user?: { id: string; name: string; email: string };
  base?: { id: string; name: string };
}

const STORAGE_KEY = 'mams_demo_state_v1';

const INITIAL_BASES: MockBase[] = [
  { id: 'base-alp', name: 'Alpha Base', code: 'ALP', location: 'Northern Sector' },
  { id: 'base-brv', name: 'Bravo Base', code: 'BRV', location: 'Southern Command' },
  { id: 'base-chl', name: 'Charlie Base', code: 'CHL', location: 'Eastern Frontier' },
];

const INITIAL_EQUIPMENT: MockEquipment[] = [
  { id: 'eq-veh', name: 'Armored Patrol Vehicle', category: 'Vehicles', unit: 'units', description: 'Light armored wheeled recon vehicle' },
  { id: 'eq-rif', name: 'Standard Assault Rifle (M4A1)', category: 'Weapons', unit: 'units', description: 'Standard infantry service rifle' },
  { id: 'eq-amm', name: '5.56mm Ammunition Crate', category: 'Ammunition', unit: 'crates', description: 'Crate containing 1,000 rounds' },
  { id: 'eq-rad', name: 'Tactical VHF Transceiver', category: 'Communication Equipment', unit: 'units', description: 'Secure encrypted squad radio' },
  { id: 'eq-nvg', name: 'Night Vision Goggles (Gen 3)', category: 'Optics', unit: 'pairs', description: 'Helmet-mounted night vision device' },
  { id: 'eq-med', name: 'Tactical Field Trauma Kit', category: 'Medical Supplies', unit: 'kits', description: 'Emergency IFAK individual trauma pack' },
];

const INITIAL_USERS: MockUser[] = [
  { id: 'user-admin', name: 'Commander General (Admin)', email: 'admin@demo.com', role: 'ADMIN' },
  { id: 'user-alpha', name: 'Col. Vance (Alpha Cmd)', email: 'alpha@demo.com', role: 'BASE_COMMANDER', baseId: 'base-alp', base: INITIAL_BASES[0] },
  { id: 'user-bravo', name: 'Maj. Sterling (Bravo Cmd)', email: 'bravo@demo.com', role: 'BASE_COMMANDER', baseId: 'base-brv', base: INITIAL_BASES[1] },
  { id: 'user-logistics', name: 'Lt. Hayes (Logistics)', email: 'logistics@demo.com', role: 'LOGISTICS_OFFICER' },
];

function seedTransactions(): MockTransaction[] {
  const tx: MockTransaction[] = [
    // Opening Balances
    { id: 'tx-1', baseId: 'base-alp', equipmentTypeId: 'eq-veh', transactionType: 'OPENING_BALANCE', quantity: 25, referenceId: 'INIT-A-VEH', transactionDate: '2026-09-01T00:00:00Z', createdBy: 'user-admin', notes: 'Initial base audit balance' },
    { id: 'tx-2', baseId: 'base-alp', equipmentTypeId: 'eq-rif', transactionType: 'OPENING_BALANCE', quantity: 180, referenceId: 'INIT-A-RIF', transactionDate: '2026-09-01T00:00:00Z', createdBy: 'user-admin', notes: 'Initial arsenal balance' },
    { id: 'tx-3', baseId: 'base-alp', equipmentTypeId: 'eq-amm', transactionType: 'OPENING_BALANCE', quantity: 350, referenceId: 'INIT-A-AMM', transactionDate: '2026-09-01T00:00:00Z', createdBy: 'user-admin', notes: 'Initial munitions stock' },
    { id: 'tx-4', baseId: 'base-alp', equipmentTypeId: 'eq-rad', transactionType: 'OPENING_BALANCE', quantity: 45, referenceId: 'INIT-A-RAD', transactionDate: '2026-09-01T00:00:00Z', createdBy: 'user-admin', notes: 'Initial comms gear' },
    { id: 'tx-5', baseId: 'base-brv', equipmentTypeId: 'eq-veh', transactionType: 'OPENING_BALANCE', quantity: 18, referenceId: 'INIT-B-VEH', transactionDate: '2026-09-01T00:00:00Z', createdBy: 'user-admin', notes: 'Initial inventory' },
    { id: 'tx-6', baseId: 'base-brv', equipmentTypeId: 'eq-rif', transactionType: 'OPENING_BALANCE', quantity: 120, referenceId: 'INIT-B-RIF', transactionDate: '2026-09-01T00:00:00Z', createdBy: 'user-admin', notes: 'Initial weapons' },
    { id: 'tx-7', baseId: 'base-brv', equipmentTypeId: 'eq-amm', transactionType: 'OPENING_BALANCE', quantity: 220, referenceId: 'INIT-B-AMM', transactionDate: '2026-09-01T00:00:00Z', createdBy: 'user-admin', notes: 'Initial ammo' },
    { id: 'tx-8', baseId: 'base-chl', equipmentTypeId: 'eq-rif', transactionType: 'OPENING_BALANCE', quantity: 90, referenceId: 'INIT-C-RIF', transactionDate: '2026-09-01T00:00:00Z', createdBy: 'user-admin', notes: 'Initial outpost weapons' },
    
    // Purchases
    { id: 'tx-9', baseId: 'base-alp', equipmentTypeId: 'eq-rif', transactionType: 'PURCHASE', quantity: 40, referenceId: 'PO-2026-09-001', transactionDate: '2026-09-05T10:00:00Z', createdBy: 'user-logistics', notes: 'Supplier: Colt Defense Mfg. Contract #9822.' },
    { id: 'tx-10', baseId: 'base-alp', equipmentTypeId: 'eq-amm', transactionType: 'PURCHASE', quantity: 100, referenceId: 'PO-2026-09-002', transactionDate: '2026-09-08T14:30:00Z', createdBy: 'user-logistics', notes: 'Supplier: Lake City Munitions. Bulk order.' },
    { id: 'tx-11', baseId: 'base-brv', equipmentTypeId: 'eq-veh', transactionType: 'PURCHASE', quantity: 6, referenceId: 'PO-2026-09-003', transactionDate: '2026-09-12T09:15:00Z', createdBy: 'user-admin', notes: 'Supplier: Oshkosh Defense. Upgraded reconnaissance hulls.' },
    
    // Transfers
    { id: 'tx-12', baseId: 'base-alp', equipmentTypeId: 'eq-rif', transactionType: 'TRANSFER_OUT', quantity: 20, referenceId: 'TRF-001-ALPHA-BRAVO', transactionDate: '2026-09-15T11:00:00Z', createdBy: 'user-logistics', notes: 'Redeployment of rifles to Southern Command.' },
    { id: 'tx-13', baseId: 'base-brv', equipmentTypeId: 'eq-rif', transactionType: 'TRANSFER_IN', quantity: 20, referenceId: 'TRF-001-ALPHA-BRAVO', transactionDate: '2026-09-15T11:00:00Z', createdBy: 'user-logistics', notes: 'Received transfer from Alpha Base.' },

    // Assignments
    { id: 'tx-14', baseId: 'base-alp', equipmentTypeId: 'eq-rif', transactionType: 'ASSIGNMENT', quantity: 30, referenceId: '3rd Infantry Scout Platoon', transactionDate: '2026-09-18T08:00:00Z', createdBy: 'user-alpha', notes: 'Standard patrol deployment.' },
    { id: 'tx-15', baseId: 'base-alp', equipmentTypeId: 'eq-rad', transactionType: 'ASSIGNMENT', quantity: 10, referenceId: 'Recon Comms Unit B', transactionDate: '2026-09-20T09:00:00Z', createdBy: 'user-alpha', notes: 'Border patrol field exercise.' },
    
    // Expenditures
    { id: 'tx-16', baseId: 'base-alp', equipmentTypeId: 'eq-amm', transactionType: 'EXPENDITURE', quantity: 50, referenceId: 'Live Fire Q3 Exercise', transactionDate: '2026-09-22T16:00:00Z', createdBy: 'user-alpha', notes: 'Certified spent cartridges returned to depot.' },
    { id: 'tx-17', baseId: 'base-brv', equipmentTypeId: 'eq-amm', transactionType: 'EXPENDITURE', quantity: 30, referenceId: 'Field Marksmanship Qualification', transactionDate: '2026-09-25T15:30:00Z', createdBy: 'user-bravo', notes: 'Range safety inspection certified.' },
  ];
  return tx;
}

function seedAuditLogs(): MockAuditLog[] {
  return [
    { id: 'aud-1', userId: 'user-admin', action: 'LOGIN_SUCCESS', entity: 'User', entityId: 'user-admin', ipAddress: '127.0.0.1', timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
    { id: 'aud-2', userId: 'user-logistics', action: 'PURCHASE_CREATED', entity: 'InventoryTransaction', entityId: 'tx-9', baseId: 'base-alp', metadata: { supplier: 'Colt Defense Mfg', quantity: 40 }, ipAddress: '192.168.1.10', timestamp: '2026-09-05T10:00:00Z' },
    { id: 'aud-3', userId: 'user-logistics', action: 'TRANSFER_CREATED', entity: 'InventoryTransaction', entityId: 'tx-12', baseId: 'base-alp', metadata: { destinationBaseId: 'base-brv', quantity: 20 }, ipAddress: '192.168.1.10', timestamp: '2026-09-15T11:00:00Z' },
    { id: 'aud-4', userId: 'user-alpha', action: 'ASSIGNMENT_CREATED', entity: 'InventoryTransaction', entityId: 'tx-14', baseId: 'base-alp', metadata: { personnelName: '3rd Infantry Scout Platoon', quantity: 30 }, ipAddress: '192.168.1.15', timestamp: '2026-09-18T08:00:00Z' },
    { id: 'aud-5', userId: 'user-alpha', action: 'EXPENDITURE_CREATED', entity: 'InventoryTransaction', entityId: 'tx-16', baseId: 'base-alp', metadata: { reason: 'Live Fire Q3 Exercise', quantity: 50 }, ipAddress: '192.168.1.15', timestamp: '2026-09-22T16:00:00Z' },
  ];
}

interface DemoState {
  bases: MockBase[];
  equipment: MockEquipment[];
  transactions: MockTransaction[];
  auditLogs: MockAuditLog[];
}

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read localStorage demo state', e);
  }

  const initial: DemoState = {
    bases: INITIAL_BASES,
    equipment: INITIAL_EQUIPMENT,
    transactions: seedTransactions(),
    auditLogs: seedAuditLogs(),
  };
  saveState(initial);
  return initial;
}

function saveState(state: DemoState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save localStorage demo state', e);
  }
}

export function isStandaloneDemo(): boolean {
  if (typeof window === 'undefined') return false;
  // Always use mock backend when hosted on GitHub Pages (github.io)
  if (window.location.hostname.endsWith('github.io')) return true;
  // Or if user explicitly chose standalone demo mode
  if (localStorage.getItem('mams_use_demo_mode') === 'true') return true;
  return false;
}

export function enableDemoMode(enable: boolean) {
  localStorage.setItem('mams_use_demo_mode', enable ? 'true' : 'false');
  window.location.reload();
}

// Mock Request Handler
export async function handleMockRequest(method: string, url: string, data?: any): Promise<any> {
  const state = loadState();
  const cleanUrl = url.split('?')[0].replace(/^\/api/, '');
  const queryString = url.includes('?') ? url.split('?')[1] : '';
  const searchParams = new URLSearchParams(queryString);

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null') || INITIAL_USERS[0];

  // Delay simulation for realistic feel (100ms)
  await new Promise((resolve) => setTimeout(resolve, 80));

  // 1. POST /auth/login
  if (cleanUrl === '/auth/login' && method.toLowerCase() === 'post') {
    const { email, password } = data || {};
    const found = INITIAL_USERS.find((u) => u.email.toLowerCase() === email?.toLowerCase());
    if (found && password === 'password123') {
      const token = 'demo-jwt-token-' + found.id;
      const audit: MockAuditLog = {
        id: 'aud-' + Date.now(),
        userId: found.id,
        action: 'LOGIN_SUCCESS',
        entity: 'User',
        entityId: found.id,
        ipAddress: '127.0.0.1 (Demo Mode)',
        timestamp: new Date().toISOString(),
        user: { id: found.id, name: found.name, email: found.email },
      };
      state.auditLogs.unshift(audit);
      saveState(state);
      return {
        success: true,
        message: 'Login successful (Browser Demo Mode)',
        data: { token, user: found },
      };
    }
    const err: any = new Error('Invalid credentials');
    err.response = { status: 401, data: { success: false, message: 'Invalid credentials. Password is password123' } };
    throw err;
  }

  // 2. GET /auth/me
  if (cleanUrl === '/auth/me') {
    return { success: true, data: { user: currentUser } };
  }

  // 3. GET /bases
  if (cleanUrl === '/bases') {
    return { success: true, data: state.bases };
  }

  // 4. GET /equipment
  if (cleanUrl === '/equipment') {
    return { success: true, data: state.equipment };
  }

  // 5. GET /dashboard
  if (cleanUrl === '/dashboard') {
    const baseId = searchParams.get('baseId') || (currentUser.role === 'BASE_COMMANDER' ? currentUser.baseId : undefined);
    const equipmentTypeId = searchParams.get('equipmentTypeId') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : null;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : null;

    let filtered = state.transactions;
    if (baseId) filtered = filtered.filter((t) => t.baseId === baseId);
    if (equipmentTypeId) filtered = filtered.filter((t) => t.equipmentTypeId === equipmentTypeId);

    let openingBalance = 0;
    let purchases = 0;
    let transferIn = 0;
    let transferOut = 0;
    let assigned = 0;
    let expended = 0;

    for (const t of filtered) {
      const tDate = new Date(t.transactionDate);
      if (startDate && tDate < startDate) {
        if (['OPENING_BALANCE', 'PURCHASE', 'TRANSFER_IN'].includes(t.transactionType)) {
          openingBalance += t.quantity;
        } else {
          openingBalance -= t.quantity;
        }
        continue;
      }

      if (endDate && tDate > endDate) continue;

      if (t.transactionType === 'OPENING_BALANCE') openingBalance += t.quantity;
      else if (t.transactionType === 'PURCHASE') purchases += t.quantity;
      else if (t.transactionType === 'TRANSFER_IN') transferIn += t.quantity;
      else if (t.transactionType === 'TRANSFER_OUT') transferOut += t.quantity;
      else if (t.transactionType === 'ASSIGNMENT') assigned += t.quantity;
      else if (t.transactionType === 'EXPENDITURE') expended += t.quantity;
    }

    const netMovement = purchases + transferIn - transferOut;
    const closingBalance = openingBalance + netMovement - assigned - expended;

    // Charts
    const eqMap = new Map<string, { name: string; category: string; count: number }>();
    const bMap = new Map<string, { name: string; count: number }>();
    const timeMap = new Map<string, { date: string; purchases: number; transfers: number; net: number }>();

    for (const t of filtered) {
      let delta = 0;
      if (['OPENING_BALANCE', 'PURCHASE', 'TRANSFER_IN'].includes(t.transactionType)) delta = t.quantity;
      else delta = -t.quantity;

      const eq = state.equipment.find((e) => e.id === t.equipmentTypeId);
      if (eq) {
        const item = eqMap.get(eq.id) || { name: eq.name, category: eq.category, count: 0 };
        item.count += delta;
        eqMap.set(eq.id, item);
      }

      const b = state.bases.find((base) => base.id === t.baseId);
      if (b) {
        const item = bMap.get(b.id) || { name: b.name, count: 0 };
        item.count += delta;
        bMap.set(b.id, item);
      }

      const dateStr = t.transactionDate.split('T')[0];
      const timeItem = timeMap.get(dateStr) || { date: dateStr, purchases: 0, transfers: 0, net: 0 };
      if (t.transactionType === 'PURCHASE') {
        timeItem.purchases += t.quantity;
        timeItem.net += t.quantity;
      } else if (t.transactionType === 'TRANSFER_IN') {
        timeItem.transfers += t.quantity;
        timeItem.net += t.quantity;
      } else if (t.transactionType === 'TRANSFER_OUT') {
        timeItem.transfers -= t.quantity;
        timeItem.net -= t.quantity;
      }
      timeMap.set(dateStr, timeItem);
    }

    return {
      success: true,
      data: {
        metrics: {
          openingBalance,
          closingBalance,
          netMovement,
          purchases,
          transferIn,
          transferOut,
          assigned,
          expended,
        },
        charts: {
          equipmentInventory: Array.from(eqMap.values()).map((e) => ({ ...e, count: Math.max(0, e.count) })),
          baseInventory: Array.from(bMap.values()).map((b) => ({ ...b, count: Math.max(0, b.count) })),
          movementOverTime: Array.from(timeMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
        },
      },
    };
  }

  // 6. GET /dashboard/net-movement
  if (cleanUrl === '/dashboard/net-movement') {
    const baseId = searchParams.get('baseId') || (currentUser.role === 'BASE_COMMANDER' ? currentUser.baseId : undefined);
    const equipmentTypeId = searchParams.get('equipmentTypeId') || undefined;

    let filtered = state.transactions.filter((t) => ['PURCHASE', 'TRANSFER_IN', 'TRANSFER_OUT'].includes(t.transactionType));
    if (baseId) filtered = filtered.filter((t) => t.baseId === baseId);
    if (equipmentTypeId) filtered = filtered.filter((t) => t.equipmentTypeId === equipmentTypeId);

    let purchases = 0;
    let transferIn = 0;
    let transferOut = 0;

    for (const t of filtered) {
      if (t.transactionType === 'PURCHASE') purchases += t.quantity;
      if (t.transactionType === 'TRANSFER_IN') transferIn += t.quantity;
      if (t.transactionType === 'TRANSFER_OUT') transferOut += t.quantity;
    }

    const netMovement = purchases + transferIn - transferOut;

    const populated = filtered.map((t) => ({
      ...t,
      base: state.bases.find((b) => b.id === t.baseId),
      equipmentType: state.equipment.find((e) => e.id === t.equipmentTypeId),
    }));

    return {
      success: true,
      data: {
        purchases,
        transferIn,
        transferOut,
        netMovement,
        transactions: populated,
      },
    };
  }

  // 7. GET /purchases & POST /purchases
  if (cleanUrl === '/purchases') {
    if (method.toLowerCase() === 'post') {
      const newTx: MockTransaction = {
        id: 'tx-' + Date.now(),
        baseId: data.baseId,
        equipmentTypeId: data.equipmentTypeId,
        transactionType: 'PURCHASE',
        quantity: parseInt(data.quantity, 10),
        referenceId: data.supplier ? `PO-${Date.now()} (${data.supplier})` : `PO-${Date.now()}`,
        transactionDate: data.purchaseDate || new Date().toISOString(),
        createdBy: currentUser.id,
        notes: `Supplier: ${data.supplier || 'N/A'}. ${data.notes || ''}`.trim(),
      };
      state.transactions.unshift(newTx);

      state.auditLogs.unshift({
        id: 'aud-' + Date.now(),
        userId: currentUser.id,
        action: 'PURCHASE_CREATED',
        entity: 'InventoryTransaction',
        entityId: newTx.id,
        baseId: data.baseId,
        metadata: { supplier: data.supplier, quantity: data.quantity },
        ipAddress: '127.0.0.1 (Demo Mode)',
        timestamp: new Date().toISOString(),
        user: { id: currentUser.id, name: currentUser.name, email: currentUser.email },
      });
      saveState(state);

      return {
        success: true,
        message: 'Purchase registered successfully (Demo Mode)',
        data: { purchase: newTx },
      };
    }

    // GET /purchases
    let items = state.transactions.filter((t) => t.transactionType === 'PURCHASE');
    const baseId = searchParams.get('baseId');
    const eqId = searchParams.get('equipmentTypeId');
    if (baseId) items = items.filter((t) => t.baseId === baseId);
    if (eqId) items = items.filter((t) => t.equipmentTypeId === eqId);

    const populated = items.map((t) => ({
      ...t,
      base: state.bases.find((b) => b.id === t.baseId),
      equipmentType: state.equipment.find((e) => e.id === t.equipmentTypeId),
      user: INITIAL_USERS.find((u) => u.id === t.createdBy),
    }));

    return {
      success: true,
      data: populated,
      pagination: { total: populated.length, page: 1, limit: 50, totalPages: 1 },
    };
  }

  // 8. GET /transfers & POST /transfers
  if (cleanUrl === '/transfers') {
    if (method.toLowerCase() === 'post') {
      const qty = parseInt(data.quantity, 10);
      const ref = data.referenceNumber || `TRF-${Date.now()}`;
      const date = data.transferDate || new Date().toISOString();

      const outTx: MockTransaction = {
        id: 'tx-' + Date.now() + '-out',
        baseId: data.sourceBaseId,
        equipmentTypeId: data.equipmentTypeId,
        transactionType: 'TRANSFER_OUT',
        quantity: qty,
        referenceId: ref,
        transactionDate: date,
        createdBy: currentUser.id,
        notes: `Transfer to destination: ${data.notes || ''}`.trim(),
      };

      const inTx: MockTransaction = {
        id: 'tx-' + Date.now() + '-in',
        baseId: data.destinationBaseId,
        equipmentTypeId: data.equipmentTypeId,
        transactionType: 'TRANSFER_IN',
        quantity: qty,
        referenceId: ref,
        transactionDate: date,
        createdBy: currentUser.id,
        notes: `Transfer received from source: ${data.notes || ''}`.trim(),
      };

      state.transactions.unshift(inTx);
      state.transactions.unshift(outTx);

      state.auditLogs.unshift({
        id: 'aud-' + Date.now(),
        userId: currentUser.id,
        action: 'TRANSFER_CREATED',
        entity: 'InventoryTransaction',
        entityId: outTx.id,
        baseId: data.sourceBaseId,
        metadata: { destinationBaseId: data.destinationBaseId, quantity: qty },
        ipAddress: '127.0.0.1 (Demo Mode)',
        timestamp: new Date().toISOString(),
        user: { id: currentUser.id, name: currentUser.name, email: currentUser.email },
      });
      saveState(state);

      return {
        success: true,
        message: 'Transfer dispatched successfully (Demo Mode)',
        data: { transferOut: outTx, transferIn: inTx },
      };
    }

    // GET /transfers
    const transferOutList = state.transactions.filter((t) => t.transactionType === 'TRANSFER_OUT');
    let filtered = transferOutList;
    const baseId = searchParams.get('baseId');
    if (baseId) filtered = filtered.filter((t) => t.baseId === baseId);

    const formatted = filtered.map((tout) => {
      const tin = state.transactions.find((t) => t.transactionType === 'TRANSFER_IN' && t.referenceId === tout.referenceId);
      const sBase = state.bases.find((b) => b.id === tout.baseId);
      const dBase = tin ? state.bases.find((b) => b.id === tin.baseId) : null;
      const eq = state.equipment.find((e) => e.id === tout.equipmentTypeId);
      const u = INITIAL_USERS.find((usr) => usr.id === tout.createdBy);

      return {
        id: tout.id,
        reference: tout.referenceId,
        sourceBase: sBase?.name || 'Alpha Base',
        sourceBaseId: tout.baseId,
        destinationBase: dBase?.name || 'Bravo Base',
        equipment: eq?.name || 'Assault Rifle',
        category: eq?.category || 'Weapons',
        quantity: tout.quantity,
        timestamp: tout.transactionDate,
        user: u?.name || 'System',
        notes: tout.notes,
        status: 'COMPLETED',
      };
    });

    return {
      success: true,
      data: formatted,
      pagination: { total: formatted.length, page: 1, limit: 50, totalPages: 1 },
    };
  }

  // 9. GET /assignments & POST /assignments
  if (cleanUrl === '/assignments') {
    if (method.toLowerCase() === 'post') {
      const qty = parseInt(data.quantity, 10);
      const newTx: MockTransaction = {
        id: 'tx-' + Date.now(),
        baseId: data.baseId,
        equipmentTypeId: data.equipmentTypeId,
        transactionType: 'ASSIGNMENT',
        quantity: qty,
        referenceId: data.personnelName,
        transactionDate: data.assignmentDate || new Date().toISOString(),
        createdBy: currentUser.id,
        notes: data.notes || '',
      };
      state.transactions.unshift(newTx);

      state.auditLogs.unshift({
        id: 'aud-' + Date.now(),
        userId: currentUser.id,
        action: 'ASSIGNMENT_CREATED',
        entity: 'InventoryTransaction',
        entityId: newTx.id,
        baseId: data.baseId,
        metadata: { personnelName: data.personnelName, quantity: qty },
        ipAddress: '127.0.0.1 (Demo Mode)',
        timestamp: new Date().toISOString(),
        user: { id: currentUser.id, name: currentUser.name, email: currentUser.email },
      });
      saveState(state);

      return {
        success: true,
        message: 'Asset assigned successfully (Demo Mode)',
        data: { assignment: newTx },
      };
    }

    let items = state.transactions.filter((t) => t.transactionType === 'ASSIGNMENT');
    const baseId = searchParams.get('baseId');
    if (baseId) items = items.filter((t) => t.baseId === baseId);

    const populated = items.map((t) => ({
      ...t,
      personnelName: t.referenceId,
      base: state.bases.find((b) => b.id === t.baseId),
      equipmentType: state.equipment.find((e) => e.id === t.equipmentTypeId),
      user: INITIAL_USERS.find((u) => u.id === t.createdBy),
    }));

    return {
      success: true,
      data: populated,
      pagination: { total: populated.length, page: 1, limit: 50, totalPages: 1 },
    };
  }

  // 10. GET /expenditures & POST /expenditures
  if (cleanUrl === '/expenditures') {
    if (method.toLowerCase() === 'post') {
      const qty = parseInt(data.quantity, 10);
      const newTx: MockTransaction = {
        id: 'tx-' + Date.now(),
        baseId: data.baseId,
        equipmentTypeId: data.equipmentTypeId,
        transactionType: 'EXPENDITURE',
        quantity: qty,
        referenceId: data.reason,
        transactionDate: data.expenditureDate || new Date().toISOString(),
        createdBy: currentUser.id,
        notes: data.notes || '',
      };
      state.transactions.unshift(newTx);

      state.auditLogs.unshift({
        id: 'aud-' + Date.now(),
        userId: currentUser.id,
        action: 'EXPENDITURE_CREATED',
        entity: 'InventoryTransaction',
        entityId: newTx.id,
        baseId: data.baseId,
        metadata: { reason: data.reason, quantity: qty },
        ipAddress: '127.0.0.1 (Demo Mode)',
        timestamp: new Date().toISOString(),
        user: { id: currentUser.id, name: currentUser.name, email: currentUser.email },
      });
      saveState(state);

      return {
        success: true,
        message: 'Expenditure recorded successfully (Demo Mode)',
        data: { expenditure: newTx },
      };
    }

    let items = state.transactions.filter((t) => t.transactionType === 'EXPENDITURE');
    const baseId = searchParams.get('baseId');
    if (baseId) items = items.filter((t) => t.baseId === baseId);

    const populated = items.map((t) => ({
      ...t,
      reason: t.referenceId,
      base: state.bases.find((b) => b.id === t.baseId),
      equipmentType: state.equipment.find((e) => e.id === t.equipmentTypeId),
      user: INITIAL_USERS.find((u) => u.id === t.createdBy),
    }));

    return {
      success: true,
      data: populated,
      pagination: { total: populated.length, page: 1, limit: 50, totalPages: 1 },
    };
  }

  // 11. GET /audit-logs
  if (cleanUrl === '/audit-logs' || cleanUrl === '/audit') {
    const populated = state.auditLogs.map((log) => ({
      ...log,
      user: log.user || INITIAL_USERS.find((u) => u.id === log.userId),
      base: log.baseId ? state.bases.find((b) => b.id === log.baseId) : undefined,
    }));

    return {
      success: true,
      data: populated,
      pagination: { total: populated.length, page: 1, limit: 50, totalPages: 1 },
    };
  }

  throw new Error(`Unhandled mock route: ${method} ${cleanUrl}`);
}
