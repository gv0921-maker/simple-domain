// Loyalty integration: applied when a sales order transitions to "delivered".

import type { SalesOrder, LoyaltyTier } from '@/lib/data/sales/types';
import type { Contact } from '@/lib/services/crm';
import {
  getTierFromSpend,
  calculatePointsEarned,
} from './loyaltyEngine';
import { logLoyaltyTransaction } from './supabaseSync';

export interface DeliveryProcessingResult {
  updatedContact: Contact;
  pointsEarned: number;
  pointsRedeemed: number;
  tierChanged: boolean;
  oldTier: LoyaltyTier;
  newTier: LoyaltyTier;
  newLifetimeSpend: number;
}

export function processOrderDelivery(order: SalesOrder, contact: Contact): DeliveryProcessingResult {
  const grandTotal = order.grandTotal || order.total || 0;
  const newLifetimeSpend = (contact.totalLifetimeSpend || 0) + grandTotal;

  const oldTier: LoyaltyTier = contact.loyaltyTier || 'bronze';
  const newTier = getTierFromSpend(newLifetimeSpend);
  const tierChanged = oldTier !== newTier;

  const pointsEarned = calculatePointsEarned(grandTotal, newTier);
  const pointsRedeemed = order.pointsRedeemed || 0;
  const newPoints = (contact.loyaltyPoints || 0) + pointsEarned - pointsRedeemed;

  const updatedContact: Contact = {
    ...contact,
    totalLifetimeSpend: newLifetimeSpend,
    loyaltyTier: newTier,
    loyaltyPoints: Math.max(0, newPoints),
    loyaltyTierUpdatedAt: tierChanged ? new Date().toISOString() : contact.loyaltyTierUpdatedAt,
  };

  // Mirror to Supabase (best-effort, non-blocking)
  if (pointsEarned > 0) {
    logLoyaltyTransaction({
      contactId: contact.id,
      orderId: order.id,
      txnType: 'earn',
      points: pointsEarned,
      amount: grandTotal,
      notes: `Order ${order.reference || order.id}`,
    });
  }
  if (pointsRedeemed > 0) {
    logLoyaltyTransaction({
      contactId: contact.id,
      orderId: order.id,
      txnType: 'redeem',
      points: pointsRedeemed,
      notes: `Redeemed on ${order.reference || order.id}`,
    });
  }
  if (tierChanged) {
    logLoyaltyTransaction({
      contactId: contact.id,
      orderId: order.id,
      txnType: 'tier_upgrade',
      notes: `${tierLabel(oldTier)} → ${tierLabel(newTier)}`,
    });
  }

  return { updatedContact, pointsEarned, pointsRedeemed, tierChanged, oldTier, newTier, newLifetimeSpend };
}

export function tierLabel(t: LoyaltyTier): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}
