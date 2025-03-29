import React from 'react';
import { X, RefreshCw } from 'lucide-react';

interface ChatHeaderProps {
  handleClose: () => void;
  handleRefresh: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ handleClose, handleRefresh }) => {
  return (
    <div className="chat-widget-header">
      <div className="chat-widget-title">Chat Widget</div>
      <div className="chat-widget-controls">
        <RefreshCw className="chat-widget-control-icon" onClick={handleRefresh} />
        <X className="chat-widget-control-icon" onClick={handleClose} />
      </div>
    </div>
  );
};

export default ChatHeader;
