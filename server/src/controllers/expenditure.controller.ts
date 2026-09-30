import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { createExpenditureRecord } from '../services/inventory.service';

const expenditureSchema = z.object({
  baseId: z.string().min(1, 'Base is required'),
  equipmentTypeId: z.string().min(1, 'Equipment type is required'),
  quantity: z.number().int().positive('Quantity must be an integer greater than 0'),
  reason: z.string().min(2, 'Reason/Category is required'),
  expenditureDate: z.string().optional(),
  notes: z.string().optional(),
});

export const getExpenditures = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let { baseId, equipmentTypeId, startDate, endDate, page = '1', limit = '20' } = req.query as any;

    if (req.user?.role === 'BASE_COMMANDER') {
      if (baseId && baseId !== req.user.baseId) {
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot access another base expenditures' });
      }
      baseId = req.user.baseId;
    }

    const where: any = { transactionType: 'EXPENDITURE' };
    if (baseId) where.baseId = baseId;
    if (equipmentTypeId) where.equipmentTypeId = equipmentTypeId;
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate);
      if (endDate) where.transactionDate.lte = new Date(endDate);
    }

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const [total, items] = await Promise.all([
      prisma.inventoryTransaction.count({ where }),
      prisma.inventoryTransaction.findMany({
        where,
        include: { base: true, equipmentType: true, user: { select: { id: true, name: true, email: true } } },
        orderBy: { transactionDate: 'desc' },
        skip,
        take,
      }),
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createExpenditure = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = expenditureSchema.parse(req.body);

    if (req.user?.role === 'BASE_COMMANDER' && data.baseId !== req.user.baseId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot record expenditure for another base.',
      });
    }

    const transaction = await createExpenditureRecord({
      baseId: data.baseId,
      equipmentTypeId: data.equipmentTypeId,
      quantity: data.quantity,
      reason: data.reason,
      expenditureDate: data.expenditureDate || new Date().toISOString(),
      notes: data.notes,
      userId: req.user.id,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Expenditure recorded successfully',
      data: transaction,
    });
  } catch (error: any) {
    if (error.message?.includes('Insufficient') || error.message?.includes('Unable to record')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};
