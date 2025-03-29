import React, { useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  sendMessage: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  setInputText,
  isRecording,
  startRecording,
  stopRecording,
  sendMessage,
  handleKeyDown,
  disabled = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll the textarea to show the latest text
  useEffect(() => {
    if (textareaRef.current && isRecording) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [inputText, isRecording]);

  return (
    <div className="chat-widget-input">
      <div className="chat-widget-input-container">
        {isRecording ? (
          <button 
            className="chat-widget-mic-button recording" 
            onClick={stopRecording}
            aria-label="Stop recording"
            disabled={disabled}
          >
            <MicOff size={24} />
          </button>
        ) : (
          <button 
            className="chat-widget-mic-button"
            onClick={startRecording}
            aria-label="Start recording"
            disabled={disabled}
          >
            <Mic size={24} />
          </button>
        )}
        <textarea
          ref={textareaRef}
          placeholder={disabled ? "Waiting for response..." : "Type your message..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRecording || disabled}
          rows={2}
          className="chat-widget-textarea"
        />
        <button 
          className="chat-widget-send-button"
          onClick={sendMessage}
          disabled={!inputText.trim() || isRecording || disabled}
          aria-label="Send message"
        >
          <Send size={24} />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
