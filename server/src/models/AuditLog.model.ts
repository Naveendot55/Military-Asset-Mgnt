import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: any;
  action: string;
  entity: string;
  entityId?: string | null;
  baseId?: any;
  metadata?: any;
  ipAddress?: string | null;
  timestamp: Date;
  user?: any;
  base?: any;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true },
    entityId: { type: String, default: null },
    baseId: { type: Schema.Types.ObjectId, ref: 'Base', default: null, index: true },
    metadata: { type: Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: null },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        if (ret.baseId && ret.baseId._id) {
          ret.base = ret.baseId;
          ret.baseId = ret.baseId._id.toString();
        } else if (ret.baseId) {
          ret.baseId = ret.baseId.toString();
        }
        if (ret.userId && ret.userId._id) {
          ret.user = ret.userId;
          ret.userId = ret.userId._id.toString();
        } else if (ret.userId) {
          ret.userId = ret.userId.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

AuditLogSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

AuditLogSchema.virtual('base', {
  ref: 'Base',
  localField: 'baseId',
  foreignField: '_id',
  justOne: true,
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
