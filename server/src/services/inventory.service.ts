import { Base } from '../models/Base.model';
import { EquipmentType } from '../models/EquipmentType.model';
import { InventoryTransaction } from '../models/InventoryTransaction.model';
import { createAuditLog } from './audit.service';

export interface InventoryFilter {
  baseId?: string;
  equipmentTypeId?: string;
  startDate?: string;
  endDate?: string;
}

export const calculateAvailableStock = async (
  baseId: string,
  equipmentTypeId: string
): Promise<number> => {
  const transactions = await InventoryTransaction.find({
    baseId,
    equipmentTypeId,
  }).select('transactionType quantity');

  let balance = 0;
  for (const t of transactions) {
    switch (t.transactionType) {
      case 'OPENING_BALANCE':
      case 'PURCHASE':
      case 'TRANSFER_IN':
      case 'ADJUSTMENT':
        balance += t.quantity;
        break;
      case 'TRANSFER_OUT':
      case 'ASSIGNMENT':
      case 'EXPENDITURE':
        balance -= t.quantity;
        break;
    }
  }

  return balance;
};

export const createPurchaseRecord = async (data: {
  baseId: string;
  equipmentTypeId: string;
  quantity: number;
  purchaseDate: string;
  supplier?: string;
  notes?: string;
  userId: string;
  ipAddress?: string;
}) => {
  if (data.quantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }

  const base = await Base.findById(data.baseId);
  if (!base) throw new Error('Base not found');

  const equipment = await EquipmentType.findById(data.equipmentTypeId);
  if (!equipment) throw new Error('Equipment type not found');

  const transaction = await InventoryTransaction.create({
    baseId: data.baseId,
    equipmentTypeId: data.equipmentTypeId,
    transactionType: 'PURCHASE',
    quantity: Math.floor(data.quantity),
    referenceId: data.supplier || null,
    transactionDate: new Date(data.purchaseDate || Date.now()),
    createdBy: data.userId,
    notes: data.notes || null,
  });

  await createAuditLog({
    userId: data.userId,
    action: 'PURCHASE_CREATED',
    entity: 'InventoryTransaction',
    entityId: transaction._id.toString(),
    baseId: data.baseId,
    metadata: {
      equipmentTypeId: data.equipmentTypeId,
      quantity: data.quantity,
      supplier: data.supplier,
    },
    ipAddress: data.ipAddress,
  });

  return transaction;
};

export const createTransferRecord = async (data: {
  sourceBaseId: string;
  destinationBaseId: string;
  equipmentTypeId: string;
  quantity: number;
  transferDate: string;
  referenceNumber?: string;
  notes?: string;
  userId: string;
  ipAddress?: string;
}) => {
  if (data.sourceBaseId === data.destinationBaseId) {
    throw new Error('Source and destination base cannot be the same');
  }

  if (data.quantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }

  const qty = Math.floor(data.quantity);
  const date = new Date(data.transferDate || Date.now());
  const ref = data.referenceNumber || `TRF-${Date.now()}`;

  const available = await calculateAvailableStock(data.sourceBaseId, data.equipmentTypeId);
  if (available < qty) {
    throw new Error('Unable to complete the transfer. The source base does not have enough available inventory.');
  }

  const transferOut = await InventoryTransaction.create({
    baseId: data.sourceBaseId,
    equipmentTypeId: data.equipmentTypeId,
    transactionType: 'TRANSFER_OUT',
    quantity: qty,
    referenceId: ref,
    transactionDate: date,
    createdBy: data.userId,
    notes: `Transfer to destination: ${data.notes || ''}`.trim(),
  });

  const transferIn = await InventoryTransaction.create({
    baseId: data.destinationBaseId,
    equipmentTypeId: data.equipmentTypeId,
    transactionType: 'TRANSFER_IN',
    quantity: qty,
    referenceId: ref,
    transactionDate: date,
    createdBy: data.userId,
    notes: `Transfer from source: ${data.notes || ''}`.trim(),
  });

  await createAuditLog({
    userId: data.userId,
    action: 'TRANSFER_CREATED',
    entity: 'InventoryTransaction',
    entityId: transferOut._id.toString(),
    baseId: data.sourceBaseId,
    metadata: {
      sourceBaseId: data.sourceBaseId,
      destinationBaseId: data.destinationBaseId,
      equipmentTypeId: data.equipmentTypeId,
      quantity: qty,
      referenceNumber: ref,
    },
    ipAddress: data.ipAddress,
  });

  return { transferOut, transferIn };
};

