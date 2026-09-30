import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { InventoryTransaction } from '../models/InventoryTransaction.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAssignmentRecord } from '../services/inventory.service';

const assignmentSchema = z.object({
  baseId: z.string().min(1, 'Base is required'),
  equipmentTypeId: z.string().min(1, 'Equipment type is required'),
  quantity: z.number().int().positive('Quantity must be an integer greater than 0'),
  personnelName: z.string().min(2, 'Personnel name or identifier is required'),
  assignmentDate: z.string().optional(),
  notes: z.string().optional(),
});

export const getAssignments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let { baseId, equipmentTypeId, startDate, endDate, page = '1', limit = '20' } = req.query as any;

    if (req.user?.role === 'BASE_COMMANDER') {
      if (baseId && baseId !== req.user.baseId) {
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot access another base assignments' });
      }
      baseId = req.user.baseId;
    }

    const where: any = { transactionType: 'ASSIGNMENT' };
    if (baseId) where.baseId = baseId;
    if (equipmentTypeId) where.equipmentTypeId = equipmentTypeId;
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.$gte = new Date(startDate);
      if (endDate) where.transactionDate.$lte = new Date(endDate);
    }

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const [total, items] = await Promise.all([
      InventoryTransaction.countDocuments(where),
      InventoryTransaction.find(where)
        .populate('base')
        .populate('equipmentType')
        .populate('user', 'id name email')
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(take),
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

export const createAssignment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = assignmentSchema.parse(req.body);

    if (req.user?.role === 'BASE_COMMANDER' && data.baseId !== req.user.baseId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot assign assets from another base.',
      });
    }

    const transaction = await createAssignmentRecord({
      baseId: data.baseId,
      equipmentTypeId: data.equipmentTypeId,
      quantity: data.quantity,
      personnelName: data.personnelName,
      assignmentDate: data.assignmentDate || new Date().toISOString(),
      notes: data.notes,
      userId: req.user.id,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Asset assigned successfully',
      data: transaction,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(error);
    }
    if (error.message?.includes('Insufficient') || error.message?.includes('Unable to assign')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};
