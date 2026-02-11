# AI Customer Support System

A full-stack AI customer support system with multi-agent architecture. The system intelligently routes customer inquiries to specialized agents (Support, Order, Billing) and maintains conversation context.

## Tech Stack

- **Monorepo**: Turborepo
- **Frontend**: React 19 + Vite + TypeScript
- **Backend**: Hono.dev + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **AI**: OpenAI GPT-4o-mini via Vercel AI SDK
- **RPC**: Hono RPC (end-to-end type safety)
- **Testing**: Vitest + Supertest

## Architecture

### Multi-Agent System

**Router Agent** → Classifies user intent and routes to appropriate agent:
- Returns: `{ agentType, confidence, reasoning }`
- Confidence thresholds: 0.7 (new) / 0.85 (continuity)
- Maintains conversation continuity for follow-ups

**Specialized Agents:**
1. **Support Agent** - FAQs, general questions, conversation history
   - Tool: `queryConversationHistory`
2. **Order Agent** - Order tracking, delivery, modifications
   - Tools: `listUserOrders`, `getOrderDetails`, `getDeliveryStatus`, `modifyOrder`
3. **Billing Agent** - Invoices, payments, refunds
   - Tools: `getInvoiceDetails`, `checkRefundStatus`
4. **Fallback Agent** - Low confidence queries, explains system capabilities

### Context Management

**Smart Token Compression:**
- Soft limit: 1,000 tokens per conversation
- Under limit: Send full history
- Over limit: Summarize old messages + keep last 5 verbatim
- Uses tiktoken for accurate token counting

### Rate Limiting

- **Limit**: 15 requests per minute per user/IP
- **Storage**: In-memory Map
- **Response**: HTTP 429 with `Retry-After` header
- **Scope**: Applied to all `/api/chat/*` routes

### Request Flow

```
User Message
  ↓
Middleware (extract userId, validate, rate limit)
  ↓
Controller (chatController)
  ↓
Load conversation history from DB
  ↓
Router Agent (classify intent)
  ↓
Specialized Agent (with tools)
  ↓
Stream response to user
  ↓
Save messages to DB
```

## Project Structure

```
ai-agent-orchestrator/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── controllers/      # HTTP request handlers
│   │   │   ├── services/         # Business logic, agents
│   │   │   ├── tools/            # Database query tools
│   │   │   ├── middleware/       # User validation, rate limiting
│   │   │   ├── __tests__/        # Unit & integration tests
│   │   │   └── index.ts          # App entry point
│   │   └── prisma/
│   │       ├── schema.prisma     # Database schema
│   │       └── seed.ts           # Seed data
│   └── frontend/
│       └── src/
│           ├── components/       # React components
│           ├── api/              # Hono RPC client
│           └── App.tsx
├── turbo.json                    # Turborepo config
└── package.json                  # Root workspace
```

## Database Schema

**Conversation**
- id, userId, title, createdAt, updatedAt

**Message**
- id, conversationId, role, content, agentType, createdAt

**Order**
- id, userId, orderNumber, status, items (JSON), total, trackingNumber, estimatedDelivery

**Payment**
- id, userId, orderId, invoiceNumber, amount, status, paymentMethod, refundStatus

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm 10+
- Docker (for PostgreSQL)

### 1. Clone & Install

```bash
git clone <repo-url>
cd ai-agent-orchestrator
npm install
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

This starts PostgreSQL on `localhost:5432`:
- Database: `ai_support`
- User/Password: `postgres/postgres`

### 3. Configure Environment

Create `apps/backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_support"
OPENAI_API_KEY="your-openai-api-key"
```

### 4. Setup Database

```bash
cd apps/backend

# Run migrations
npx prisma migrate dev

# Seed test data
npm run seed
```

**Seed data includes:**
- 3 test users: `user_1`, `user_2`, `user_3`
- Orders with various statuses (delivered, shipped, pending, cancelled)
- Payments with different states (paid, refunded, failed)
- Sample conversations

### 5. Run the Application

**Option A: Run both apps with Turbo (from root):**

```bash
npm run dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

**Option B: Run separately:**

```bash
# Terminal 1 - Backend
cd apps/backend
npm run dev

# Terminal 2 - Frontend
cd apps/frontend
npm run dev
```
## Key Features Implemented