export const createAssignmentRecord = async (data: {
  baseId: string;
  equipmentTypeId: string;
  quantity: number;
  personnelName: string;
  assignmentDate: string;
  notes?: string;
  userId: string;
  ipAddress?: string;
}) => {
  if (data.quantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }

  const qty = Math.floor(data.quantity);

  const available = await calculateAvailableStock(data.baseId, data.equipmentTypeId);
  if (available < qty) {
    throw new Error('Unable to assign asset. Insufficient available inventory.');
  }

  const transaction = await InventoryTransaction.create({
    baseId: data.baseId,
    equipmentTypeId: data.equipmentTypeId,
    transactionType: 'ASSIGNMENT',
    quantity: qty,
    referenceId: data.personnelName,
    transactionDate: new Date(data.assignmentDate || Date.now()),
    createdBy: data.userId,
    notes: data.notes || null,
  });

  await createAuditLog({
    userId: data.userId,
    action: 'ASSIGNMENT_CREATED',
    entity: 'InventoryTransaction',
    entityId: transaction._id.toString(),
    baseId: data.baseId,
    metadata: {
      personnelName: data.personnelName,
      equipmentTypeId: data.equipmentTypeId,
      quantity: qty,
    },
    ipAddress: data.ipAddress,
  });

  return transaction;
};

export const createExpenditureRecord = async (data: {
  baseId: string;
  equipmentTypeId: string;
  quantity: number;
  reason: string;
  expenditureDate: string;
  notes?: string;
  userId: string;
  ipAddress?: string;
}) => {
  if (data.quantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }

  const qty = Math.floor(data.quantity);

  const available = await calculateAvailableStock(data.baseId, data.equipmentTypeId);
  if (available < qty) {
    throw new Error('Unable to record expenditure. Insufficient available inventory.');
  }

  const transaction = await InventoryTransaction.create({
    baseId: data.baseId,
    equipmentTypeId: data.equipmentTypeId,
    transactionType: 'EXPENDITURE',
    quantity: qty,
    referenceId: data.reason,
    transactionDate: new Date(data.expenditureDate || Date.now()),
    createdBy: data.userId,
    notes: data.notes || null,
  });

  await createAuditLog({
    userId: data.userId,
    action: 'EXPENDITURE_CREATED',
    entity: 'InventoryTransaction',
    entityId: transaction._id.toString(),
    baseId: data.baseId,
    metadata: {
      reason: data.reason,
      equipmentTypeId: data.equipmentTypeId,
      quantity: qty,
    },
    ipAddress: data.ipAddress,
  });

  return transaction;
};

