import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up previous seed data...');
  await prisma.auditLog.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.equipmentType.deleteMany({});
  await prisma.base.deleteMany({});

  console.log('Seeding initial data...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Bases
  const baseAlpha = await prisma.base.create({
    data: { name: 'Alpha Base', code: 'ALP', location: 'Northern Sector' },
  });
  const baseBravo = await prisma.base.create({
    data: { name: 'Bravo Base', code: 'BRV', location: 'Southern Command' },
  });
  const baseCharlie = await prisma.base.create({
    data: { name: 'Charlie Base', code: 'CHL', location: 'Eastern Frontier' },
  });

  // 2. Create Users
  const admin = await prisma.user.create({
    data: { name: 'Commander General (Admin)', email: 'admin@demo.com', passwordHash, role: 'ADMIN' },
  });

  const alphaCmd = await prisma.user.create({
    data: { name: 'Col. Vance (Alpha Cmd)', email: 'alpha@demo.com', passwordHash, role: 'BASE_COMMANDER', baseId: baseAlpha.id },
  });

  const bravoCmd = await prisma.user.create({
    data: { name: 'Maj. Sterling (Bravo Cmd)', email: 'bravo@demo.com', passwordHash, role: 'BASE_COMMANDER', baseId: baseBravo.id },
  });

  const logistics = await prisma.user.create({
    data: { name: 'Lt. Hayes (Logistics)', email: 'logistics@demo.com', passwordHash, role: 'LOGISTICS_OFFICER' },
  });

  // 3. Create Equipment Types (5 types across 5 categories)
  const eqVehicle = await prisma.equipmentType.create({
    data: { name: 'Armored Patrol Vehicle', category: 'Vehicles', unit: 'units', description: 'Light armored wheeled recon vehicle' },
  });
  const eqWeapon = await prisma.equipmentType.create({
    data: { name: 'Standard Assault Rifle (M4A1)', category: 'Weapons', unit: 'units', description: 'Standard infantry service rifle' },
  });
  const eqAmmo = await prisma.equipmentType.create({
    data: { name: '5.56mm Ammunition Crate', category: 'Ammunition', unit: 'crates', description: 'Crate containing 1,000 rounds' },
  });
  const eqComm = await prisma.equipmentType.create({
    data: { name: 'Tactical VHF Transceiver', category: 'Communication Equipment', unit: 'units', description: 'Secure encrypted squad radio' },
  });
  const eqArmor = await prisma.equipmentType.create({
    data: { name: 'Ballistic Combat Vest', category: 'Protective Equipment', unit: 'units', description: 'Level IV body armor' },
  });

  // 4. Seed Opening Balances (Date: 30 days ago)
  const d30DaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const d20DaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
  const d10DaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const d5DaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const d2DaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  // Alpha Base Initial Balances
  await prisma.inventoryTransaction.createMany({
    data: [
      {
        baseId: baseAlpha.id,
        equipmentTypeId: eqVehicle.id,
        transactionType: 'OPENING_BALANCE',
        quantity: 20,
        transactionDate: d30DaysAgo,
        createdBy: admin.id,
        notes: 'Initial fiscal year audit count',
      },
      {
        baseId: baseAlpha.id,
        equipmentTypeId: eqWeapon.id,
        transactionType: 'OPENING_BALANCE',
        quantity: 250,
        transactionDate: d30DaysAgo,
        createdBy: admin.id,
        notes: 'Armory initial inventory',
      },
      {
        baseId: baseAlpha.id,
        equipmentTypeId: eqAmmo.id,
        transactionType: 'OPENING_BALANCE',
        quantity: 500,
        transactionDate: d30DaysAgo,
        createdBy: admin.id,
        notes: 'Munitions bunker base balance',
      },
      {
        baseId: baseAlpha.id,
        equipmentTypeId: eqComm.id,
        transactionType: 'OPENING_BALANCE',
        quantity: 60,
        transactionDate: d30DaysAgo,
        createdBy: admin.id,
        notes: 'Comms bay inventory',
      },
      {
        baseId: baseAlpha.id,
        equipmentTypeId: eqArmor.id,
        transactionType: 'OPENING_BALANCE',
        quantity: 300,
        transactionDate: d30DaysAgo,
        createdBy: admin.id,
        notes: 'Quartermaster inventory',
      },
      // Bravo Base Initial Balances
      {
        baseId: baseBravo.id,
        equipmentTypeId: eqVehicle.id,
        transactionType: 'OPENING_BALANCE',
        quantity: 15,
        transactionDate: d30DaysAgo,
        createdBy: admin.id,
        notes: 'Bravo vehicle pool count',
      },
      {
        baseId: baseBravo.id,
        equipmentTypeId: eqWeapon.id,
        transactionType: 'OPENING_BALANCE',
        quantity: 150,
        transactionDate: d30DaysAgo,
        createdBy: admin.id,
        notes: 'Bravo armory count',
      },
    ],
  });

  // 5. Purchases (20 days ago)
  const purchase1 = await prisma.inventoryTransaction.create({
    data: {
      baseId: baseAlpha.id,
      equipmentTypeId: eqVehicle.id,
      transactionType: 'PURCHASE',
      quantity: 10,
      referenceId: 'PO-2026-081',
      transactionDate: d20DaysAgo,
      createdBy: logistics.id,
      notes: 'Procurement from General Dynamics Defense',
    },
  });

  const purchase2 = await prisma.inventoryTransaction.create({
    data: {
      baseId: baseAlpha.id,
      equipmentTypeId: eqAmmo.id,
      transactionType: 'PURCHASE',
      quantity: 200,
      referenceId: 'PO-2026-094',
      transactionDate: d20DaysAgo,
      createdBy: logistics.id,
      notes: 'Routine ammunition resupply',
    },
  });

  // 6. Transfers (10 days ago): Alpha -> Bravo (5 vehicles, ref TRF-2026-001)
  const transferRef1 = 'TRF-2026-001';
  await prisma.inventoryTransaction.create({
    data: {
      baseId: baseAlpha.id,
      equipmentTypeId: eqVehicle.id,
      transactionType: 'TRANSFER_OUT',
      quantity: 5,
      referenceId: transferRef1,
      transactionDate: d10DaysAgo,
      createdBy: logistics.id,
      notes: 'Transfer to Bravo Base reinforcement',
    },
  });

  await prisma.inventoryTransaction.create({
    data: {
      baseId: baseBravo.id,
      equipmentTypeId: eqVehicle.id,
      transactionType: 'TRANSFER_IN',
      quantity: 5,
      referenceId: transferRef1,
      transactionDate: d10DaysAgo,
      createdBy: logistics.id,
      notes: 'Transfer from Alpha Base reinforcement',
    },
  });

  // 7. Assignments (5 days ago): Alpha Base assigns 50 rifles and 50 vests to 1st Battalion
  await prisma.inventoryTransaction.create({
    data: {
      baseId: baseAlpha.id,
      equipmentTypeId: eqWeapon.id,
      transactionType: 'ASSIGNMENT',
      quantity: 50,
      referenceId: '1st Battalion Infantry Recon',
      transactionDate: d5DaysAgo,
      createdBy: alphaCmd.id,
      notes: 'Assigned for border monitoring exercise',
    },
  });

  await prisma.inventoryTransaction.create({
    data: {
      baseId: baseAlpha.id,
      equipmentTypeId: eqArmor.id,
      transactionType: 'ASSIGNMENT',
      quantity: 50,
      referenceId: '1st Battalion Infantry Recon',
      transactionDate: d5DaysAgo,
      createdBy: alphaCmd.id,
      notes: 'Body armor issuance',
    },
  });

  // 8. Expenditures (2 days ago): 30 crates of ammo expended during live fire training
  await prisma.inventoryTransaction.create({
    data: {
      baseId: baseAlpha.id,
      equipmentTypeId: eqAmmo.id,
      transactionType: 'EXPENDITURE',
      quantity: 30,
      referenceId: 'Annual Live-Fire Certification',
      transactionDate: d2DaysAgo,
      createdBy: alphaCmd.id,
      notes: 'Expended in range qualifications',
    },
  });

  // 9. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'OPENING_BALANCES_RECORDED',
        entity: 'InventoryTransaction',
        baseId: baseAlpha.id,
        metadata: JSON.stringify({ note: 'Fiscal year baseline' }),
        ipAddress: '127.0.0.1',
        timestamp: d30DaysAgo,
      },
      {
        userId: logistics.id,
        action: 'PURCHASE_CREATED',
        entity: 'InventoryTransaction',
        entityId: purchase1.id,
        baseId: baseAlpha.id,
        metadata: JSON.stringify({ equipment: 'Armored Patrol Vehicle', quantity: 10, ref: 'PO-2026-081' }),
        ipAddress: '127.0.0.1',
        timestamp: d20DaysAgo,
      },
      {
        userId: logistics.id,
        action: 'TRANSFER_CREATED',
        entity: 'InventoryTransaction',
        baseId: baseAlpha.id,
        metadata: JSON.stringify({
          source: 'Alpha Base',
          destination: 'Bravo Base',
          equipment: 'Armored Patrol Vehicle',
          quantity: 5,
          reference: transferRef1,
        }),
        ipAddress: '127.0.0.1',
        timestamp: d10DaysAgo,
      },
      {
        userId: alphaCmd.id,
        action: 'ASSIGNMENT_CREATED',
        entity: 'InventoryTransaction',
        baseId: baseAlpha.id,
        metadata: JSON.stringify({ equipment: 'Standard Assault Rifle (M4A1)', quantity: 50, personnel: '1st Battalion' }),
        ipAddress: '127.0.0.1',
        timestamp: d5DaysAgo,
      },
      {
        userId: alphaCmd.id,
        action: 'EXPENDITURE_CREATED',
        entity: 'InventoryTransaction',
        baseId: baseAlpha.id,
        metadata: JSON.stringify({ equipment: '5.56mm Ammunition Crate', quantity: 30, reason: 'Live-Fire Training' }),
        ipAddress: '127.0.0.1',
        timestamp: d2DaysAgo,
      },
    ],
  });

  console.log('Seed data successfully inserted!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
