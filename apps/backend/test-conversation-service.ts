import { startNewConversation, loadConversationById, saveMessage, listUserConversations } from './src/services/conversationService.js';

async function testConversationPersistence() {
  console.log('Testing conversation persistence...\n');

  // Test 1: Create new conversation
  console.log('1. Creating new conversation...');
  const newConv = await startNewConversation('user_1', 'Test Conversation');
  console.log('Created conversation:', newConv.id);

  // Test 2: Save messages
  console.log('\n2. Saving messages...');
  const userMsg = await saveMessage(newConv.id, 'user', 'Hello, I need help');
  console.log('Saved user message:', userMsg.id);

  const agentMsg = await saveMessage(newConv.id, 'assistant', 'I can help you with that!', 'support');
  console.log('Saved agent message:', agentMsg.id);

  // Test 3: Load conversation by ID
  console.log('\n3. Loading conversation by ID...');
  const loadedConv = await loadConversationById(newConv.id);
  console.log('Loaded conversation:', loadedConv?.title);
  console.log('Number of messages:', loadedConv?.messages.length);

  // Test 4: List user conversations
  console.log('\n4. Listing all user conversations...');
  const userConvs = await listUserConversations('user_1');
  console.log('Total conversations for user_1:', userConvs.length);

  console.log('\n✓ All tests passed!');
}

testConversationPersistence()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
