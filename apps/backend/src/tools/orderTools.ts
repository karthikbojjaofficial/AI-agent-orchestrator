import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});
const prisma = new PrismaClient({ adapter });

// Tool to list all orders for a user
export async function listUserOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: {
      userId: userId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (orders.length === 0) {
    return { message: 'No orders found for this user' };
  }

  return {
    orders: orders.map(order => ({
      orderNumber: order.orderNumber,
      status: order.status,
      items: order.items,
      total: order.total,
      createdAt: order.createdAt
    }))
  };
}

// Tool to get order details
export async function getOrderDetails(orderNumber: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: {
      orderNumber: orderNumber,
      userId: userId
    }
  });

  if (!order) {
    return { error: 'Order not found' };
  }

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    items: order.items,
    total: order.total,
    trackingNumber: order.trackingNumber,
    estimatedDelivery: order.estimatedDelivery,
    createdAt: order.createdAt
  };
}

// Tool to get delivery status
export async function getDeliveryStatus(orderNumber: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: {
      orderNumber: orderNumber,
      userId: userId
    }
  });

  if (!order) {
    return { error: 'Order not found' };
  }

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: order.trackingNumber,
    estimatedDelivery: order.estimatedDelivery
  };
}

// Tool to modify order
export async function modifyOrder(orderNumber: string, userId: string, action: string) {
  const order = await prisma.order.findFirst({
    where: {
      orderNumber: orderNumber,
      userId: userId
    }
  });

  if (!order) {
    return { error: 'Order not found' };
  }

  let newStatus = order.status;
  if (action === 'cancel') {
    newStatus = 'cancelled';
  }

  const updatedOrder = await prisma.order.update({
    where: {
      id: order.id
    },
    data: {
      status: newStatus
    }
  });

  return {
    success: true,
    orderNumber: updatedOrder.orderNumber,
    previousStatus: order.status,
    newStatus: updatedOrder.status,
    message: `Order ${action}led successfully`
  };
}
