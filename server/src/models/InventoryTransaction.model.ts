import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryTransaction extends Document {
  baseId: any;
  equipmentTypeId: any;
  transactionType: string;
  quantity: number;
  referenceId?: string | null;
  transactionDate: Date;
  createdBy: any;
  notes?: string | null;
  createdAt: Date;
  base?: any;
  equipmentType?: any;
  user?: any;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    baseId: { type: Schema.Types.ObjectId, ref: 'Base', required: true, index: true },
    equipmentTypeId: { type: Schema.Types.ObjectId, ref: 'EquipmentType', required: true, index: true },
    transactionType: { type: String, required: true, index: true },
    quantity: { type: Number, required: true },
    referenceId: { type: String, default: null },
    transactionDate: { type: Date, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, default: null },
  },
  {
    timestamps: true,
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
        if (ret.equipmentTypeId && ret.equipmentTypeId._id) {
          ret.equipmentType = ret.equipmentTypeId;
          ret.equipmentTypeId = ret.equipmentTypeId._id.toString();
        } else if (ret.equipmentTypeId) {
          ret.equipmentTypeId = ret.equipmentTypeId.toString();
        }
        if (ret.createdBy && ret.createdBy._id) {
          ret.user = ret.createdBy;
          ret.createdBy = ret.createdBy._id.toString();
        } else if (ret.createdBy) {
          ret.createdBy = ret.createdBy.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

InventoryTransactionSchema.virtual('base', {
  ref: 'Base',
  localField: 'baseId',
  foreignField: '_id',
  justOne: true,
});

InventoryTransactionSchema.virtual('equipmentType', {
  ref: 'EquipmentType',
  localField: 'equipmentTypeId',
  foreignField: '_id',
  justOne: true,
});

InventoryTransactionSchema.virtual('user', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

export const InventoryTransaction = mongoose.model<IInventoryTransaction>(
  'InventoryTransaction',
  InventoryTransactionSchema
);
