import { Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let { baseId, action, entity, page = '1', limit = '20' } = req.query as any;

    const where: any = {};

    if (req.user?.role === 'BASE_COMMANDER') {
      where.baseId = req.user.baseId;
    } else if (baseId) {
      where.baseId = baseId;
    }

    if (action) where.action = action;
    if (entity) where.entity = entity;

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          base: { select: { id: true, name: true, code: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take,
      }),
    ]);

    const formatted = logs.map((log) => {
      let parsedMeta: any = null;
      if (log.metadata) {
        try {
          parsedMeta = JSON.parse(log.metadata);
        } catch (e) {
          parsedMeta = log.metadata;
        }
      }
      return {
        ...log,
        metadata: parsedMeta,
      };
    });

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
