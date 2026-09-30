import prisma from '../config/db';
import { createAuditLog } from './audit.service';

export interface InventoryFilter {
  baseId?: string;
  equipmentTypeId?: string;
  startDate?: string;
  endDate?: string;
}

export const calculateAvailableStock = async (
  baseId: string,
  equipmentTypeId: string,
  tx: any = prisma
): Promise<number> => {
  const transactions = await tx.inventoryTransaction.findMany({
    where: {
      baseId,
      equipmentTypeId,
    },
    select: {
      transactionType: true,
      quantity: true,
    },
  });

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

  const base = await prisma.base.findUnique({ where: { id: data.baseId } });
  if (!base) throw new Error('Base not found');

  const equipment = await prisma.equipmentType.findUnique({ where: { id: data.equipmentTypeId } });
  if (!equipment) throw new Error('Equipment type not found');

  const transaction = await prisma.inventoryTransaction.create({
    data: {
      baseId: data.baseId,
      equipmentTypeId: data.equipmentTypeId,
      transactionType: 'PURCHASE',
      quantity: Math.floor(data.quantity),
      referenceId: data.supplier || null,
      transactionDate: new Date(data.purchaseDate || Date.now()),
      createdBy: data.userId,
      notes: data.notes || null,
    },
  });

  await createAuditLog({
    userId: data.userId,
    action: 'PURCHASE_CREATED',
    entity: 'InventoryTransaction',
    entityId: transaction.id,
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

  // Atomic database transaction with standalone MongoDB fallback
  const executeTransfer = async (client: any) => {
    const available = await calculateAvailableStock(data.sourceBaseId, data.equipmentTypeId, client);
    if (available < qty) {
      throw new Error('Unable to complete the transfer. The source base does not have enough available inventory.');
    }

    const transferOut = await client.inventoryTransaction.create({
      data: {
        baseId: data.sourceBaseId,
        equipmentTypeId: data.equipmentTypeId,
        transactionType: 'TRANSFER_OUT',
        quantity: qty,
        referenceId: ref,
        transactionDate: date,
        createdBy: data.userId,
        notes: `Transfer to destination: ${data.notes || ''}`.trim(),
      },
    });

    const transferIn = await client.inventoryTransaction.create({
      data: {
        baseId: data.destinationBaseId,
        equipmentTypeId: data.equipmentTypeId,
        transactionType: 'TRANSFER_IN',
        quantity: qty,
        referenceId: ref,
        transactionDate: date,
        createdBy: data.userId,
        notes: `Transfer from source: ${data.notes || ''}`.trim(),
      },
    });

    return { transferOut, transferIn };
  };

  let result;
  try {
    result = await prisma.$transaction(async (tx) => executeTransfer(tx));
  } catch (error: any) {
    if (
      error.message?.includes('Transactions are not supported') ||
      error.message?.includes('replica set')
    ) {
      result = await executeTransfer(prisma);
    } else {
      throw error;
    }
  }

  await createAuditLog({
    userId: data.userId,
    action: 'TRANSFER_CREATED',
    entity: 'InventoryTransaction',
    entityId: result.transferOut.id,
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

  return result;
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

  const executeAssignment = async (client: any) => {
    const available = await calculateAvailableStock(data.baseId, data.equipmentTypeId, client);
    if (available < qty) {
      throw new Error('Unable to assign asset. Insufficient available inventory.');
    }

    return await client.inventoryTransaction.create({
      data: {
        baseId: data.baseId,
        equipmentTypeId: data.equipmentTypeId,
        transactionType: 'ASSIGNMENT',
        quantity: qty,
        referenceId: data.personnelName,
        transactionDate: new Date(data.assignmentDate || Date.now()),
        createdBy: data.userId,
        notes: data.notes || null,
      },
    });
  };

  let result;
  try {
    result = await prisma.$transaction(async (tx) => executeAssignment(tx));
  } catch (error: any) {
    if (
      error.message?.includes('Transactions are not supported') ||
      error.message?.includes('replica set')
    ) {
      result = await executeAssignment(prisma);
    } else {
      throw error;
    }
  }

  await createAuditLog({
    userId: data.userId,
    action: 'ASSIGNMENT_CREATED',
    entity: 'InventoryTransaction',
    entityId: result.id,
    baseId: data.baseId,
    metadata: {
      personnelName: data.personnelName,
      equipmentTypeId: data.equipmentTypeId,
      quantity: qty,
    },
    ipAddress: data.ipAddress,
  });

  return result;
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

  const executeExpenditure = async (client: any) => {
    const available = await calculateAvailableStock(data.baseId, data.equipmentTypeId, client);
    if (available < qty) {
      throw new Error('Unable to record expenditure. Insufficient available inventory.');
    }

    return await client.inventoryTransaction.create({
      data: {
        baseId: data.baseId,
        equipmentTypeId: data.equipmentTypeId,
        transactionType: 'EXPENDITURE',
        quantity: qty,
        referenceId: data.reason,
        transactionDate: new Date(data.expenditureDate || Date.now()),
        createdBy: data.userId,
        notes: data.notes || null,
      },
    });
  };

  let result;
  try {
    result = await prisma.$transaction(async (tx) => executeExpenditure(tx));
  } catch (error: any) {
    if (
      error.message?.includes('Transactions are not supported') ||
      error.message?.includes('replica set')
    ) {
      result = await executeExpenditure(prisma);
    } else {
      throw error;
    }
  }

  await createAuditLog({
    userId: data.userId,
    action: 'EXPENDITURE_CREATED',
    entity: 'InventoryTransaction',
    entityId: result.id,
    baseId: data.baseId,
    metadata: {
      reason: data.reason,
      equipmentTypeId: data.equipmentTypeId,
      quantity: qty,
    },
    ipAddress: data.ipAddress,
  });

  return result;
};

export const getDashboardMetrics = async (filters: InventoryFilter) => {
  const whereClause: any = {};
  if (filters.baseId) whereClause.baseId = filters.baseId;
  if (filters.equipmentTypeId) whereClause.equipmentTypeId = filters.equipmentTypeId;

  const startDate = filters.startDate ? new Date(filters.startDate) : null;
  const endDate = filters.endDate ? new Date(filters.endDate) : null;

  // 1. Calculate Opening Balance: all transactions before startDate (or 0 if no prior epoch)
  let openingBalance = 0;
  if (startDate) {
    const priorTransactions = await prisma.inventoryTransaction.findMany({
      where: {
        ...whereClause,
        transactionDate: { lt: startDate },
      },
      select: { transactionType: true, quantity: true },
    });

    for (const t of priorTransactions) {
      if (['OPENING_BALANCE', 'PURCHASE', 'TRANSFER_IN', 'ADJUSTMENT'].includes(t.transactionType)) {
        openingBalance += t.quantity;
      } else if (['TRANSFER_OUT', 'ASSIGNMENT', 'EXPENDITURE'].includes(t.transactionType)) {
        openingBalance -= t.quantity;
      }
    }
  } else {
    // If no startDate provided, opening balance is from the original OPENING_BALANCE records
    const initialBalances = await prisma.inventoryTransaction.aggregate({
      where: {
        ...whereClause,
        transactionType: 'OPENING_BALANCE',
      },
      _sum: { quantity: true },
    });
    openingBalance = initialBalances._sum.quantity || 0;
  }

  // 2. Query period transactions
  const periodWhere: any = { ...whereClause };
  if (startDate || endDate) {
    periodWhere.transactionDate = {};
    if (startDate) periodWhere.transactionDate.gte = startDate;
    if (endDate) periodWhere.transactionDate.lte = endDate;
  }

  const periodTransactions = await prisma.inventoryTransaction.findMany({
    where: periodWhere,
    include: {
      equipmentType: true,
      base: true,
    },
    orderBy: { transactionDate: 'asc' },
  });

  let purchases = 0;
  let transferIn = 0;
  let transferOut = 0;
  let assigned = 0;
  let expended = 0;

  for (const t of periodTransactions) {
    if (startDate && t.transactionType === 'OPENING_BALANCE') {
      // If within filtered window, opening balance created during window adds to inventory
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

  // Exact required formulas:
  // Net Movement: Purchases + Transfer In - Transfer Out (DO NOT include assignments or expenditures)
  const netMovement = purchases + transferIn - transferOut;

  // Closing Balance: Opening Balance + Net Movement - Assigned - Expended
  const closingBalance = openingBalance + netMovement - assigned - expended;

  // Aggregations for Charts
  // 1. By Equipment Type
  const equipmentMap = new Map<string, { name: string; category: string; count: number }>();
  // 2. By Base
  const baseMap = new Map<string, { name: string; count: number }>();
  // 3. Movement over time
  const timeMap = new Map<string, { date: string; purchases: number; transfers: number; net: number }>();

  // To show current closing stock per equipment type
  const allCurrentTx = await prisma.inventoryTransaction.findMany({
    where: whereClause,
    include: { equipmentType: true, base: true },
  });

  for (const t of allCurrentTx) {
    let delta = 0;
    if (['OPENING_BALANCE', 'PURCHASE', 'TRANSFER_IN', 'ADJUSTMENT'].includes(t.transactionType)) {
      delta = t.quantity;
    } else if (['TRANSFER_OUT', 'ASSIGNMENT', 'EXPENDITURE'].includes(t.transactionType)) {
      delta = -t.quantity;
    }

    // Equipment breakdown
    const eq = equipmentMap.get(t.equipmentTypeId) || {
      name: t.equipmentType.name,
      category: t.equipmentType.category,
      count: 0,
    };
    eq.count += delta;
    equipmentMap.set(t.equipmentTypeId, eq);

    // Base breakdown
    const b = baseMap.get(t.baseId) || {
      name: t.base.name,
      count: 0,
    };
    b.count += delta;
    baseMap.set(t.baseId, b);

    // Time series (formatted YYYY-MM-DD)
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
  const whereClause: any = {};
  if (filters.baseId) whereClause.baseId = filters.baseId;
  if (filters.equipmentTypeId) whereClause.equipmentTypeId = filters.equipmentTypeId;

  if (filters.startDate || filters.endDate) {
    whereClause.transactionDate = {};
    if (filters.startDate) whereClause.transactionDate.gte = new Date(filters.startDate);
    if (filters.endDate) whereClause.transactionDate.lte = new Date(filters.endDate);
  }

  const transactions = await prisma.inventoryTransaction.findMany({
    where: {
      ...whereClause,
      transactionType: { in: ['PURCHASE', 'TRANSFER_IN', 'TRANSFER_OUT'] },
    },
    include: { equipmentType: true, base: true },
    orderBy: { transactionDate: 'desc' },
  });

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
