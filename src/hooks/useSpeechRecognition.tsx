import { useState, useRef, useEffect } from 'react';

interface UseSpeechRecognitionProps {
  onTranscription: (text: string) => void;
  onFinalTranscript: (text: string) => void;
}

export function useSpeechRecognition({ onTranscription, onFinalTranscript }: UseSpeechRecognitionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef<string>('');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.abort();
      }
    };
  }, []);

  // Reset silence timer when speech is detected
  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    silenceTimerRef.current = setTimeout(() => {
      console.log("No speech detected for 3 seconds, stopping recording");
      if (isRecording) {
        stopRecording();
      }
    }, 3000); // 3 seconds of silence
  };

  const startRecording = async () => {
    try {
      // Initialize Web Speech API
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognitionAPI) {
        throw new Error("Speech recognition not supported in this browser");
      }
      
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Reset the final transcript when starting a new recording
      finalTranscriptRef.current = '';
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update with current transcription - always show the complete text
        const fullText = finalTranscriptRef.current + interimTranscript;
        onTranscription(fullText);
        
        // Reset the silence timer since we detected speech
        resetSilenceTimer();
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setIsTranscribing(false);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
      };
      
      recognition.onend = () => {
        // Only process if we're still in recording state
        // This prevents processing when there's a stop called programmatically
        console.log("Speech recognition ended, recording state:", isRecording);
        
        setIsRecording(false);
        setIsTranscribing(false);
        
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        
        // Only send the message if we have a transcript and we didn't manually stop
        if (finalTranscriptRef.current.trim()) {
          onFinalTranscript(finalTranscriptRef.current.trim());
        }
      };
      
      // Start the silence timer
      resetSilenceTimer();
      
      recognition.start();
      speechRecognitionRef.current = recognition;
      setIsRecording(true);
      setIsTranscribing(true);
      
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      
      // Fall back to audio recording if speech recognition is not available
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          // Convert audio chunks to blob and then to base64
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // In a real app, you would send this to a speech-to-text service
          // For demo, we'll use a placeholder message
          const transcription = "Voice message received (speech-to-text not available in this browser)";
          onFinalTranscript(transcription);
          
          // Stop all audio tracks
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        setIsRecording(true);
      } catch (microError) {
        console.error('Error accessing microphone:', microError);
      }
    }
  };

  const stopRecording = () => {
    console.log("Stopping recording. IsTranscribing:", isTranscribing, "IsRecording:", isRecording);
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      // The onend handler will take care of the rest
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setIsTranscribing(false);
  };

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording
  };
}
