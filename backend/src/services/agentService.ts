import { openai } from '@ai-sdk/openai';
import { generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { queryConversationHistory } from '../tools/conversationTools.js';

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

export async function callSupportAgent(message: string, userId: string, conversationHistory: any[]) {
  const result = await generateText({
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
    stopWhen: stepCountIs(5)
  });

  console.log('Agent result:', JSON.stringify(result, null, 2));
  return result.text;
}

export async function callOrderAgent(message: string, conversationHistory: any[]) {
  // TODO: Implement order agent logic
  return 'Order agent response';
}

export async function callBillingAgent(message: string, conversationHistory: any[]) {
  // TODO: Implement billing agent logic
  return 'Billing agent response';
}

export async function callRouterAgent(message: string, conversationHistory: any[]) {
  // TODO: Implement router logic to decide which agent to call
  return 'Router agent response';
}
