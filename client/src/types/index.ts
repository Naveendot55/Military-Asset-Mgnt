export type Role = 'ADMIN' | 'BASE_COMMANDER' | 'LOGISTICS_OFFICER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  baseId?: string | null;
  base?: Base | null;
}

export interface Base {
  id: string;
  name: string;
  code: string;
  location: string;
}

export interface EquipmentType {
  id: string;
  name: string;
  category: string;
  unit: string;
  description?: string;
}

export interface DashboardMetrics {
  openingBalance: number;
  closingBalance: number;
  netMovement: number;
  purchases: number;
  transferIn: number;
  transferOut: number;
  assigned: number;
  expended: number;
}

export interface DashboardCharts {
  equipmentInventory: { name: string; category: string; count: number }[];
  baseInventory: { name: string; count: number }[];
  movementOverTime: { date: string; purchases: number; transfers: number; net: number }[];
}

export interface NetMovementBreakdown {
  purchases: number;
  transferIn: number;
  transferOut: number;
  netMovement: number;
  transactions: any[];
}

export interface InventoryTransaction {
  id: string;
  baseId: string;
  equipmentTypeId: string;
  transactionType: string;
  quantity: number;
  referenceId?: string;
  transactionDate: string;
  notes?: string;
  createdAt: string;
  base?: Base;
  equipmentType?: EquipmentType;
  user?: { id: string; name: string; email: string };
}

export interface FormattedTransfer {
  id: string;
  reference?: string;
  sourceBase: string;
  sourceBaseId: string;
  destinationBase: string;
  equipment: string;
  category: string;
  quantity: number;
  timestamp: string;
  user: string;
  notes?: string;
  status: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  baseId?: string;
  metadata?: any;
  ipAddress?: string;
  timestamp: string;
  user?: { name: string; email: string; role: string };
  base?: { name: string; code: string };
}
