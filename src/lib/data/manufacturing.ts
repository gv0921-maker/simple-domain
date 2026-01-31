// Manufacturing module data layer

export interface BOMLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  uom: string;
}

export interface BillOfMaterials {
  id: string;
  name: string;
  productId: string;
  productName: string;
  quantity: number;
  uom: string;
  lines: BOMLine[];
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  name: string;
  productId: string;
  productName: string;
  bomId: string;
  quantity: number;
  status: 'draft' | 'confirmed' | 'in_progress' | 'done' | 'cancelled';
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  workCenterId: string;
  workCenterName: string;
  progress: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface WorkCenter {
  id: string;
  name: string;
  code: string;
  capacity: number;
  costPerHour: number;
  isActive: boolean;
  currentLoad: number;
}

export interface ECO {
  id: string;
  name: string;
  productId: string;
  productName: string;
  type: 'bom_change' | 'routing_change' | 'product_update';
  status: 'draft' | 'in_review' | 'approved' | 'applied' | 'rejected';
  requestedBy: string;
  requestedDate: string;
  description: string;
}

// Mock data
let workOrders: WorkOrder[] = [
  {
    id: 'WO-001',
    name: 'WO/2024/001',
    productId: 'PROD-001',
    productName: 'Assembled Widget A',
    bomId: 'BOM-001',
    quantity: 100,
    status: 'in_progress',
    scheduledStart: '2024-01-15',
    scheduledEnd: '2024-01-20',
    actualStart: '2024-01-15',
    workCenterId: 'WC-001',
    workCenterName: 'Assembly Line 1',
    progress: 65,
    priority: 'high',
  },
  {
    id: 'WO-002',
    name: 'WO/2024/002',
    productId: 'PROD-002',
    productName: 'Component B',
    bomId: 'BOM-002',
    quantity: 500,
    status: 'confirmed',
    scheduledStart: '2024-01-18',
    scheduledEnd: '2024-01-25',
    workCenterId: 'WC-002',
    workCenterName: 'CNC Machine Center',
    progress: 0,
    priority: 'normal',
  },
  {
    id: 'WO-003',
    name: 'WO/2024/003',
    productId: 'PROD-003',
    productName: 'Final Product X',
    bomId: 'BOM-003',
    quantity: 50,
    status: 'draft',
    scheduledStart: '2024-01-22',
    scheduledEnd: '2024-01-28',
    workCenterId: 'WC-001',
    workCenterName: 'Assembly Line 1',
    progress: 0,
    priority: 'urgent',
  },
];

let boms: BillOfMaterials[] = [
  {
    id: 'BOM-001',
    name: 'Assembled Widget A BOM',
    productId: 'PROD-001',
    productName: 'Assembled Widget A',
    quantity: 1,
    uom: 'Units',
    status: 'active',
    createdAt: '2024-01-01',
    lines: [
      { id: 'L1', productId: 'COMP-001', productName: 'Metal Frame', quantity: 2, uom: 'Units' },
      { id: 'L2', productId: 'COMP-002', productName: 'Screws Pack', quantity: 10, uom: 'Units' },
      { id: 'L3', productId: 'COMP-003', productName: 'Rubber Gasket', quantity: 4, uom: 'Units' },
    ],
  },
  {
    id: 'BOM-002',
    name: 'Component B BOM',
    productId: 'PROD-002',
    productName: 'Component B',
    quantity: 1,
    uom: 'Units',
    status: 'active',
    createdAt: '2024-01-05',
    lines: [
      { id: 'L4', productId: 'RAW-001', productName: 'Steel Rod', quantity: 0.5, uom: 'kg' },
      { id: 'L5', productId: 'RAW-002', productName: 'Aluminum Sheet', quantity: 0.2, uom: 'sqm' },
    ],
  },
];

let workCenters: WorkCenter[] = [
  { id: 'WC-001', name: 'Assembly Line 1', code: 'ASM-01', capacity: 8, costPerHour: 45, isActive: true, currentLoad: 75 },
  { id: 'WC-002', name: 'CNC Machine Center', code: 'CNC-01', capacity: 6, costPerHour: 85, isActive: true, currentLoad: 40 },
  { id: 'WC-003', name: 'Welding Station', code: 'WLD-01', capacity: 4, costPerHour: 55, isActive: true, currentLoad: 20 },
  { id: 'WC-004', name: 'Quality Control', code: 'QC-01', capacity: 3, costPerHour: 35, isActive: true, currentLoad: 60 },
  { id: 'WC-005', name: 'Packaging Line', code: 'PKG-01', capacity: 10, costPerHour: 25, isActive: false, currentLoad: 0 },
];

let ecos: ECO[] = [
  {
    id: 'ECO-001',
    name: 'ECO/2024/001 - Update Widget A Materials',
    productId: 'PROD-001',
    productName: 'Assembled Widget A',
    type: 'bom_change',
    status: 'in_review',
    requestedBy: 'Engineering Team',
    requestedDate: '2024-01-10',
    description: 'Replace steel screws with titanium for improved durability',
  },
  {
    id: 'ECO-002',
    name: 'ECO/2024/002 - Component B Specification',
    productId: 'PROD-002',
    productName: 'Component B',
    type: 'product_update',
    status: 'approved',
    requestedBy: 'Quality Team',
    requestedDate: '2024-01-08',
    description: 'Update tolerance specifications for Component B',
  },
];

// CRUD operations
export function getWorkOrders() {
  return [...workOrders];
}

export function getWorkOrder(id: string) {
  return workOrders.find(wo => wo.id === id);
}

export function createWorkOrder(data: Omit<WorkOrder, 'id' | 'name' | 'progress'>) {
  const newId = `WO-${String(workOrders.length + 1).padStart(3, '0')}`;
  const newWO: WorkOrder = {
    ...data,
    id: newId,
    name: `WO/2024/${String(workOrders.length + 1).padStart(3, '0')}`,
    progress: 0,
  };
  workOrders = [...workOrders, newWO];
  return newWO;
}

export function updateWorkOrder(id: string, data: Partial<WorkOrder>) {
  workOrders = workOrders.map(wo => wo.id === id ? { ...wo, ...data } : wo);
  return workOrders.find(wo => wo.id === id);
}

export function deleteWorkOrder(id: string) {
  workOrders = workOrders.filter(wo => wo.id !== id);
}

export function getBOMs() {
  return [...boms];
}

export function getBOM(id: string) {
  return boms.find(b => b.id === id);
}

export function createBOM(data: Omit<BillOfMaterials, 'id' | 'createdAt'>) {
  const newId = `BOM-${String(boms.length + 1).padStart(3, '0')}`;
  const newBOM: BillOfMaterials = {
    ...data,
    id: newId,
    createdAt: new Date().toISOString().split('T')[0],
  };
  boms = [...boms, newBOM];
  return newBOM;
}

export function updateBOM(id: string, data: Partial<BillOfMaterials>) {
  boms = boms.map(b => b.id === id ? { ...b, ...data } : b);
  return boms.find(b => b.id === id);
}

export function deleteBOM(id: string) {
  boms = boms.filter(b => b.id !== id);
}

export function getWorkCenters() {
  return [...workCenters];
}

export function createWorkCenter(data: Omit<WorkCenter, 'id' | 'currentLoad'>) {
  const newId = `WC-${String(workCenters.length + 1).padStart(3, '0')}`;
  const newWC: WorkCenter = { ...data, id: newId, currentLoad: 0 };
  workCenters = [...workCenters, newWC];
  return newWC;
}

export function updateWorkCenter(id: string, data: Partial<WorkCenter>) {
  workCenters = workCenters.map(wc => wc.id === id ? { ...wc, ...data } : wc);
  return workCenters.find(wc => wc.id === id);
}

export function deleteWorkCenter(id: string) {
  workCenters = workCenters.filter(wc => wc.id !== id);
}

export function getECOs() {
  return [...ecos];
}

export function createECO(data: Omit<ECO, 'id' | 'name'>) {
  const newId = `ECO-${String(ecos.length + 1).padStart(3, '0')}`;
  const newECO: ECO = {
    ...data,
    id: newId,
    name: `ECO/2024/${String(ecos.length + 1).padStart(3, '0')} - ${data.description.slice(0, 30)}`,
  };
  ecos = [...ecos, newECO];
  return newECO;
}

export function updateECO(id: string, data: Partial<ECO>) {
  ecos = ecos.map(e => e.id === id ? { ...e, ...data } : e);
  return ecos.find(e => e.id === id);
}
