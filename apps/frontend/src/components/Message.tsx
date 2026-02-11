import TypingIndicator from './TypingIndicator'
import './Message.css'

interface MessageProps {
  role: 'user' | 'assistant'
  content: string
  agentType?: string
  isStreaming?: boolean
}

function Message({ role, content, agentType, isStreaming = false }: MessageProps) {
  // Show typing indicator for assistant messages with no content yet
  if (role === 'assistant' && !content && isStreaming) {
    return (
      <div className="message assistant">
        <TypingIndicator />
      </div>
    )
  }

  return (
    <div className={`message ${role}`}>
      <div className="message-content">
        {content}
      </div>
    </div>
  )
}

export default Message
