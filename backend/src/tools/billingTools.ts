import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});
const prisma = new PrismaClient({ adapter });

// Tool to get invoice details
export async function getInvoiceDetails(invoiceNumber: string, userId: string) {
  const payment = await prisma.payment.findFirst({
    where: {
      invoiceNumber: invoiceNumber,
      userId: userId
    }
  });

  if (!payment) {
    return { error: 'Invoice not found' };
  }

  return {
    invoiceNumber: payment.invoiceNumber,
    orderId: payment.orderId,
    amount: payment.amount,
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    refundStatus: payment.refundStatus,
    createdAt: payment.createdAt
  };
}

// Tool to check refund status
export async function checkRefundStatus(invoiceNumber: string, userId: string) {
  const payment = await prisma.payment.findFirst({
    where: {
      invoiceNumber: invoiceNumber,
      userId: userId
    }
  });

  if (!payment) {
    return { error: 'Invoice not found' };
  }

  return {
    invoiceNumber: payment.invoiceNumber,
    amount: payment.amount,
    status: payment.status,
    refundStatus: payment.refundStatus || 'No refund requested'
  };
}
