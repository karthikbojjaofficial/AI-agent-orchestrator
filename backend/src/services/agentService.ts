import { openai } from '@ai-sdk/openai';
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { queryConversationHistory } from '../tools/conversationTools.js';
import { getOrderDetails, getDeliveryStatus, modifyOrder } from '../tools/orderTools.js';
import { getInvoiceDetails, checkRefundStatus } from '../tools/billingTools.js';
import { saveMessage } from './conversationService.js';

// Setup AI client
const model = openai('gpt-4o-mini');

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
- Always verify order numbers with the customer
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
- Always verify invoice numbers with the customer
- Provide clear payment and refund status information
- Be empathetic when handling refund requests
- Keep responses professional and accurate`;

export async function callSupportAgent(message: string, userId: string, conversationHistory: any[], conversationId: string) {
  const result = streamText({
    model: model,
    system: `${SUPPORT_AGENT_PROMPT}\n\nYou are currently assisting user: ${userId}`,
    prompt: message,
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

export async function callOrderAgent(message: string, userId: string, conversationHistory: any[], conversationId: string) {
  const result = streamText({
    model: model,
    system: `${ORDER_AGENT_PROMPT}\n\nYou are currently assisting user: ${userId}`,
    prompt: message,
    tools: {
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

export async function callBillingAgent(message: string, userId: string, conversationHistory: any[], conversationId: string) {
  const result = streamText({
    model: model,
    system: `${BILLING_AGENT_PROMPT}\n\nYou are currently assisting user: ${userId}`,
    prompt: message,
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

export async function callRouterAgent(message: string, conversationHistory: any[]) {
  // TODO: Implement router logic to decide which agent to call
  return 'Router agent response';
}
