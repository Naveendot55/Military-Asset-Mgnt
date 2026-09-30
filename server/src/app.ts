import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import baseRoutes from './routes/base.routes';
import equipmentRoutes from './routes/equipment.routes';
import purchaseRoutes from './routes/purchase.routes';
import transferRoutes from './routes/transfer.routes';
import assignmentRoutes from './routes/assignment.routes';
import expenditureRoutes from './routes/expenditure.routes';
import auditRoutes from './routes/audit.routes';
import { errorHandler } from './middleware/error.middleware';

import { connectDB } from './config/db';

dotenv.config();

connectDB();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '1mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bases', baseRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/expenditures', expenditureRoutes);
app.use('/api/audit-logs', auditRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
