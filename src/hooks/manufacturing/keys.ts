export const manufacturingKeys = {
  all: ['manufacturing'] as const,

  boms: () => [...manufacturingKeys.all, 'boms'] as const,
  bom: (id: string) => [...manufacturingKeys.boms(), id] as const,

  workOrders: () => [...manufacturingKeys.all, 'work-orders'] as const,
  workOrder: (id: string) => [...manufacturingKeys.workOrders(), id] as const,

  workCenters: () => [...manufacturingKeys.all, 'work-centers'] as const,
  workCenter: (id: string) => [...manufacturingKeys.workCenters(), id] as const,
} as const;