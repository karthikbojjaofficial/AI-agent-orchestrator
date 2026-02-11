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

  // Auto-scroll to bottom when new messages arrive or content updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
