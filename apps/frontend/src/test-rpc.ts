// Type safety test file - This file demonstrates RPC type safety
import client from './api/client'

// Test 1: Valid endpoint - TypeScript knows about /health
async function testValidEndpoint() {
  const response = await client.health.$get()
  const data = await response.json()

  // TypeScript infers the type of data.status
  console.log(data.status) // ✓ Type-safe: knows 'status' exists
}

// Test 2: Wrong endpoint - This should show TypeScript error
async function testInvalidEndpoint() {
  // @ts-expect-error - This endpoint doesn't exist
  const response = await client.nonexistent.$get()
  console.log(response)
}

// Test 3: API routes - TypeScript knows about /api/chat/messages
async function testAPIRoute() {
  // This shows autocomplete works for nested routes
  const response = await client.api.chat.messages.$post({
    json: {
      message: 'test'
    },
    headers: {
      'x-user-id': 'user_1'
    }
  })

  // Response is properly typed
  const data = await response.text()
  console.log(data)
}

// Export to prevent unused variable warnings
export { testValidEndpoint, testInvalidEndpoint, testAPIRoute }
