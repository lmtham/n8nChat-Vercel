(function() {
  // Configuration
  let n8nWebhookURL = 'YOUR_N8N_WEBHOOK_URL';
  let widgetInitialized = false;
  let sessionId = crypto.randomUUID(); // Generate a random session ID once
  let waitingForResponse = false;
  
  // Styles
  const styles = `
  /* Chat Widget Container */
  .chat-widget-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 384px; /* Increased by 20% from 320px */
    max-width: 90vw;
    height: 540px; /* Increased by 20% from 450px */
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    background-color: white;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    z-index: 9999;
    transition: all 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  /* Chat Widget Animation */
  .chat-widget-container.open {
    opacity: 1;
    transform: translateY(0);
  }

  .chat-widget-container.closing {
    opacity: 0;
    transform: translateY(20px);
    pointer-events: none;
  }

  /* Chat Widget Bubble */
  .chat-widget-bubble {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    background-color: #1e88e5;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(30, 136, 229, 0.3);
    transition: all 0.2s ease;
    z-index: 9999;
  }

  .chat-widget-bubble:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(30, 136, 229, 0.4);
  }

  .chat-widget-bubble-icon {
    color: white;
    width: 28px;
    height: 28px;
  }

  /* Chat Widget Header */
  .chat-widget-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background-color: #1e88e5;
    color: white;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
  }

  .chat-widget-title {
    font-weight: 600;
    font-size: 18px;
  }

  .chat-widget-controls {
    display: flex;
    align-items: center;
  }

  .chat-widget-control-icon {
    width: 18px;
    height: 18px;
    margin-left: 12px;
    cursor: pointer;
    opacity: 0.8;
    transition: opacity 0.2s ease;
  }

  .chat-widget-control-icon:hover {
    opacity: 1;
  }

  /* Chat Widget Messages */
  .chat-widget-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background-color: white;
  }

  .chat-widget-message {
    max-width: 85%;
    padding: 14px 16px;
    border-radius: 16px;
    position: relative;
    word-wrap: break-word;
    line-height: 1.4;
  }

  .chat-widget-message.user {
    align-self: flex-end;
    background-color: #f0f0f0;
    color: #333;
    border-bottom-right-radius: 4px;
  }

  .chat-widget-message.bot {
    align-self: flex-start;
    background-color: #f9f9f9;
    color: #333;
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
  }

  .chat-widget-bot-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  .chat-widget-bot-avatar {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    background-color: #1e88e5;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
  }

  .chat-widget-bot-name {
    font-weight: 600;
    color: #333;
  }

  .chat-widget-message-content {
    font-size: 14px;
  }

  .chat-widget-message-time {
    font-size: 10px;
    opacity: 0.6;
    margin-top: 4px;
    text-align: right;
  }

  /* Chat Widget Input Area */
  .chat-widget-input {
    padding: 12px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    background-color: white;
    position: relative;
  }

  .chat-widget-input-container {
    flex: 1;
    position: relative;
    border-radius: 24px;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    padding: 4px 8px;
    min-height: 56px;
  }

  .chat-widget-textarea {
    flex: 1;
    border: none;
    outline: none;
    padding: 10px;
    background-color: transparent;
    font-size: 14px;
    min-height: 40px;
    max-height: 80px;
    resize: none;
    overflow-y: auto;
    white-space: normal;
    text-overflow: ellipsis;
    line-height: 1.4;
    font-family: inherit;
    overflow-anchor: none;
  }

  .chat-widget-input input {
    flex: 1;
    border: none;
    outline: none;
    padding: 10px;
    background-color: transparent;
    font-size: 14px;
  }

  .chat-widget-actions {
    display: flex;
    align-items: center;
  }

  .chat-widget-send-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background-color: #f5f5f5;
    color: #ababab;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-left: 4px;
  }

  .chat-widget-send-button:hover {
    background-color: #e0e0e0;
  }

  .chat-widget-send-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .chat-widget-mic-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background-color: transparent;
    color: #ababab;
    cursor: pointer;
    margin-right: 4px;
    transition: all 0.2s ease;
  }

  .chat-widget-mic-button:hover {
    background-color: #f0f0f0;
  }

  .chat-widget-mic-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .chat-widget-mic-button.recording {
    background-color: rgba(255, 59, 48, 0.1);
    color: #ff3b30;
    animation: pulse 1.5s infinite;
  }

  .chat-widget-footer {
    padding: 10px 16px;
    text-align: center;
    color: transparent;
    font-size: 0;
    background-color: white;
    border-top: 1px solid #f0f0f0;
    height: 10px;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.4);
    }
    70% {
      box-shadow: 0 0 0 6px rgba(255, 59, 48, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(255, 59, 48, 0);
    }
  }
  `;

  // SVG Icons
  const icons = {
    messageSquare: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    send: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
    mic: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>',
    micOff: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    user: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    refreshCw: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>'
  };

  // Create DOM elements
  function createChatWidgetDOM() {
    if (widgetInitialized) return;
    
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
    
    // Create chat bubble
    const bubble = document.createElement('div');
    bubble.className = 'chat-widget-bubble';
    bubble.innerHTML = icons.messageSquare;
    bubble.setAttribute('aria-label', 'Open chat');
    document.body.appendChild(bubble);
    
    // Create widget container (hidden initially)
    const container = document.createElement('div');
    container.className = 'chat-widget-container';
    container.style.display = 'none';
    document.body.appendChild(container);
    
    let isOpen = false;
    let isMinimized = true;
    const messages = [];
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;
    let isTranscribing = false;
    let speechRecognition = null;
    const botName = "Taylor";
    
    // Function to reset the chat session
    function resetSession() {
      // Generate a new session ID
      sessionId = crypto.randomUUID();
      
      // Clear all messages except the welcome message
      messages.length = 0;
      
      // Add the initial welcome message back
      messages.push({
        content: "Welcome 👋! How can I help you today?",
        isUser: false,
        timestamp: new Date()
      });
      
      // Re-render the widget
      renderWidget();
    }
    
    // Add the initial message from the bot
    messages.push({
      content: "Welcome 👋! How can I help you today?",
      isUser: false,
      timestamp: new Date()
    });
    
    // Toggle widget when bubble is clicked
    bubble.addEventListener('click', () => {
      isMinimized = !isMinimized;
      
      if (isMinimized) {
        closeWidget();
      } else {
        openWidget();
      }
    });
    
    function openWidget() {
      isOpen = true;
      container.style.display = 'flex';
      bubble.style.display = 'none';
      
      // Small delay to trigger the animation
      setTimeout(() => {
        container.classList.add('open');
        renderWidget();
      }, 10);
    }
    
    function closeWidget() {
      isOpen = false;
      container.classList.remove('open');
      container.classList.add('closing');
      
      // Stop recording if active when closing
      if (isRecording) {
        stopRecording();
      }
      
      setTimeout(() => {
        container.style.display = 'none';
        container.classList.remove('closing');
        bubble.style.display = 'flex';
      }, 300);
    }
    
    function renderWidget() {
      container.innerHTML = `
        <div class="chat-widget-header">
          <div class="chat-widget-title">Chat Widget</div>
          <div class="chat-widget-controls">
            <div class="chat-widget-control-icon">${icons.refreshCw}</div>
            <div class="chat-widget-control-icon">${icons.x}</div>
          </div>
        </div>
        
        ${!isMinimized ? `
          <div class="chat-widget-messages">
            ${messages.map(message => `
              <div class="chat-widget-message ${message.isUser ? 'user' : 'bot'}">
                ${!message.isUser ? `
                  <div class="chat-widget-bot-header">
                    <div class="chat-widget-bot-avatar">
                      ${icons.user}
                    </div>
                    <div class="chat-widget-bot-name">${botName}</div>
                  </div>
                ` : ''}
                <div class="chat-widget-message-content">${message.content}</div>
              </div>
            `).join('')}
          </div>
          
          <div class="chat-widget-input">
            <div class="chat-widget-input-container">
              <button 
                class="chat-widget-mic-button ${isRecording ? 'recording' : ''}" 
                aria-label="${isRecording ? 'Stop recording' : 'Start recording'}"
                ${waitingForResponse ? 'disabled' : ''}
              >
                ${isRecording ? icons.micOff : icons.mic}
              </button>
              <textarea 
                placeholder="${waitingForResponse ? 'Waiting for response...' : 'Type your message...'}" 
                ${isRecording || waitingForResponse ? 'disabled' : ''}
                class="chat-widget-textarea"
                rows="2"
              >${isTranscribing ? '...' : ''}</textarea>
              <button 
                class="chat-widget-send-button" 
                aria-label="Send message"
                ${!document.querySelector('.chat-widget-input input')?.value?.trim() || isRecording || waitingForResponse ? 'disabled' : ''}
              >
                ${icons.send}
              </button>
            </div>
          </div>
          
          <div class="chat-widget-footer">
            Add AI chat to your site
          </div>
        ` : ''}
      `;
      
      // Add event listeners after rendering
      if (!isMinimized) {
        // Refresh button
        container.querySelector('.chat-widget-control-icon:first-child').addEventListener('click', resetSession);
        
        // Close button
        container.querySelector('.chat-widget-control-icon:last-child').addEventListener('click', closeWidget);
        
        // Input field
        const textarea = container.querySelector('.chat-widget-textarea');
        if (textarea) {
          textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const text = textarea.value.trim();
              if (text && !isRecording && !waitingForResponse) {
                sendMessage(text);
                textarea.value = '';
              }
            }
          });
          
          // Update send button state on input change
          textarea.addEventListener('input', () => {
            const sendButton = container.querySelector('.chat-widget-send-button');
            if (sendButton) {
              sendButton.disabled = !textarea.value.trim() || isRecording || waitingForResponse;
              sendButton.style.color = textarea.value.trim() && !isRecording && !waitingForResponse ? '#1e88e5' : '#ababab';
            }
          });
        }
        
        // Send button
        const sendButton = container.querySelector('.chat-widget-send-button');
        if (sendButton) {
          sendButton.addEventListener('click', () => {
            const text = textarea.value.trim();
            if (text && !isRecording && !waitingForResponse) {
              sendMessage(text);
              textarea.value = '';
              sendButton.disabled = true;
              sendButton.style.color = '#ababab';
            }
          });
        }
        
        // Mic button
        const micButton = container.querySelector('.chat-widget-mic-button');
        if (micButton) {
          micButton.addEventListener('click', () => {
            if (isRecording) {
              stopRecording();
            } else if (!waitingForResponse) {
              startRecording();
            }
          });
        }
        
        // Scroll to bottom of messages
        const messagesContainer = container.querySelector('.chat-widget-messages');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }
    }
    
    function sendMessage(content) {
      // Add user message
      messages.push({
        content: content,
        isUser: true,
        timestamp: new Date()
      });
      
      // Add typing indicator
      const typingIndicator = {
        content: "...",
        isUser: false,
        timestamp: new Date()
      };
      
      messages.push(typingIndicator);
      waitingForResponse = true;
      renderWidget();
      
      // Prepare payload for n8n webhook
      const payload = {
        action: 'sendMessage',
        sessionId: sessionId,
        chatInput: content,
        message: content,
        type: 'text',
        timestamp: new Date().toISOString()
      };
      
      // Send to n8n webhook
      fetch(n8nWebhookURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      .then(response => {
        // Remove typing indicator
        const typingIndex = messages.indexOf(typingIndicator);
        if (typingIndex !== -1) {
          messages.splice(typingIndex, 1);
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Check content type to handle both JSON and text responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return response.json();
        } else {
          return response.text().then(text => {
            try {
              // Try to parse as JSON anyway (some servers misconfigure content-type)
              return JSON.parse(text);
            } catch (e) {
              // If it's not valid JSON, return as plain text
              return text;
            }
          });
        }
      })
      .then(data => {
        // Process the response from n8n
        let botResponseText = '';
        
        if (typeof data === 'string') {
          botResponseText = data;
        } else if (data.output) {
          // This is the n8n AI format
          botResponseText = data.output;
        } else if (data.message) {
          botResponseText = data.message;
        } else if (data.response) {
          botResponseText = data.response;
        } else if (data.text) {
          botResponseText = data.text;
        } else if (data.content) {
          botResponseText = data.content;
        } else {
          // Fallback if response format is unknown
          botResponseText = "I've received your message, but I'm not sure how to process the response.";
          console.warn('Unrecognized response format from n8n:', data);
        }
        
        messages.push({
          content: botResponseText,
          isUser: false,
          timestamp: new Date()
        });
      })
      .catch(error => {
        console.error('Error sending message:', error);
        
        messages.push({
          content: "Sorry, there was an error communicating with the server.",
          isUser: false,
          timestamp: new Date()
        });
      })
      .finally(() => {
        waitingForResponse = false;
        renderWidget();
      });
    }
    
    async function startRecording() {
      try {
        // Try to use the Web Speech API for speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          
          let finalTranscript = '';
          let interimTranscript = '';
          
          recognition.onresult = (event) => {
            interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              } else {
                interimTranscript += transcript;
              }
            }
            
            // Show current transcription in the input field
            const input = container.querySelector('.chat-widget-input input');
            if (input) {
              input.value = finalTranscript || interimTranscript;
            }
          };
          
          recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isRecording = false;
            isTranscribing = false;
            renderWidget();
          };
          
          recognition.onend = () => {
            // Only end if we're still in recording state
            if (isRecording) {
              isRecording = false;
              isTranscribing = false;
              
              // Send the final transcript if it's not empty
              if (finalTranscript.trim()) {
                sendMessage(finalTranscript);
              }
              renderWidget();
            }
          };
          
          recognition.start();
          speechRecognition = recognition;
          isRecording = true;
          isTranscribing = true;
          renderWidget();
          return;
        }
        
        // Fall back to audio recording if speech recognition is not available
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          // Add a "processing" message
          const processingMessageIndex = messages.length;
          messages.push({
            content: "Processing your voice message...",
            isUser: false,
            timestamp: new Date()
          });
          renderWidget();
          
          try {
            // For this demo, we'll just convert to base64 and log it
            // In a real app, you would send this to your speech-to-text service
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
              const base64Audio = reader.result;
              
              // Since we don't have real transcription, use a placeholder
              const transcription = "Voice message received (speech-to-text not available in this browser)";
              
              // Remove the processing message
              messages.splice(processingMessageIndex, 1);
              
              // Add the transcribed message as a user message
              messages.push({
                content: transcription,
                isUser: true,
                timestamp: new Date()
              });
              renderWidget();
              
              // Send the transcribed message to n8n webhook
              await fetch(n8nWebhookURL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  action: 'sendMessage',
                  sessionId: sessionId,
                  chatInput: transcription,
                  message: transcription,
                  audioData: base64Audio,
                  type: 'audio',
                  timestamp: new Date().toISOString()
                }),
              })
              .then(response => {
                if (response.ok) {
                  return response.json()
                    .catch(() => response.text())
                    .then(data => {
                      let botResponse;
                      
                      if (typeof data === 'object') {
                        // Handle JSON response
                        botResponse = data.message || data.response || "I've received your voice message and I'm processing it.";
                      } else {
                        // Handle text response
                        botResponse = data || "I've received your voice message and I'm processing it.";
                      }
                      
                      messages.push({
                        content: botResponse,
                        isUser: false,
                        timestamp: new Date()
                      });
                    });
                } else {
                  throw new Error('Error response from webhook: ' + response.status);
                }
              })
              .catch(error => {
                console.error('Error sending audio:', error);
                messages.push({
                  content: "Sorry, there was an error processing your voice message.",
                  isUser: false,
                  timestamp: new Date()
                });
              })
              .finally(() => {
                renderWidget();
              });
            };
          } catch (error) {
            console.error('Error processing audio:', error);
            
            // Remove the processing message
            messages.splice(processingMessageIndex, 1);
            
            messages.push({
              content: "Sorry, there was an error processing your voice message.",
              isUser: false,
              timestamp: new Date()
            });
            renderWidget();
          }
          
          // Stop all audio tracks
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        renderWidget();
      } catch (error) {
        console.error('Error accessing microphone:', error);
        
        messages.push({
          content: "Sorry, I couldn't access your microphone. Please check your browser permissions.",
          isUser: false,
          timestamp: new Date()
        });
        renderWidget();
      }
    }
    
    function stopRecording() {
      if (speechRecognition && isTranscribing) {
        speechRecognition.stop();
        isTranscribing = false;
        // The onend handler will finish processing
      } else if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        renderWidget();
      }
    }
    
    widgetInitialized = true;
  }
  
  // Initialize widget with webhook URL
  window.initChatWidget = function(webhook) {
    if (webhook) {
      n8nWebhookURL = webhook;
    }
    // Add a version attribute to the widget to help with cache busting
    window.chatWidgetVersion = '1.0.1';
    createChatWidgetDOM();
  };
  
  // We'll rely on explicit initialization via initChatWidget
  // and not auto-initialize to prevent conflicts
})();