### 1. Type-Safe RPC (Hono RPC)

Frontend imports backend types for end-to-end type safety:

```ts
// Frontend
import type { AppType } from 'backend/src/index';
const client = hc<AppType>('http://localhost:3000');

// Fully typed API calls
await client.api.chat.messages.$post({...})
```

### 2. Streaming Responses

Uses Vercel AI SDK's `streamText` with `stopWhen: stepCountIs(5)`:
- Real-time response streaming
- Frontend displays chunks as they arrive
- Typing indicator during generation

### 3. Conversation Persistence

- All messages saved to database with agentType tracking
- Conversations auto-created on first message
- Full history loaded for context
- Cascade delete (conversation deletion removes messages)

### 4. Markdown Rendering

Frontend uses `react-markdown` to render:
- **Bold text**
- Lists and formatting
- Proper line breaks

### 5. User Management (No Auth)

Demo uses 3 predefined test users:
- Frontend: User picker dropdown (persists to localStorage)
- Backend: Validates `x-user-id` header
- Each user has isolated data (orders, payments, conversations)

## API Routes

```
POST   /api/chat/messages              # Send message (streaming)
GET    /api/chat/conversations          # List user conversations
GET    /api/chat/conversations/:id     # Get conversation with messages
DELETE /api/chat/conversations/:id     # Delete conversation
GET    /health                          # Health check
```

## Architectural Decisions

### Why Turborepo?

- Monorepo management with workspace awareness
- Shared type definitions between frontend/backend
- Parallel task execution
- **Note**: Frontend uses `cat | vite` workaround to prevent Turbo from killing Vite process

### Why Hono?

- Lightweight, fast HTTP framework
- Built-in RPC client for type-safe frontend-backend communication
- Better DX than Express for TypeScript projects

### Why Multi-Agent Architecture?

- **Separation of concerns**: Each agent specializes in one domain
- **Scalability**: Easy to add new agents (e.g., Shipping Agent)
- **Better tool usage**: Agents only have relevant tools, reducing token usage
- **Improved accuracy**: Specialized prompts per domain

### Why Context Compression?

- **Cost optimization**: OpenAI charges per token
- **Quality maintenance**: Recent messages stay verbatim for accuracy
- **Summarization**: Old messages compressed to save tokens while retaining context

### Why In-Memory Rate Limiting?

- **Simplicity**: No Redis/external service needed for demo
- **Sufficient for demo**: Works well for single-instance deployments
- **Note**: For production, use distributed rate limiting (Redis)

## Development Notes

### Turbo + Vite Issue

Turbo was killing the Vite dev server after startup. **Solution:**

```json
// apps/frontend/package.json
"scripts": {
  "dev": "cat | vite"  // Keeps stdin open
}
```

### Agent Prompt Engineering

**Key learnings:**
- ❌ "Always verify order numbers with customer" → Agent ignores context
- ✅ "Use order numbers from conversation history when available" → Works correctly

### Test Coverage

**Unit Tests:**
- All tools (order, billing, conversation)
- All middleware (user, validate, rate limit)
- All services (rateLimiter, conversationService)

**Integration Tests:**
- Chat API endpoints (POST/GET/DELETE)
- Rate limiting enforcement
- User validation flow

**Not Tested:**
- Agent service AI logic (complex, requires extensive AI SDK mocking)

## Troubleshooting

**Frontend only shows last message when loading conversation:**
- Fixed: Auto-scroll only on new messages, not when loading

**Agent asks for order number despite being in conversation:**
- Fixed: Updated agent prompts to check conversation history first

**Turbo kills Vite server:**
- Fixed: Use `cat | vite` in frontend dev script

**Rate limit persists after restart:**
- Expected: In-memory storage resets on server restart

## Future Enhancements

- [ ] Persistent rate limiting (Redis)
- [ ] Agent-specific tools lazy loading
- [ ] Conversation title auto-generation from first message
- [ ] User authentication (OAuth, JWT)
- [ ] Admin dashboard for monitoring conversations
- [ ] Export conversation history
- [ ] Multi-language support
- [ ] Sentiment analysis
- [ ] Agent handoff (escalation to human support)

## License

ISC
