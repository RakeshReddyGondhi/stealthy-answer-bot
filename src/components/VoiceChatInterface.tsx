import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VoiceRecorder, blobToBase64 } from '@/utils/voiceRecorder';
import { Mic, Bot, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const VoiceChatInterface = () => {
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-start listening when component mounts
  useEffect(() => {
    startListening();
    
    // Cleanup on unmount
    return () => {
      if (recorderRef.current) {
        recorderRef.current.stop();
        recorderRef.current = null;
      }
    };
  }, []);

  const startListening = async () => {
    try {
      const recorder = new VoiceRecorder();
      recorderRef.current = recorder;
      
      await recorder.initialize(
        // On speech detected
        () => {
          console.log('Speech detected, recording...');
          setIsListening(true);
        },
        // On silence detected - process audio
        async (audioBlob) => {
          setIsListening(false);
          await processAudio(audioBlob);
        }
      );
      
      console.log('Voice recorder initialized and listening...');
    } catch (error) {
      console.error('Error starting recorder:', error);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    console.log('Processing audio...');
    
    try {
      const base64Audio = await blobToBase64(audioBlob);
      
      console.log('Transcription: Processing voice input...');
      
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('process-voice', {
        body: { audio: base64Audio },
      });

      if (error) throw error;

      // Log transcription and response
      console.log('Transcription:', data.transcription);
      console.log('AI Response:', data.response);

      // Add messages to conversation
      setMessages(prev => [
        ...prev,
        { role: 'user', content: data.transcription, timestamp: new Date() },
        { role: 'assistant', content: data.response, timestamp: new Date() }
      ]);

      // Play audio response (always, regardless of screen sharing status)
      if (data.audioResponse) {
        const audio = new Audio(`data:audio/mpeg;base64,${data.audioResponse}`);
        await audio.play();
        console.log('Playing audio response...');
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-[var(--shadow-card)] border-2">
          <div className="p-6 border-b bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary rounded-full">
                <Mic className={`w-6 h-6 text-primary-foreground ${isListening ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Voice Chat</h1>
                <p className="text-sm text-muted-foreground">
                  {isListening ? 'Listening...' : 'Speak naturally to chat'}
                </p>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[500px]">
            <div ref={scrollRef} className="p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mic className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Start speaking to begin the conversation</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    <div className={`p-2 rounded-full ${message.role === 'assistant' ? 'bg-primary' : 'bg-accent'}`}>
                      {message.role === 'assistant' ? (
                        <Bot className="w-5 h-5 text-primary-foreground" />
                      ) : (
                        <User className="w-5 h-5 text-accent-foreground" />
                      )}
                    </div>
                    <div
                      className={`flex-1 p-4 rounded-lg ${
                        message.role === 'assistant'
                          ? 'bg-muted'
                          : 'bg-primary/10'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};

export default VoiceChatInterface;