export const getDashboardMetrics = async (filters: InventoryFilter) => {
  const whereClause: any = {};
  if (filters.baseId) whereClause.baseId = filters.baseId;
  if (filters.equipmentTypeId) whereClause.equipmentTypeId = filters.equipmentTypeId;

  const startDate = filters.startDate ? new Date(filters.startDate) : null;
  const endDate = filters.endDate ? new Date(filters.endDate) : null;

  // 1. Calculate Opening Balance
  let openingBalance = 0;
  if (startDate) {
    const priorTransactions = await InventoryTransaction.find({
      ...whereClause,
      transactionDate: { $lt: startDate },
    }).select('transactionType quantity');

    for (const t of priorTransactions) {
      if (['OPENING_BALANCE', 'PURCHASE', 'TRANSFER_IN', 'ADJUSTMENT'].includes(t.transactionType)) {
        openingBalance += t.quantity;
      } else if (['TRANSFER_OUT', 'ASSIGNMENT', 'EXPENDITURE'].includes(t.transactionType)) {
        openingBalance -= t.quantity;
      }
    }
  } else {
    const initialBalances = await InventoryTransaction.find({
      ...whereClause,
      transactionType: 'OPENING_BALANCE',
    }).select('quantity');
    openingBalance = initialBalances.reduce((sum, item) => sum + item.quantity, 0);
  }

  // 2. Query period transactions
  const periodWhere: any = { ...whereClause };
  if (startDate || endDate) {
    periodWhere.transactionDate = {};
    if (startDate) periodWhere.transactionDate.$gte = startDate;
    if (endDate) periodWhere.transactionDate.$lte = endDate;
  }

  const periodTransactions = await InventoryTransaction.find(periodWhere).sort({ transactionDate: 1 });

  let purchases = 0;
  let transferIn = 0;
  let transferOut = 0;
  let assigned = 0;
  let expended = 0;

  for (const t of periodTransactions) {
    if (startDate && t.transactionType === 'OPENING_BALANCE') {
      openingBalance += t.quantity;
    } else if (t.transactionType === 'PURCHASE') {
      purchases += t.quantity;
    } else if (t.transactionType === 'TRANSFER_IN') {
      transferIn += t.quantity;
    } else if (t.transactionType === 'TRANSFER_OUT') {
      transferOut += t.quantity;
    } else if (t.transactionType === 'ASSIGNMENT') {
      assigned += t.quantity;
    } else if (t.transactionType === 'EXPENDITURE') {
      expended += t.quantity;
    }
  }

  const netMovement = purchases + transferIn - transferOut;
  const closingBalance = openingBalance + netMovement - assigned - expended;

  // Aggregations for Charts
  const equipmentMap = new Map<string, { name: string; category: string; count: number }>();
  const baseMap = new Map<string, { name: string; count: number }>();
  const timeMap = new Map<string, { date: string; purchases: number; transfers: number; net: number }>();

  const allCurrentTx = await InventoryTransaction.find(whereClause)
    .populate('equipmentType')
    .populate('base');

  for (const t of allCurrentTx) {
    let delta = 0;
    if (['OPENING_BALANCE', 'PURCHASE', 'TRANSFER_IN', 'ADJUSTMENT'].includes(t.transactionType)) {
      delta = t.quantity;
    } else if (['TRANSFER_OUT', 'ASSIGNMENT', 'EXPENDITURE'].includes(t.transactionType)) {
      delta = -t.quantity;
    }

    const eqName = (t as any).equipmentType?.name || 'Equipment';
    const eqCategory = (t as any).equipmentType?.category || 'General';
    const eqId = t.equipmentTypeId.toString();

    const eq = equipmentMap.get(eqId) || {
      name: eqName,
      category: eqCategory,
      count: 0,
    };
    eq.count += delta;
    equipmentMap.set(eqId, eq);

    const bName = (t as any).base?.name || 'Base';
    const bId = t.baseId.toString();

    const b = baseMap.get(bId) || {
      name: bName,
      count: 0,
    };
    b.count += delta;
    baseMap.set(bId, b);

    const dayStr = t.transactionDate.toISOString().split('T')[0];
    const timeEntry = timeMap.get(dayStr) || { date: dayStr, purchases: 0, transfers: 0, net: 0 };
    if (t.transactionType === 'PURCHASE') {
      timeEntry.purchases += t.quantity;
      timeEntry.net += t.quantity;
    } else if (t.transactionType === 'TRANSFER_IN') {
      timeEntry.transfers += t.quantity;
      timeEntry.net += t.quantity;
    } else if (t.transactionType === 'TRANSFER_OUT') {
      timeEntry.transfers -= t.quantity;
      timeEntry.net -= t.quantity;
    }
    timeMap.set(dayStr, timeEntry);
  }

  return {
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
      equipmentInventory: Array.from(equipmentMap.values()).map(e => ({
        ...e,
        count: Math.max(0, e.count),
      })),
      baseInventory: Array.from(baseMap.values()).map(b => ({
        ...b,
        count: Math.max(0, b.count),
      })),
      movementOverTime: Array.from(timeMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    },
  };
};

export const getNetMovementBreakdown = async (filters: InventoryFilter) => {
  const whereClause: any = {
    transactionType: { $in: ['PURCHASE', 'TRANSFER_IN', 'TRANSFER_OUT'] },
  };
  if (filters.baseId) whereClause.baseId = filters.baseId;
  if (filters.equipmentTypeId) whereClause.equipmentTypeId = filters.equipmentTypeId;

  if (filters.startDate || filters.endDate) {
    whereClause.transactionDate = {};
    if (filters.startDate) whereClause.transactionDate.$gte = new Date(filters.startDate);
    if (filters.endDate) whereClause.transactionDate.$lte = new Date(filters.endDate);
  }

  const transactions = await InventoryTransaction.find(whereClause)
    .populate('equipmentType')
    .populate('base')
    .sort({ transactionDate: -1 });

  let purchases = 0;
  let transferIn = 0;
  let transferOut = 0;

  for (const t of transactions) {
    if (t.transactionType === 'PURCHASE') purchases += t.quantity;
    if (t.transactionType === 'TRANSFER_IN') transferIn += t.quantity;
    if (t.transactionType === 'TRANSFER_OUT') transferOut += t.quantity;
  }

  const netMovement = purchases + transferIn - transferOut;

  return {
    purchases,
    transferIn,
    transferOut,
    netMovement,
    transactions,
  };
};
