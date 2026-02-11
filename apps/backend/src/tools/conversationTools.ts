import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});
const prisma = new PrismaClient({ adapter });

// Tool to query conversation history for a user
export async function queryConversationHistory(userId: string) {
  // Get all conversations for this user
  const conversations = await prisma.conversation.findMany({
    where: {
      userId: userId
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc'
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Return JSON for AI
  if (conversations.length === 0) {
    return { conversations: [] };
  }

  return {
    conversations: conversations.map(conv => ({
      title: conv.title,
      date: conv.createdAt,
      messages: conv.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        agentType: msg.agentType
      }))
    }))
  };
}
