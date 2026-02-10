import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();

  // USER 1: Happy customer with successful orders
  const user1Orders = await prisma.order.createMany({
    data: [
      {
        userId: 'user_1',
        orderNumber: 'ORD-2024-001',
        status: 'delivered',
        items: [
          { name: 'Wireless Headphones', quantity: 1, price: 89.99 },
          { name: 'USB-C Cable', quantity: 2, price: 12.99 }
        ],
        total: 115.97,
        trackingNumber: 'TRK123456789',
        estimatedDelivery: new Date('2024-01-15'),
        createdAt: new Date('2024-01-10')
      },
      {
        userId: 'user_1',
        orderNumber: 'ORD-2024-045',
        status: 'delivered',
        items: [
          { name: 'Laptop Stand', quantity: 1, price: 45.50 }
        ],
        total: 45.50,
        trackingNumber: 'TRK987654321',
        estimatedDelivery: new Date('2024-02-05'),
        createdAt: new Date('2024-02-01')
      },
      {
        userId: 'user_1',
        orderNumber: 'ORD-2024-089',
        status: 'shipped',
        items: [
          { name: 'Mechanical Keyboard', quantity: 1, price: 129.99 }
        ],
        total: 129.99,
        trackingNumber: 'TRK456789123',
        estimatedDelivery: new Date('2024-02-12'),
        createdAt: new Date('2024-02-08')
      }
    ]
  });

  const user1Payments = await prisma.payment.createMany({
    data: [
      {
        userId: 'user_1',
        orderId: 'ORD-2024-001',
        invoiceNumber: 'INV-2024-001',
        amount: 115.97,
        status: 'paid',
        paymentMethod: 'credit_card',
        createdAt: new Date('2024-01-10')
      },
      {
        userId: 'user_1',
        orderId: 'ORD-2024-045',
        invoiceNumber: 'INV-2024-045',
        amount: 45.50,
        status: 'paid',
        paymentMethod: 'paypal',
        createdAt: new Date('2024-02-01')
      },
      {
        userId: 'user_1',
        orderId: 'ORD-2024-089',
        invoiceNumber: 'INV-2024-089',
        amount: 129.99,
        status: 'paid',
        paymentMethod: 'credit_card',
        createdAt: new Date('2024-02-08')
      }
    ]
  });

  // USER 2: Customer with issues (cancellations, refunds, failed payments)
  const user2Orders = await prisma.order.createMany({
    data: [
      {
        userId: 'user_2',
        orderNumber: 'ORD-2024-023',
        status: 'cancelled',
        items: [
          { name: 'Gaming Mouse', quantity: 1, price: 59.99 }
        ],
        total: 59.99,
        createdAt: new Date('2024-01-20')
      },
      {
        userId: 'user_2',
        orderNumber: 'ORD-2024-067',
        status: 'delivered',
        items: [
          { name: 'Monitor 27 inch', quantity: 1, price: 299.99 },
          { name: 'HDMI Cable', quantity: 1, price: 15.99 }
        ],
        total: 315.98,
        trackingNumber: 'TRK111222333',
        estimatedDelivery: new Date('2024-02-03'),
        createdAt: new Date('2024-01-28')
      },
      {
        userId: 'user_2',
        orderNumber: 'ORD-2024-078',
        status: 'pending',
        items: [
          { name: 'Webcam HD', quantity: 1, price: 79.99 }
        ],
        total: 79.99,
        createdAt: new Date('2024-02-09')
      }
    ]
  });

  const user2Payments = await prisma.payment.createMany({
    data: [
      {
        userId: 'user_2',
        orderId: 'ORD-2024-023',
        invoiceNumber: 'INV-2024-023',
        amount: 59.99,
        status: 'refunded',
        paymentMethod: 'credit_card',
        refundStatus: 'completed',
        createdAt: new Date('2024-01-20')
      },
      {
        userId: 'user_2',
        orderId: 'ORD-2024-067',
        invoiceNumber: 'INV-2024-067',
        amount: 315.98,
        status: 'refunded',
        paymentMethod: 'bank_transfer',
        refundStatus: 'requested',
        createdAt: new Date('2024-01-28')
      },
      {
        userId: 'user_2',
        orderId: 'ORD-2024-078',
        invoiceNumber: 'INV-2024-078',
        amount: 79.99,
        status: 'failed',
        paymentMethod: 'credit_card',
        createdAt: new Date('2024-02-09')
      },
      {
        userId: 'user_2',
        invoiceNumber: 'INV-2024-080',
        amount: 25.00,
        status: 'pending',
        paymentMethod: 'paypal',
        createdAt: new Date('2024-02-09')
      }
    ]
  });

  // USER 3: Active customer with mixed scenarios
  const user3Orders = await prisma.order.createMany({
    data: [
      {
        userId: 'user_3',
        orderNumber: 'ORD-2024-012',
        status: 'delivered',
        items: [
          { name: 'Desk Lamp', quantity: 1, price: 34.99 }
        ],
        total: 34.99,
        trackingNumber: 'TRK555666777',
        estimatedDelivery: new Date('2024-01-18'),
        createdAt: new Date('2024-01-12')
      },
      {
        userId: 'user_3',
        orderNumber: 'ORD-2024-056',
        status: 'shipped',
        items: [
          { name: 'Phone Case', quantity: 2, price: 19.99 },
          { name: 'Screen Protector', quantity: 2, price: 9.99 }
        ],
        total: 59.96,
        trackingNumber: 'TRK888999000',
        estimatedDelivery: new Date('2024-02-11'),
        createdAt: new Date('2024-02-06')
      },
      {
        userId: 'user_3',
        orderNumber: 'ORD-2024-091',
        status: 'pending',
        items: [
          { name: 'Wireless Charger', quantity: 1, price: 29.99 },
          { name: 'Power Bank', quantity: 1, price: 39.99 }
        ],
        total: 69.98,
        createdAt: new Date('2024-02-10')
      },
      {
        userId: 'user_3',
        orderNumber: 'ORD-2024-034',
        status: 'delivered',
        items: [
          { name: 'Bluetooth Speaker', quantity: 1, price: 49.99 }
        ],
        total: 49.99,
        trackingNumber: 'TRK222333444',
        estimatedDelivery: new Date('2024-01-28'),
        createdAt: new Date('2024-01-22')
      }
    ]
  });

  const user3Payments = await prisma.payment.createMany({
    data: [
      {
        userId: 'user_3',
        orderId: 'ORD-2024-012',
        invoiceNumber: 'INV-2024-012',
        amount: 34.99,
        status: 'paid',
        paymentMethod: 'credit_card',
        createdAt: new Date('2024-01-12')
      },
      {
        userId: 'user_3',
        orderId: 'ORD-2024-056',
        invoiceNumber: 'INV-2024-056',
        amount: 59.96,
        status: 'paid',
        paymentMethod: 'paypal',
        createdAt: new Date('2024-02-06')
      },
      {
        userId: 'user_3',
        orderId: 'ORD-2024-091',
        invoiceNumber: 'INV-2024-091',
        amount: 69.98,
        status: 'pending',
        paymentMethod: 'bank_transfer',
        createdAt: new Date('2024-02-10')
      },
      {
        userId: 'user_3',
        orderId: 'ORD-2024-034',
        invoiceNumber: 'INV-2024-034',
        amount: 49.99,
        status: 'paid',
        paymentMethod: 'credit_card',
        createdAt: new Date('2024-01-22')
      }
    ]
  });

  // Create sample conversations with messages
  const conv1 = await prisma.conversation.create({
    data: {
      userId: 'user_1',
      title: 'Question about order delivery',
      createdAt: new Date('2024-02-09'),
      updatedAt: new Date('2024-02-09'),
      messages: {
        create: [
          {
            role: 'user',
            content: 'Where is my order ORD-2024-089?',
            createdAt: new Date('2024-02-09T10:00:00')
          },
          {
            role: 'assistant',
            content: 'Your order ORD-2024-089 is currently shipped with tracking number TRK456789123. Estimated delivery is February 12, 2024.',
            agentType: 'order',
            createdAt: new Date('2024-02-09T10:00:05')
          }
        ]
      }
    }
  });

  const conv2 = await prisma.conversation.create({
    data: {
      userId: 'user_2',
      title: 'Refund inquiry',
      createdAt: new Date('2024-02-05'),
      updatedAt: new Date('2024-02-05'),
      messages: {
        create: [
          {
            role: 'user',
            content: 'I want to request a refund for invoice INV-2024-067',
            createdAt: new Date('2024-02-05T14:30:00')
          },
          {
            role: 'assistant',
            content: 'I can see your invoice INV-2024-067 for $315.98. Your refund request has been submitted and is currently being processed.',
            agentType: 'billing',
            createdAt: new Date('2024-02-05T14:30:08')
          },
          {
            role: 'user',
            content: 'How long will the refund take?',
            createdAt: new Date('2024-02-05T14:31:00')
          },
          {
            role: 'assistant',
            content: 'Refunds typically take 5-7 business days to appear in your account. Your refund status shows as "requested" and should be approved within 24-48 hours.',
            agentType: 'billing',
            createdAt: new Date('2024-02-05T14:31:05')
          }
        ]
      }
    }
  });

  const conv3 = await prisma.conversation.create({
    data: {
      userId: 'user_3',
      title: 'Payment issue',
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-10'),
      messages: {
        create: [
          {
            role: 'user',
            content: 'My payment for order ORD-2024-091 is showing as pending',
            createdAt: new Date('2024-02-10T09:15:00')
          },
          {
            role: 'assistant',
            content: 'I can see invoice INV-2024-091 for $69.98 is pending. Bank transfers can take 1-3 business days to process. Your order will ship once payment is confirmed.',
            agentType: 'billing',
            createdAt: new Date('2024-02-10T09:15:07')
          }
        ]
      }
    }
  });

  console.log('Seed completed successfully!');
  console.log(`Created orders for 3 users`);
  console.log(`Created payments for 3 users`);
  console.log(`Created 3 sample conversations with messages`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
