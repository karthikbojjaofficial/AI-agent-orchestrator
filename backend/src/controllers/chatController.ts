import { Hono } from 'hono';
import { callSupportAgent } from '../services/agentService.js';
import { startNewConversation, saveMessage, loadConversationById } from '../services/conversationService.js';

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

  // Call agent with conversation history
  const agentResponse = await callSupportAgent(message, userId, conversationHistory);

  // Save agent response
  await saveMessage(convId, 'assistant', agentResponse, 'support');

  return c.json({
    conversationId: convId,
    response: agentResponse
  });
});

export default chat;
