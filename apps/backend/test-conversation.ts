import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});
const prisma = new PrismaClient({ adapter });

async function createTestConversation() {
  const conv = await prisma.conversation.create({
    data: {
      userId: 'user_1',
      title: 'Question about keyboard order',
      messages: {
        create: [
          {
            role: 'user',
            content: 'Where is my mechanical keyboard order ORD-2024-089?'
          },
          {
            role: 'assistant',
            content: 'Your keyboard order ORD-2024-089 is currently shipped and will arrive by February 12th.',
            agentType: 'order'
          }
        ]
      }
    }
  });

  console.log('Created test conversation:', conv.id);
  await prisma.$disconnect();
}

createTestConversation();
