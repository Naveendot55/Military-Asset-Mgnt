import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from './models/User.model';
import { Base } from './models/Base.model';
import { EquipmentType } from './models/EquipmentType.model';
import { InventoryTransaction } from './models/InventoryTransaction.model';
import { AuditLog } from './models/AuditLog.model';

dotenv.config();

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/military_assets';

async function main() {
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);

  console.log('Cleaning up previous seed data...');
  await AuditLog.deleteMany({});
  await InventoryTransaction.deleteMany({});
  await User.deleteMany({});
  await EquipmentType.deleteMany({});
  await Base.deleteMany({});

  console.log('Seeding initial data...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Bases
  const baseAlpha = await Base.create({
    name: 'Alpha Base',
    code: 'ALP',
    location: 'Northern Sector',
  });
  const baseBravo = await Base.create({
    name: 'Bravo Base',
    code: 'BRV',
    location: 'Southern Command',
  });
  const baseCharlie = await Base.create({
    name: 'Charlie Base',
    code: 'CHL',
    location: 'Eastern Frontier',
  });

  // 2. Create Users
  const admin = await User.create({
    name: 'Commander General (Admin)',
    email: 'admin@demo.com',
    passwordHash,
    role: 'ADMIN',
  });

  const alphaCmd = await User.create({
    name: 'Col. Vance (Alpha Cmd)',
    email: 'alpha@demo.com',
    passwordHash,
    role: 'BASE_COMMANDER',
    baseId: baseAlpha._id,
  });

  const bravoCmd = await User.create({
    name: 'Maj. Sterling (Bravo Cmd)',
    email: 'bravo@demo.com',
    passwordHash,
    role: 'BASE_COMMANDER',
    baseId: baseBravo._id,
  });

  const logistics = await User.create({
    name: 'Lt. Hayes (Logistics)',
    email: 'logistics@demo.com',
    passwordHash,
    role: 'LOGISTICS_OFFICER',
  });

  // 3. Create Equipment Types
  const eqVehicle = await EquipmentType.create({
    name: 'Armored Patrol Vehicle',
    category: 'Vehicles',
    unit: 'units',
    description: 'Light armored wheeled recon vehicle',
  });
  const eqWeapon = await EquipmentType.create({
    name: 'Standard Assault Rifle (M4A1)',
    category: 'Weapons',
    unit: 'units',
    description: 'Standard infantry service rifle',
  });
  const eqAmmo = await EquipmentType.create({
    name: '5.56mm Ammunition Crate',
    category: 'Ammunition',
    unit: 'crates',
    description: 'Crate containing 1,000 rounds',
  });
  const eqComm = await EquipmentType.create({
    name: 'Tactical VHF Transceiver',
    category: 'Communication Equipment',
    unit: 'units',
    description: 'Secure encrypted squad radio',
  });
  const eqArmor = await EquipmentType.create({
    name: 'Ballistic Combat Vest',
    category: 'Protective Equipment',
    unit: 'units',
    description: 'Level IV body armor',
  });

  // 4. Seed Opening Balances
  const d30DaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const d20DaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
  const d10DaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const d5DaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const d2DaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  await InventoryTransaction.create([
    {
      baseId: baseAlpha._id,
      equipmentTypeId: eqVehicle._id,
      transactionType: 'OPENING_BALANCE',
      quantity: 20,
      transactionDate: d30DaysAgo,
      createdBy: admin._id,
      notes: 'Initial fiscal year audit count',
    },
    {
      baseId: baseAlpha._id,
      equipmentTypeId: eqWeapon._id,
      transactionType: 'OPENING_BALANCE',
      quantity: 250,
      transactionDate: d30DaysAgo,
      createdBy: admin._id,
      notes: 'Armory initial inventory',
    },
    {
      baseId: baseAlpha._id,
      equipmentTypeId: eqAmmo._id,
      transactionType: 'OPENING_BALANCE',
      quantity: 500,
      transactionDate: d30DaysAgo,
      createdBy: admin._id,
      notes: 'Munitions bunker base balance',
    },
    {
      baseId: baseAlpha._id,
      equipmentTypeId: eqComm._id,
      transactionType: 'OPENING_BALANCE',
      quantity: 60,
      transactionDate: d30DaysAgo,
      createdBy: admin._id,
      notes: 'Comms bay inventory',
    },
    {
      baseId: baseAlpha._id,
      equipmentTypeId: eqArmor._id,
      transactionType: 'OPENING_BALANCE',
      quantity: 300,
      transactionDate: d30DaysAgo,
      createdBy: admin._id,
      notes: 'Quartermaster inventory',
    },
    {
      baseId: baseBravo._id,
      equipmentTypeId: eqVehicle._id,
      transactionType: 'OPENING_BALANCE',
      quantity: 15,
      transactionDate: d30DaysAgo,
      createdBy: admin._id,
      notes: 'Bravo vehicle pool count',
    },
    {
      baseId: baseBravo._id,
      equipmentTypeId: eqWeapon._id,
      transactionType: 'OPENING_BALANCE',
      quantity: 150,
      transactionDate: d30DaysAgo,
      createdBy: admin._id,
      notes: 'Bravo armory count',
    },
  ]);

  // 5. Purchases
  const purchase1 = await InventoryTransaction.create({
    baseId: baseAlpha._id,
    equipmentTypeId: eqVehicle._id,
    transactionType: 'PURCHASE',
    quantity: 10,
    referenceId: 'PO-2026-081',
    transactionDate: d20DaysAgo,
    createdBy: logistics._id,
    notes: 'Procurement from General Dynamics Defense',
  });

  await InventoryTransaction.create({
    baseId: baseAlpha._id,
    equipmentTypeId: eqAmmo._id,
    transactionType: 'PURCHASE',
    quantity: 200,
    referenceId: 'PO-2026-094',
    transactionDate: d20DaysAgo,
    createdBy: logistics._id,
    notes: 'Routine ammunition resupply',
  });

  // 6. Transfers
  const transferRef1 = 'TRF-2026-001';
  await InventoryTransaction.create({
    baseId: baseAlpha._id,
    equipmentTypeId: eqVehicle._id,
    transactionType: 'TRANSFER_OUT',
    quantity: 5,
    referenceId: transferRef1,
    transactionDate: d10DaysAgo,
    createdBy: logistics._id,
    notes: 'Transfer to Bravo Base reinforcement',
  });

  await InventoryTransaction.create({
    baseId: baseBravo._id,
    equipmentTypeId: eqVehicle._id,
    transactionType: 'TRANSFER_IN',
    quantity: 5,
    referenceId: transferRef1,
    transactionDate: d10DaysAgo,
    createdBy: logistics._id,
    notes: 'Transfer from Alpha Base reinforcement',
  });

  // 7. Assignments
  await InventoryTransaction.create({
    baseId: baseAlpha._id,
    equipmentTypeId: eqWeapon._id,
    transactionType: 'ASSIGNMENT',
    quantity: 50,
    referenceId: '1st Battalion Infantry Recon',
    transactionDate: d5DaysAgo,
    createdBy: alphaCmd._id,
    notes: 'Assigned for border monitoring exercise',
  });

  await InventoryTransaction.create({
    baseId: baseAlpha._id,
    equipmentTypeId: eqArmor._id,
    transactionType: 'ASSIGNMENT',
    quantity: 50,
    referenceId: '1st Battalion Infantry Recon',
    transactionDate: d5DaysAgo,
    createdBy: alphaCmd._id,
    notes: 'Body armor issuance',
  });

  // 8. Expenditures
  await InventoryTransaction.create({
    baseId: baseAlpha._id,
    equipmentTypeId: eqAmmo._id,
    transactionType: 'EXPENDITURE',
    quantity: 30,
    referenceId: 'Annual Live-Fire Certification',
    transactionDate: d2DaysAgo,
    createdBy: alphaCmd._id,
    notes: 'Expended in range qualifications',
  });

  // 9. Audit Logs
  await AuditLog.create([
    {
      userId: admin._id,
      action: 'OPENING_BALANCES_RECORDED',
      entity: 'InventoryTransaction',
      baseId: baseAlpha._id,
      metadata: { note: 'Fiscal year baseline' },
      ipAddress: '127.0.0.1',
      timestamp: d30DaysAgo,
    },
    {
      userId: logistics._id,
      action: 'PURCHASE_CREATED',
      entity: 'InventoryTransaction',
      entityId: purchase1._id.toString(),
      baseId: baseAlpha._id,
      metadata: { equipment: 'Armored Patrol Vehicle', quantity: 10, ref: 'PO-2026-081' },
      ipAddress: '127.0.0.1',
      timestamp: d20DaysAgo,
    },
    {
      userId: logistics._id,
      action: 'TRANSFER_CREATED',
      entity: 'InventoryTransaction',
      baseId: baseAlpha._id,
      metadata: {
        source: 'Alpha Base',
        destination: 'Bravo Base',
        equipment: 'Armored Patrol Vehicle',
        quantity: 5,
        reference: transferRef1,
      },
      ipAddress: '127.0.0.1',
      timestamp: d10DaysAgo,
    },
    {
      userId: alphaCmd._id,
      action: 'ASSIGNMENT_CREATED',
      entity: 'InventoryTransaction',
      baseId: baseAlpha._id,
      metadata: { equipment: 'Standard Assault Rifle (M4A1)', quantity: 50, personnel: '1st Battalion' },
      ipAddress: '127.0.0.1',
      timestamp: d5DaysAgo,
    },
    {
      userId: alphaCmd._id,
      action: 'EXPENDITURE_CREATED',
      entity: 'InventoryTransaction',
      baseId: baseAlpha._id,
      metadata: { equipment: '5.56mm Ammunition Crate', quantity: 30, reason: 'Live-Fire Training' },
      ipAddress: '127.0.0.1',
      timestamp: d2DaysAgo,
    },
  ]);

  console.log('MongoDB Seed data successfully inserted!');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
