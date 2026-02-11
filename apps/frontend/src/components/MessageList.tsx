import { useEffect, useRef } from 'react'
import Message from './Message'
import './MessageList.css'

interface MessageData {
  id: string
  role: 'user' | 'assistant'
  content: string
  agentType?: string
  isStreaming?: boolean
}

interface MessageListProps {
  messages: MessageData[]
}

function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessagesLengthRef = useRef(messages.length)

  // Auto-scroll to bottom only when new messages are added (not when loading)
  useEffect(() => {
    // Only scroll if messages were added (not replaced/loaded)
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMessagesLengthRef.current = messages.length
  }, [messages])

  return (
    <div className="message-list">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👋</div>
            <p className="empty-title">Welcome to Customer Support</p>
            <p className="empty-subtitle">
              Ask me anything about orders, billing, or general support.
              <br />
              I'm here to help!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message.id}
              role={message.role}
              content={message.content}
              agentType={message.agentType}
              isStreaming={message.isStreaming}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default MessageList
