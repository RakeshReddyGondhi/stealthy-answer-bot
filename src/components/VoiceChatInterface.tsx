import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VoiceRecorder, blobToBase64 } from '@/utils/voiceRecorder';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const VoiceChatInterface = () => {
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
      // Convert audio to base64
      const base64Audio = await blobToBase64(audioBlob);

      // Transcribe audio
      console.log('Transcribing audio...');
      const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke(
        'voice-transcribe',
        {
          body: { audio: base64Audio },
        }
      );

      if (transcriptError) throw transcriptError;
      if (!transcriptData?.text) throw new Error('No transcription received');

      const question = transcriptData.text;
      console.log('Transcribed question:', question);

      // Add user message
      const userMessage: Message = {
        role: 'user',
        content: question,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      console.log('Getting AI response...');
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const { data: chatData, error: chatError } = await supabase.functions.invoke(
        'voice-chat',
        {
          body: {
            question,
            conversationHistory,
          },
        }
      );

      if (chatError) throw chatError;
      if (!chatData?.answer) throw new Error('No answer received');

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: chatData.answer,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process audio',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Voice Chat Assistant</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isListening ? 'Listening for your questions...' : 'Start a conversation'}
                </p>
              </div>
              <Button
                onClick={isListening ? stopListening : startListening}
                size="lg"
                variant={isListening ? 'destructive' : 'default'}
                className="gap-2"
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                {isListening ? 'Stop' : 'Start'}
              </Button>
            </div>

            {/* Status Indicators */}
            <div className="flex gap-4 mb-6">
              {isListening && (
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-success animate-pulse' : 'bg-muted'}`} />
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
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoiceChatInterface;
