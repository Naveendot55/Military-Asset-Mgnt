import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'BASE_COMMANDER' | 'LOGISTICS_OFFICER';
  baseId?: any;
  base?: any;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'], required: true },
    baseId: { type: Schema.Types.ObjectId, ref: 'Base', default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        if (ret.baseId) ret.baseId = ret.baseId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

UserSchema.virtual('base', {
  ref: 'Base',
  localField: 'baseId',
  foreignField: '_id',
  justOne: true,
});

export const User = mongoose.model<IUser>('User', UserSchema);
