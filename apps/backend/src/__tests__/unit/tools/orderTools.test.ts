import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    order: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

// Import after mocking
const prisma = new PrismaClient();

describe('orderTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listUserOrders', () => {
    it('should return list of orders for a user', async () => {
      const mockOrders = [
        {
          orderNumber: 'ORD-001',
          status: 'delivered',
          items: [{ name: 'Test Item', quantity: 1, price: 10 }],
          total: 10,
          createdAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);

      const { listUserOrders } = await import('../../../tools/orderTools.js');
      const result = await listUserOrders('user_1');

      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].orderNumber).toBe('ORD-001');
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { userId: 'user_1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return message when no orders found', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);

      const { listUserOrders } = await import('../../../tools/orderTools.js');
      const result = await listUserOrders('user_1');

      expect(result.message).toBe('No orders found for this user');
    });
  });

  describe('getOrderDetails', () => {
    it('should return order details when found', async () => {
      const mockOrder = {
        orderNumber: 'ORD-001',
        status: 'shipped',
        items: [{ name: 'Item', quantity: 1, price: 50 }],
        total: 50,
        trackingNumber: 'TRK123',
        estimatedDelivery: new Date('2024-02-01'),
        createdAt: new Date('2024-01-15'),
      };

      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);

      const { getOrderDetails } = await import('../../../tools/orderTools.js');
      const result = await getOrderDetails('ORD-001', 'user_1');

      expect(result.orderNumber).toBe('ORD-001');
      expect(result.status).toBe('shipped');
      expect(result.trackingNumber).toBe('TRK123');
    });

    it('should return error when order not found', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

      const { getOrderDetails } = await import('../../../tools/orderTools.js');
      const result = await getOrderDetails('ORD-999', 'user_1');

      expect(result.error).toBe('Order not found');
    });
  });

  describe('getDeliveryStatus', () => {
    it('should return delivery status', async () => {
      const mockOrder = {
        orderNumber: 'ORD-001',
        status: 'shipped',
        trackingNumber: 'TRK123',
        estimatedDelivery: new Date('2024-02-01'),
      };

      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);

      const { getDeliveryStatus } = await import('../../../tools/orderTools.js');
      const result = await getDeliveryStatus('ORD-001', 'user_1');

      expect(result.status).toBe('shipped');
      expect(result.trackingNumber).toBe('TRK123');
    });
  });

  describe('modifyOrder', () => {
    it('should cancel an order successfully', async () => {
      const mockOrder = {
        id: 'order-id',
        orderNumber: 'ORD-001',
        status: 'shipped',
      };

      const updatedOrder = { ...mockOrder, status: 'cancelled' };

      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValue(updatedOrder as any);

      const { modifyOrder } = await import('../../../tools/orderTools.js');
      const result = await modifyOrder('ORD-001', 'user_1', 'cancel');

      expect(result.success).toBe(true);
      expect(result.newStatus).toBe('cancelled');
      expect(result.previousStatus).toBe('shipped');
    });

    it('should return error when order not found', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

      const { modifyOrder } = await import('../../../tools/orderTools.js');
      const result = await modifyOrder('ORD-999', 'user_1', 'cancel');

      expect(result.error).toBe('Order not found');
    });
  });
});
