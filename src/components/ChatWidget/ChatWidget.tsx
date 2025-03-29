import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import './ChatWidget.css';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';
import { useToast } from '../../hooks/use-toast';

interface Message {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatWidgetProps {
  n8nWebhookURL: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ n8nWebhookURL }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const { toast } = useToast();
  const botName = "Taylor";

  // Add initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          content: "Welcome 👋! How can I help you today?",
          isUser: false,
          timestamp: new Date()
        }
      ]);
    }
  }, [messages]);

  const { isRecording, isTranscribing, startRecording, stopRecording } = useSpeechRecognition({
    onTranscription: (text) => {
      setInputText(text);
    },
    onFinalTranscript: (text) => {
      sendMessage(text);
    }
  });

  const toggleWidget = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (isRecording) {
      stopRecording();
    }
    setTimeout(() => setIsMinimized(true), 300); // Wait for animation to complete
  };

  const resetSession = () => {
    // Generate a new session ID
    setSessionId(crypto.randomUUID());
    
    // Clear all messages
    setMessages([]);
    
    // Reset input text
    setInputText('');
    
    // Show a toast notification
    toast({
      title: "Chat Reset",
      description: "Your chat session has been reset.",
      variant: "default",
    });
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      content: content,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setWaitingForResponse(true);

    try {
      // Add a typing indicator
      const typingMessage: Message = {
        content: "...",
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, typingMessage]);

      // Prepare the payload according to n8n chat widget format
      const payload = {
        action: 'sendMessage',
        sessionId: sessionId,
        chatInput: content,
        message: content,
        type: 'text',
        timestamp: new Date().toISOString()
      };

      // Send to n8n webhook
      const response = await fetch(n8nWebhookURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg !== typingMessage));

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Process the response - n8n typically returns JSON but can also return text
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const textResponse = await response.text();
        try {
          // Try to parse it as JSON anyway (some servers misconfigure content-type)
          responseData = JSON.parse(textResponse);
        } catch (e) {
          // If it's not JSON, use it as plain text
          responseData = textResponse;
        }
      }
      
      // Handle various response formats from n8n
      let botResponseText = '';
      
      if (typeof responseData === 'string') {
        botResponseText = responseData;
      } else if (responseData.output) {
        // Handle n8n AI response format
        botResponseText = responseData.output;
      } else if (responseData.message) {
        botResponseText = responseData.message;
      } else if (responseData.response) {
        botResponseText = responseData.response;
      } else if (responseData.text) {
        botResponseText = responseData.text;
      } else if (responseData.content) {
        botResponseText = responseData.content;
      } else {
        console.warn('Unrecognized response format from n8n:', responseData);
        botResponseText = "I've received your message, but I'm not sure how to process the response.";
      }
      
      // Add the bot response
      const botMessage: Message = {
        content: botResponseText,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Display error in chat
      const errorMessage: Message = {
        content: "Sorry, there was an error communicating with the server.",
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Also show a toast notification
      toast({
        title: "Connection Error",
        description: "Failed to receive a response from the server. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setWaitingForResponse(false);
    }
  };

  const handleSendClick = () => {
    sendMessage(inputText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  if (!isOpen && isMinimized) {
    return (
      <div className="chat-widget-bubble" onClick={toggleWidget}>
        <MessageSquare className="chat-widget-bubble-icon" />
      </div>
    );
  }

  return (
    <div className={`chat-widget-container ${isOpen ? 'open' : 'closing'}`}>
      <ChatHeader handleClose={handleClose} handleRefresh={resetSession} />
      
      {!isMinimized && (
        <>
          <MessageList messages={messages} botName={botName} />
          
          <ChatInput 
            inputText={inputText}
            setInputText={setInputText}
            isRecording={isRecording}
            startRecording={startRecording}
            stopRecording={stopRecording}
            sendMessage={handleSendClick}
            handleKeyDown={handleKeyDown}
            disabled={waitingForResponse}
          />
          
          <div className="chat-widget-footer">
            {/* Footer content removed */}
          </div>
        </>
      )}
    </div>
  );
};

export default ChatWidget;
