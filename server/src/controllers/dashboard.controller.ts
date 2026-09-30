import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { getDashboardMetrics, getNetMovementBreakdown } from '../services/inventory.service';

export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let { baseId, equipmentTypeId, startDate, endDate } = req.query as {
      baseId?: string;
      equipmentTypeId?: string;
      startDate?: string;
      endDate?: string;
    };

    // RBAC: Base commander can only see their base
    if (req.user?.role === 'BASE_COMMANDER') {
      if (baseId && baseId !== req.user.baseId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to access data from another base.',
        });
      }
      baseId = req.user.baseId;
    }

    const data = await getDashboardMetrics({
      baseId,
      equipmentTypeId,
      startDate,
      endDate,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getNetMovement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let { baseId, equipmentTypeId, startDate, endDate } = req.query as {
      baseId?: string;
      equipmentTypeId?: string;
      startDate?: string;
      endDate?: string;
    };

    if (req.user?.role === 'BASE_COMMANDER') {
      if (baseId && baseId !== req.user.baseId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to access data from another base.',
        });
      }
      baseId = req.user.baseId;
    }

    const data = await getNetMovementBreakdown({
      baseId,
      equipmentTypeId,
      startDate,
      endDate,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
