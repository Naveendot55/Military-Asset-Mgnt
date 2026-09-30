import mongoose, { Schema, Document } from 'mongoose';

export interface IEquipmentType extends Document {
  name: string;
  category: string;
  unit: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EquipmentTypeSchema = new Schema<IEquipmentType>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    unit: { type: String, required: true },
    description: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const EquipmentType = mongoose.model<IEquipmentType>('EquipmentType', EquipmentTypeSchema);
