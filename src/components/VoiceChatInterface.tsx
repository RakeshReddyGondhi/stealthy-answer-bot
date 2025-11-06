import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VoiceRecorder, blobToBase64 } from '@/utils/voiceRecorder';
import { useScreenShareActive } from '@/hooks/useScreenShareActive';

const VoiceChatInterface = () => {
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const [conversationText, setConversationText] = useState<string>('');
  const isScreenSharing = useScreenShareActive();

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
        },
        // On silence detected - process audio
        async (audioBlob) => {
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

      // Update conversation text with the latest AI answer
      setConversationText(data.response);

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

  // No visible UI - all functionality runs in background
  return null;
};

export default VoiceChatInterface;
