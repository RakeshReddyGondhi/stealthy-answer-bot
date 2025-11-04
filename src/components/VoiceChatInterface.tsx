import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VoiceRecorder, blobToBase64 } from '@/utils/voiceRecorder';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useScreenShareActive } from '@/hooks/useScreenShareActive';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const VoiceChatInterface = () => {
  const isScreenSharing = useScreenShareActive();
  
  // Auto-hide during screensharing
  if (isScreenSharing) {
    return null;
  }

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup audio recorder on component unmount
  useEffect(() => {
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
          setIsSpeaking(true);
          console.log('Speech detected, recording...');
        },
        // On silence detected
        async (audioBlob) => {
          setIsSpeaking(false);
          await processAudio(audioBlob);
        }
      );
      setIsListening(true);
      toast({
        title: 'Listening',
        description: 'Speak naturally. I\'ll automatically process your questions.',
      });
    } catch (error) {
      console.error('Error starting recorder:', error);
      toast({
        title: 'Error',
        description: 'Could not access microphone. Please grant permission.',
        variant: 'destructive',
      });
    }
  };

  const stopListening = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const base64Audio = await blobToBase64(audioBlob);
      
      // Add user message
      const userMessage: Message = {
        role: 'user',
        content: 'Processing voice input...',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('process-voice', {
        body: { audio: base64Audio },
      });

      if (error) throw error;

      // Update user message with transcription
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: data.transcription,
        };
        return updated;
      });

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Speak the response
      if (data.audioResponse) {
        const audio = new Audio(`data:audio/mpeg;base64,${data.audioResponse}`);
        await audio.play();
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: 'Error',
        description: 'Failed to process audio. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Voice Chat Assistant</h2>
            <Button
              onClick={isListening ? stopListening : startListening}
              variant={isListening ? 'destructive' : 'default'}
              size="lg"
              className="gap-2"
            >
              {isListening ? (
                <>
                  <MicOff className="h-5 w-5" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  Start Listening
                </>
              )}
            </Button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4 text-sm">
            {isListening && (
              <div className="flex items-center gap-2 text-green-600">
                <div className="h-3 w-3 rounded-full bg-green-600 animate-pulse" />
                {isSpeaking ? 'Speaking...' : 'Waiting for speech'}
              </div>
            )}
            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </div>
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="h-[500px] pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Start listening to begin your conversation</p>
                  <p className="text-sm mt-2">Questions will be automatically detected and answered</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp instanceof Date 
                          ? message.timestamp.toLocaleTimeString()
                          : new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceChatInterface;
