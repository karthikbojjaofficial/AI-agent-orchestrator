import { Hono } from 'hono';
import { callSupportAgent, callOrderAgent, callBillingAgent, callRouterAgent, callFallbackAgent } from '../services/agentService.js';
import { startNewConversation, saveMessage, loadConversationById, listUserConversations, deleteConversation } from '../services/conversationService.js';
import type { AppContext } from '../types.js';

const chat = new Hono<AppContext>();

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

  // Get previous agent type from conversation history
  const previousAgentType = conversationHistory.length > 0
    ? conversationHistory[conversationHistory.length - 1]?.agentType ?? undefined
    : undefined;

  // Call router to determine which agent to use
  const routerResult = await callRouterAgent(message, userId, conversationHistory, previousAgentType);
  const { agentType, confidence } = routerResult;

  // Set confidence threshold (higher threshold when maintaining continuity)
  const CONFIDENCE_THRESHOLD = previousAgentType ? 0.85 : 0.7;

  // Call appropriate agent based on confidence and router decision
  let streamResult;
  if (confidence < CONFIDENCE_THRESHOLD) {
    // Low confidence - use fallback agent or maintain previous agent
    if (previousAgentType === 'order') {
      streamResult = await callOrderAgent(message, userId, conversationHistory, convId);
    } else if (previousAgentType === 'billing') {
      streamResult = await callBillingAgent(message, userId, conversationHistory, convId);
    } else if (previousAgentType === 'support') {
      streamResult = await callSupportAgent(message, userId, conversationHistory, convId);
    } else {
      streamResult = await callFallbackAgent(message, userId, conversationHistory, convId);
    }
  } else if (agentType === 'order') {
    streamResult = await callOrderAgent(message, userId, conversationHistory, convId);
  } else if (agentType === 'billing') {
    streamResult = await callBillingAgent(message, userId, conversationHistory, convId);
  } else {
    streamResult = await callSupportAgent(message, userId, conversationHistory, convId);
  }

  // Return streaming response with conversationId header
  c.header('X-Conversation-Id', convId);
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
