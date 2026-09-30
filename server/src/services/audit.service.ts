import { AuditLog } from '../models/AuditLog.model';

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
    return await AuditLog.create({
      userId: params.userId || null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId || null,
      baseId: params.baseId || null,
      metadata: params.metadata || null,
      ipAddress: params.ipAddress || null,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};
