// Re-export all inventory types and functions from the new modular structure
export * from './inventory/index';

// Legacy compatibility - these are deprecated, use the new imports instead
export type { TransferStatus, InventoryTransfer, Activity } from './inventory/types';
export type { LegacyStockMove as StockMove } from './inventory/types';
export { getTransfers, getTransfer, saveTransfer, deleteTransfer } from './inventory/storage';
export { getProducts, getProduct, saveProduct, deleteProduct } from './inventory/storage';
export { getWarehouses, saveWarehouse, deleteWarehouse } from './inventory/storage';

// Legacy updateTransferStatus function
import { getTransfer as _getTransfer, saveTransfer as _saveTransfer } from './inventory/storage';
import type { TransferStatus as _TransferStatus } from './inventory/types';

export function updateTransferStatus(id: string, status: _TransferStatus, userId: string, userName: string): void {
  const transfer = _getTransfer(id);
  if (transfer) {
    transfer.status = status;
    transfer.activities.push({
      id: crypto.randomUUID(),
      userId,
      userName,
      action: `Status changed to ${status}`,
      timestamp: new Date().toISOString(),
    });
    _saveTransfer(transfer);
  }
}
