import { Hono } from 'hono';
import { callSupportAgent } from '../services/agentService.js';
import { startNewConversation, saveMessage, loadConversationById, listUserConversations, deleteConversation } from '../services/conversationService.js';

const chat = new Hono();

// POST /api/chat/messages - Send new message
chat.post('/messages', async (c) => {
  const userId = c.get('userId');
  const { message, conversationId } = await c.req.json();

  // Get or create conversation
  let convId = conversationId;
  if (!convId) {
    const newConv = await startNewConversation(userId);
    convId = newConv.id;
  }

  // Load conversation history
  const conversation = await loadConversationById(convId);
  const conversationHistory = conversation?.messages || [];

  // Save user message
  await saveMessage(convId, 'user', message);

  // Call agent with conversation history (returns stream)
  const streamResult = await callSupportAgent(message, userId, conversationHistory, convId);

  // Return streaming response
  return streamResult.toTextStreamResponse();
});

// GET /api/chat/conversations - List user conversations
chat.get('/conversations', async (c) => {
  const userId = c.get('userId');
  const conversations = await listUserConversations(userId);
  return c.json({ conversations });
});

// GET /api/chat/conversations/:id - Get conversation history
chat.get('/conversations/:id', async (c) => {
  const conversationId = c.req.param('id');
  const conversation = await loadConversationById(conversationId);

  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404);
  }

  return c.json({ conversation });
});

// DELETE /api/chat/conversations/:id - Delete conversation
chat.delete('/conversations/:id', async (c) => {
  const conversationId = c.req.param('id');
  await deleteConversation(conversationId);
  return c.json({ success: true });
});

export default chat;
