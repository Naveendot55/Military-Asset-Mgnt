import mongoose, { Schema, Document } from 'mongoose';

export interface IBase extends Document {
  name: string;
  code: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

const BaseSchema = new Schema<IBase>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    location: { type: String, required: true },
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

export const Base = mongoose.model<IBase>('Base', BaseSchema);
