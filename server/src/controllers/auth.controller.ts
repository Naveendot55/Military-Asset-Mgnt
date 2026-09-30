import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.model';
import { createAuditLog } from '../services/audit.service';
import { AuthRequest } from '../middleware/auth.middleware';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email }).populate('base');

    if (!user) {
      await createAuditLog({
        action: 'LOGIN_FAILED',
        entity: 'User',
        metadata: { email, reason: 'User not found' },
        ipAddress: req.ip,
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await createAuditLog({
        userId: user._id.toString(),
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: user._id.toString(),
        metadata: { email, reason: 'Incorrect password' },
        ipAddress: req.ip,
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role, baseId: user.baseId?.toString() || null },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    await createAuditLog({
      userId: user._id.toString(),
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: user._id.toString(),
      baseId: user.baseId?.toString() || null,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          baseId: user.baseId?.toString() || null,
          base: user.base || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user.id).populate('base');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        baseId: user.baseId?.toString() || null,
        base: user.base || null,
      },
    });
  } catch (error) {
    next(error);
  }
};
