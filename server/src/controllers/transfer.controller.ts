import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { InventoryTransaction } from '../models/InventoryTransaction.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { createTransferRecord } from '../services/inventory.service';

const transferSchema = z.object({
  sourceBaseId: z.string().min(1, 'Source base is required'),
  destinationBaseId: z.string().min(1, 'Destination base is required'),
  equipmentTypeId: z.string().min(1, 'Equipment type is required'),
  quantity: z.number().int().positive('Quantity must be an integer greater than 0'),
  transferDate: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const getTransfers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let { baseId, equipmentTypeId, startDate, endDate, page = '1', limit = '20' } = req.query as any;

    const where: any = {
      transactionType: 'TRANSFER_OUT',
    };

    if (req.user?.role === 'BASE_COMMANDER') {
      where.baseId = req.user.baseId;
    } else if (baseId) {
      where.baseId = baseId;
    }

    if (equipmentTypeId) where.equipmentTypeId = equipmentTypeId;
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.$gte = new Date(startDate);
      if (endDate) where.transactionDate.$lte = new Date(endDate);
    }

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const [total, transferOutList] = await Promise.all([
      InventoryTransaction.countDocuments(where),
      InventoryTransaction.find(where)
        .populate('base')
        .populate('equipmentType')
        .populate('user', 'id name email')
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(take),
    ]);

    const formatted = await Promise.all(
      transferOutList.map(async (tout) => {
        let destinationBaseName = 'External / Unknown';
        if (tout.referenceId) {
          const tin = await InventoryTransaction.findOne({
            referenceId: tout.referenceId,
            transactionType: 'TRANSFER_IN',
            equipmentTypeId: tout.equipmentTypeId,
          }).populate('base');

          if (tin && (tin as any).base) {
            destinationBaseName = (tin as any).base.name;
          }
        }

        const toutObj = (tout as any).toJSON ? (tout as any).toJSON() : tout;
        return {
          id: toutObj.id || tout._id.toString(),
          reference: toutObj.referenceId,
          sourceBase: toutObj.base?.name || 'Unknown',
          sourceBaseId: toutObj.baseId,
          destinationBase: destinationBaseName,
          equipment: toutObj.equipmentType?.name || 'Unknown',
          category: toutObj.equipmentType?.category || 'General',
          quantity: toutObj.quantity,
          timestamp: toutObj.transactionDate,
          user: toutObj.user?.name || 'System',
          notes: toutObj.notes,
          status: 'COMPLETED',
        };
      })
    );

    return res.json({
      success: true,
      data: formatted,
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

export const createTransfer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = transferSchema.parse(req.body);

    if (data.sourceBaseId === data.destinationBaseId) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination base cannot be the same',
      });
    }

    if (req.user?.role === 'BASE_COMMANDER' && data.sourceBaseId !== req.user.baseId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot transfer assets out of a base you do not command.',
      });
    }

    const result = await createTransferRecord({
      sourceBaseId: data.sourceBaseId,
      destinationBaseId: data.destinationBaseId,
      equipmentTypeId: data.equipmentTypeId,
      quantity: data.quantity,
      transferDate: data.transferDate || new Date().toISOString(),
      referenceNumber: data.referenceNumber,
      notes: data.notes,
      userId: req.user.id,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Transfer completed successfully',
      data: result,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(error);
    }
    if (error.message?.includes('enough available inventory') || error.message?.includes('same')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};
