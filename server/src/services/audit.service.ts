import prisma from '../config/db';

export interface CreateAuditLogParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  baseId?: string | null;
  metadata?: any;
  ipAddress?: string | null;
}

export const createAuditLog = async (params: CreateAuditLogParams) => {
  try {
    const metaStr = params.metadata ? (typeof params.metadata === 'string' ? params.metadata : JSON.stringify(params.metadata)) : null;
    return await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        baseId: params.baseId || null,
        metadata: metaStr,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};
