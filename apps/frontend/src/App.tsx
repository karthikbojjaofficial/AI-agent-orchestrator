import { useState, useEffect } from 'react'
import UserPicker from './components/UserPicker'
import ConversationList from './components/ConversationList'
import MessageList from './components/MessageList'
import MessageInput from './components/MessageInput'
import client from './api/client'
import './App.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agentType?: string
  isStreaming?: boolean
}

interface Conversation {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
}

function App() {
  const [selectedUser, setSelectedUser] = useState<string>('user_1')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load conversations when user changes
  useEffect(() => {
    loadConversations()
  }, [selectedUser])

  const loadConversations = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await client.api.chat.conversations.$get(
        {},
        {
          headers: {
            'x-user-id': selectedUser,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to load conversations. Please try again.')
      }

      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (err) {
      console.error('Error loading conversations:', err)
      const errorMessage = err instanceof TypeError
        ? 'Unable to connect to server. Please check your connection.'
        : err instanceof Error
        ? err.message
        : 'Failed to load conversations. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const loadConversation = async (conversationId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await client.api.chat.conversations[':id'].$get(
        {
          param: { id: conversationId },
        },
        {
          headers: {
            'x-user-id': selectedUser,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to load conversation')
      }

      const data = await response.json()
      const conversation = data.conversation

      if (conversation && conversation.messages) {
        // Map backend messages to frontend format
        const mappedMessages: Message[] = conversation.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          agentType: msg.agentType,
          isStreaming: false,
        }))

        console.log('[loadConversation] Loaded messages:', mappedMessages.length, mappedMessages)
        setMessages(mappedMessages)
        setCurrentConversationId(conversationId)
      }
    } catch (err) {
      console.error('Error loading conversation:', err)
      setError(err instanceof Error ? err.message : 'Failed to load conversation')
    } finally {
      setLoading(false)
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await client.api.chat.conversations[':id'].$delete(
        {
          param: { id: conversationId },
        },
        {
          headers: {
            'x-user-id': selectedUser,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete conversation')
      }

      // Remove from conversations list
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))

      // Clear messages if this was the active conversation
      if (currentConversationId === conversationId) {
        setMessages([])
        setCurrentConversationId(null)
      }
    } catch (err) {
      console.error('Error deleting conversation:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete conversation')
    }
  }

  const handleNewConversation = () => {
    setMessages([])
    setCurrentConversationId(null)
  }

  const handleUserChange = (userId: string) => {
    setSelectedUser(userId)
    // Clear current conversation when user changes
    setMessages([])
    setCurrentConversationId(null)
  }

  const handleSendMessage = async (message: string) => {
    setError(null)
    setSending(true)

    // Add user message to UI immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
    }
    setMessages(prev => [...prev, userMessage])

    // Add placeholder for assistant message with streaming indicator
    const assistantMessageId = `assistant-${Date.now()}`
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      agentType: 'support',
      isStreaming: true,
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      // Make API call using Hono RPC client
      const response = await client.api.chat.messages.$post(
        {
          json: {
            message,
            conversationId: currentConversationId,
          },
        },
        {
          headers: {
            'x-user-id': selectedUser,
          },
        }
      )

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          throw new Error(`Rate limit exceeded. Please try again in ${retryAfter} seconds.`)
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Get conversationId from header if this was a new conversation
      const conversationIdFromHeader = response.headers.get('X-Conversation-Id')
      if (conversationIdFromHeader && !currentConversationId) {
        setCurrentConversationId(conversationIdFromHeader)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let accumulatedText = ''

      // Read stream chunks
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // Stream complete - mark message as no longer streaming
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, isStreaming: false }
                : msg
            )
          )
          break
        }

        // Decode chunk and accumulate
        const chunk = decoder.decode(value, { stream: true })
        accumulatedText += chunk

        // Update assistant message with accumulated text
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedText, isStreaming: true }
              : msg
          )
        )
      }

      // If this was a new conversation, reload conversations to get the new one
      if (!currentConversationId) {
        await loadConversations()
      }

    } catch (err) {
      console.error('Error sending message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')

      // Remove the placeholder assistant message on error
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Customer Support</h1>
        <UserPicker
          selectedUser={selectedUser}
          onUserChange={handleUserChange}
        />
      </header>

      <main className="main-container">
        <ConversationList
          conversations={conversations}
          activeConversationId={currentConversationId}
          onSelectConversation={loadConversation}
          onDeleteConversation={deleteConversation}
          onNewConversation={handleNewConversation}
          loading={loading && conversations.length === 0}
        />
        <div className="chat-panel">
          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠️</span>
              <span className="error-message">{error}</span>
              <button onClick={() => setError(null)} className="close-btn">✕</button>
            </div>
          )}
          <MessageList messages={messages} />
          <MessageInput onSend={handleSendMessage} disabled={sending} />
        </div>
      </main>
    </div>
  )
}

export default App
