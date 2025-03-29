
import React, { useRef, useEffect } from 'react';
import { User } from 'lucide-react';

interface Message {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface MessageListProps {
  messages: Message[];
  botName: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, botName }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="chat-widget-messages">
      {messages.map((message, index) => (
        <div 
          key={index} 
          className={`chat-widget-message ${message.isUser ? 'user' : 'bot'}`}
        >
          {!message.isUser && (
            <div className="chat-widget-bot-header">
              <div className="chat-widget-bot-avatar">
                <User size={18} />
              </div>
              <div className="chat-widget-bot-name">{botName}</div>
            </div>
          )}
          <div className="chat-widget-message-content">{message.content}</div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
