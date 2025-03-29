
import React, { useState } from 'react';
import ChatWidget from '@/components/ChatWidget';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  // State for the n8n webhook URL input
  const [webhookURL, setWebhookURL] = useState('');
  const [isWidgetActive, setIsWidgetActive] = useState(false);

  // Get the current domain for use in the embed script example
  const currentDomain = window.location.origin;

  const activateWidget = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookURL.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid n8n webhook URL",
        variant: "destructive",
      });
      return;
    }
    
    setIsWidgetActive(true);
    
    toast({
      title: "Chat Widget Activated",
      description: "The chat widget is now active in the bottom-right corner.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-4xl font-bold mb-6 text-gray-900">Embeddable Chat Widget</h1>
      <p className="text-lg text-center max-w-2xl mb-8 text-gray-600">
        This is a demonstration of the chat widget embedded in a page. 
        {!isWidgetActive && " Enter your n8n webhook URL below to activate the widget."}
      </p>
      
      {!isWidgetActive ? (
        <form onSubmit={activateWidget} className="w-full max-w-lg mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="url"
              value={webhookURL}
              onChange={(e) => setWebhookURL(e.target.value)}
              placeholder="Enter your n8n webhook URL"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Activate Widget
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Example n8n webhook URL: <code className="bg-gray-100 px-2 py-1 rounded">https://n8n.example.com/webhook/abc-123-def</code>
          </p>
        </form>
      ) : (
        <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-8 max-w-lg">
          <p className="text-green-700">
            Chat widget is active! Look for it in the bottom-right corner of the page.
          </p>
          <p className="text-green-600 mt-2 text-sm">
            Using webhook: <code className="bg-white px-2 py-1 rounded">{webhookURL}</code>
          </p>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">How to Embed This Widget</h2>
        <p className="text-gray-700 mb-4">
          To add this chat widget to your website, copy the following code snippet and paste it before the closing &lt;/body&gt; tag:
        </p>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm mb-4">
          {`<script src="${currentDomain}/chat-widget.js"></script>
<script>
  window.addEventListener('DOMContentLoaded', function() {
    initChatWidget('YOUR_N8N_WEBHOOK_URL');
  });
</script>`}
        </pre>
        <p className="text-gray-700 mb-4">
          Replace <code className="bg-gray-100 px-2 py-1 rounded">YOUR_N8N_WEBHOOK_URL</code> with your actual n8n webhook URL.
        </p>
        <p className="text-red-600 font-medium">
          Important: Make sure the script is accessible at <code className="bg-gray-100 px-2 py-1 rounded">{currentDomain}/chat-widget.js</code>
        </p>
      </div>
      
      {/* Include the chat widget only if activated */}
      {isWidgetActive && <ChatWidget n8nWebhookURL={webhookURL} />}
      
      {/* Toaster for notifications */}
      <Toaster />
    </div>
  );
};

export default Index;
