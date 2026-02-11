import { openai } from '@ai-sdk/openai';
import { streamText, generateObject, generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { encoding_for_model } from 'tiktoken';
import { queryConversationHistory } from '../tools/conversationTools.js';
import { getOrderDetails, getDeliveryStatus, modifyOrder, listUserOrders } from '../tools/orderTools.js';
import { getInvoiceDetails, checkRefundStatus } from '../tools/billingTools.js';
import { saveMessage } from './conversationService.js';

// Setup AI client
const model = openai('gpt-4o-mini');

// Token counting
const tokenEncoder = encoding_for_model('gpt-4o-mini');
const SOFT_TOKEN_LIMIT = 1000;

function countTokens(text: string): number {
  const tokens = tokenEncoder.encode(text);
  return tokens.length;
}

// Summarize old messages
async function summarizeMessages(messages: any[]): Promise<string> {
  const formatted = messages.map(msg => {
    const role = msg.role === 'user' ? 'User' : 'Assistant';
    return `${role}: ${msg.content}`;
  }).join('\n');

  const result = await generateText({
    model: model,
    prompt: `Summarize this conversation into a brief paragraph (max 100 words) capturing the key points:\n\n${formatted}`
  });

  return result.text;
}

// Helper function to format conversation history with smart compression
async function formatConversationHistory(conversationHistory: any[]): Promise<string> {
  if (conversationHistory.length === 0) return '';

  // Count tokens in full history
  const fullHistory = conversationHistory.map(msg => {
    const role = msg.role === 'user' ? 'User' : 'Assistant';
    return `${role}: ${msg.content}`;
  }).join('\n');

  const totalTokens = countTokens(fullHistory);

  // If under limit, send all
  if (totalTokens <= SOFT_TOKEN_LIMIT) {
    return `Previous conversation:\n${fullHistory}\n\nCurrent message:\n`;
  }

  // Over limit: summarize old, keep last 5 verbatim
  const recentCount = 5;
  const oldMessages = conversationHistory.slice(0, -recentCount);
  const recentMessages = conversationHistory.slice(-recentCount);

  const summary = await summarizeMessages(oldMessages);

  const recentFormatted = recentMessages.map(msg => {
    const role = msg.role === 'user' ? 'User' : 'Assistant';
    return `${role}: ${msg.content}`;
  }).join('\n');

  return `Previous conversation summary:\n${summary}\n\nRecent messages:\n${recentFormatted}\n\nCurrent message:\n`;
}

// System prompt for Support Agent
const SUPPORT_AGENT_PROMPT = `You are a friendly and helpful customer support agent.

Your role:
- Answer general questions and FAQs about products and services
- Help customers with common issues
- Provide clear and concise information
- Be professional, friendly, and patient

Guidelines:
- Keep responses short and to the point
- If you don't know something, be honest
- Always maintain a helpful tone
- Focus on solving the customer's problem`;

// System prompt for Order Agent
const ORDER_AGENT_PROMPT = `You are an order management specialist.

Your role:
- Help customers track and manage their orders
- Provide order status and delivery information
- Assist with order modifications and cancellations
- Answer questions about order details

Guidelines:
- Use order numbers from the conversation history when available, otherwise ask the customer to provide them
- Provide clear tracking and delivery information
- Be helpful when processing order changes
- Keep responses concise and accurate`;

// System prompt for Billing Agent
const BILLING_AGENT_PROMPT = `You are a billing and payment specialist.

Your role:
- Help customers with invoice and payment inquiries
- Provide payment status and refund information
- Answer questions about billing and charges
- Assist with payment-related concerns

Guidelines:
- Use invoice numbers from the conversation history when available, otherwise ask the customer to provide them
- Provide clear payment and refund status information
- Be empathetic when handling refund requests
- Keep responses professional and accurate`;

// System prompt for Router Agent
const ROUTER_AGENT_PROMPT = `You are a routing agent that classifies customer inquiries.

Your task is to analyze the customer's message and determine which specialized agent should handle it:
- "support" for general questions, FAQs, and conversation history
- "order" for order tracking, delivery status, and order modifications
- "billing" for invoices, payments, and refunds

Set confidence level (0-1) based on how certain you are that the chosen agent can resolve the inquiry:
- High confidence (0.8-1.0): Clear intent matching one of the three agents
- Medium confidence (0.5-0.79): Somewhat unclear but likely resolvable
- Low confidence (0-0.49): Vague, unclear, or outside the scope of the three agents

Use low confidence for requests that are ambiguous, out of scope, or need clarification.`;

// System prompt for Fallback Agent
const FALLBACK_AGENT_PROMPT = `You are a helpful assistant that guides customers back to what our system can help with.

Your role is to politely explain that you can only help with specific topics and redirect them:

**What we can help you with:**

📋 **General Support** - FAQs, product questions, account help
📦 **Orders** - Track orders, delivery status, modify or cancel orders
💳 **Billing** - Invoice details, payment info, refund requests

If the request is unclear or outside these areas, politely ask them to clarify or rephrase their question within these topics.

Always keep responses brief and redirect back to our capabilities.`;

export async function callSupportAgent(message: string, userId: string, conversationHistory: any[], conversationId: string): Promise<any> {
  const historyContext = await formatConversationHistory(conversationHistory);
  const fullPrompt = historyContext + message;

  const result = streamText({
    model: model,
    system: `${SUPPORT_AGENT_PROMPT}\n\nYou are currently assisting user: ${userId}`,
    prompt: fullPrompt,
    tools: {
      queryConversationHistory: tool({
        description: 'Get past conversation history for a user. Use this when the user asks about previous conversations or mentions something from the past.',
        inputSchema: z.object({
          userId: z.string().describe('The ID of the user to query history for')
        }),
        execute: async ({ userId }) => {
          return await queryConversationHistory(userId);
        }
      })
    },
    toolChoice: 'auto',
    stopWhen: stepCountIs(5),
    onFinish: async ({ text }) => {
      await saveMessage(conversationId, 'assistant', text, 'support');
    }
  });

  return result;
}

export async function callOrderAgent(message: string, userId: string, conversationHistory: any[], conversationId: string): Promise<any> {
  const historyContext = await formatConversationHistory(conversationHistory);
  const fullPrompt = historyContext + message;

  const result = streamText({
    model: model,
    system: `${ORDER_AGENT_PROMPT}\n\nYou are currently assisting user: ${userId}`,
    prompt: fullPrompt,
    tools: {
      listUserOrders: tool({
        description: 'Get a list of all orders for the current user. Use this when the customer asks to see their orders or order history.',
        inputSchema: z.object({
          userId: z.string().describe('The ID of the user')
        }),
        execute: async ({ userId }) => {
          return await listUserOrders(userId);
        }
      }),
      getOrderDetails: tool({
        description: 'Get detailed information about a specific order. Use this when the customer asks about their order.',
        inputSchema: z.object({
          orderNumber: z.string().describe('The order number to look up'),
          userId: z.string().describe('The ID of the user')
        }),
        execute: async ({ orderNumber, userId }) => {
          return await getOrderDetails(orderNumber, userId);
        }
      }),
      getDeliveryStatus: tool({
        description: 'Get delivery and tracking information for an order. Use this when the customer asks about delivery or tracking.',
        inputSchema: z.object({
          orderNumber: z.string().describe('The order number to look up'),
          userId: z.string().describe('The ID of the user')
        }),
        execute: async ({ orderNumber, userId }) => {
          return await getDeliveryStatus(orderNumber, userId);
        }
      }),
      modifyOrder: tool({
        description: 'Modify or cancel an order. Use this when the customer wants to cancel or change their order.',
        inputSchema: z.object({
          orderNumber: z.string().describe('The order number to modify'),
          userId: z.string().describe('The ID of the user'),
          action: z.string().describe('The action to perform (e.g., "cancel")')
        }),
        execute: async ({ orderNumber, userId, action }) => {
          return await modifyOrder(orderNumber, userId, action);
        }
      })
    },
    toolChoice: 'auto',
    stopWhen: stepCountIs(5),
    onFinish: async ({ text }) => {
      await saveMessage(conversationId, 'assistant', text, 'order');
    }
  });

  return result;
}

export async function callBillingAgent(message: string, userId: string, conversationHistory: any[], conversationId: string): Promise<any> {
  const historyContext = await formatConversationHistory(conversationHistory);
  const fullPrompt = historyContext + message;

  const result = streamText({
    model: model,
    system: `${BILLING_AGENT_PROMPT}\n\nYou are currently assisting user: ${userId}`,
    prompt: fullPrompt,
    tools: {
      getInvoiceDetails: tool({
        description: 'Get detailed information about an invoice. Use this when the customer asks about their invoice or payment.',
        inputSchema: z.object({
          invoiceNumber: z.string().describe('The invoice number to look up'),
          userId: z.string().describe('The ID of the user')
        }),
        execute: async ({ invoiceNumber, userId }) => {
          return await getInvoiceDetails(invoiceNumber, userId);
        }
      }),
      checkRefundStatus: tool({
        description: 'Check the refund status for an invoice. Use this when the customer asks about a refund.',
        inputSchema: z.object({
          invoiceNumber: z.string().describe('The invoice number to check'),
          userId: z.string().describe('The ID of the user')
        }),
        execute: async ({ invoiceNumber, userId }) => {
          return await checkRefundStatus(invoiceNumber, userId);
        }
      })
    },
    toolChoice: 'auto',
    stopWhen: stepCountIs(5),
    onFinish: async ({ text }) => {
      await saveMessage(conversationId, 'assistant', text, 'billing');
    }
  });

  return result;
}

export async function callRouterAgent(message: string, userId: string, conversationHistory: any[], previousAgentType?: string) {
  const systemPrompt = previousAgentType
    ? `${ROUTER_AGENT_PROMPT}\n\nIMPORTANT: The previous message was handled by the ${previousAgentType} agent. Maintain continuity with the same agent for follow-up responses (like "thanks", "ok", "got it") or related questions. Only switch agents if the customer clearly changes topic to a different domain.`
    : ROUTER_AGENT_PROMPT;

  const historyContext = await formatConversationHistory(conversationHistory);
  const fullPrompt = historyContext + message;

  const result = await generateObject({
    model: model,
    system: systemPrompt,
    prompt: fullPrompt,
    schema: z.object({
      agentType: z.enum(['support', 'order', 'billing']).describe('The type of agent to route to'),
      confidence: z.number().min(0).max(1).describe('Confidence level between 0 and 1 for this classification'),
      reasoning: z.string().describe('Brief explanation of why this agent was chosen')
    })
  });

  return result.object;
}

export async function callFallbackAgent(message: string, userId: string, conversationHistory: any[], conversationId: string): Promise<any> {
  const historyContext = await formatConversationHistory(conversationHistory);
  const fullPrompt = historyContext + message;

  const result = streamText({
    model: model,
    system: `${FALLBACK_AGENT_PROMPT}\n\nYou are currently assisting user: ${userId}`,
    prompt: fullPrompt,
    toolChoice: 'none',
    stopWhen: stepCountIs(5),
    onFinish: async ({ text }) => {
      await saveMessage(conversationId, 'assistant', text, 'fallback');
    }
  });

  return result;
}
