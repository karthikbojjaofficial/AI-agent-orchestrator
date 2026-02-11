import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    payment: {
      findFirst: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

const prisma = new PrismaClient();

describe('billingTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInvoiceDetails', () => {
    it('should return invoice details when found', async () => {
      const mockPayment = {
        invoiceNumber: 'INV-001',
        orderId: 'ORD-001',
        amount: 100.50,
        status: 'paid',
        paymentMethod: 'credit_card',
        refundStatus: null,
        createdAt: new Date('2024-01-10'),
      };

      vi.mocked(prisma.payment.findFirst).mockResolvedValue(mockPayment as any);

      const { getInvoiceDetails } = await import('../../../tools/billingTools.js');
      const result = await getInvoiceDetails('INV-001', 'user_1');

      expect(result.invoiceNumber).toBe('INV-001');
      expect(result.amount).toBe(100.50);
      expect(result.status).toBe('paid');
      expect(result.paymentMethod).toBe('credit_card');
    });

    it('should return error when invoice not found', async () => {
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null);

      const { getInvoiceDetails } = await import('../../../tools/billingTools.js');
      const result = await getInvoiceDetails('INV-999', 'user_1');

      expect(result.error).toBe('Invoice not found');
    });
  });

  describe('checkRefundStatus', () => {
    it('should return refund status when available', async () => {
      const mockPayment = {
        invoiceNumber: 'INV-001',
        amount: 100,
        status: 'refunded',
        refundStatus: 'completed',
      };

      vi.mocked(prisma.payment.findFirst).mockResolvedValue(mockPayment as any);

      const { checkRefundStatus } = await import('../../../tools/billingTools.js');
      const result = await checkRefundStatus('INV-001', 'user_1');

      expect(result.refundStatus).toBe('completed');
      expect(result.status).toBe('refunded');
    });

    it('should return "No refund requested" when refund status is null', async () => {
      const mockPayment = {
        invoiceNumber: 'INV-001',
        amount: 100,
        status: 'paid',
        refundStatus: null,
      };

      vi.mocked(prisma.payment.findFirst).mockResolvedValue(mockPayment as any);

      const { checkRefundStatus } = await import('../../../tools/billingTools.js');
      const result = await checkRefundStatus('INV-001', 'user_1');

      expect(result.refundStatus).toBe('No refund requested');
    });

    it('should return error when invoice not found', async () => {
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null);

      const { checkRefundStatus } = await import('../../../tools/billingTools.js');
      const result = await checkRefundStatus('INV-999', 'user_1');

      expect(result.error).toBe('Invoice not found');
    });
  });
});
