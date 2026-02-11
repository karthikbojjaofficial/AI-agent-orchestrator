import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});
const prisma = new PrismaClient({ adapter });

// Create a new conversation
export async function startNewConversation(userId: string, title?: string) {
  const conversation = await prisma.conversation.create({
    data: {
      userId: userId,
      title: title || 'New Conversation'
    }
  });

  return conversation;
}

// Load a conversation by ID with all messages
export async function loadConversationById(conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: conversationId
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  return conversation;
}

// Save a message to a conversation
export async function saveMessage(
  conversationId: string,
  role: string,
  content: string,
  agentType?: string
) {
  const message = await prisma.message.create({
    data: {
      conversationId: conversationId,
      role: role,
      content: content,
      agentType: agentType ?? null
    }
  });

  return message;
}

// List all conversations for a user
export async function listUserConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      userId: userId
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  return conversations;
}

// Delete a conversation by ID
export async function deleteConversation(conversationId: string) {
  await prisma.conversation.delete({
    where: {
      id: conversationId
    }
  });
}
