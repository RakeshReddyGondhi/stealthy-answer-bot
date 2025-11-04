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

  // Show answer box only when NOT screen sharing
  if (isScreenSharing) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      maxWidth: '300px',
      padding: '15px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      borderRadius: '8px',
      fontSize: '14px',
      zIndex: 9999,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Answer:</div>
      <div>{conversationText || 'Listening...'}</div>
    </div>
  );
};

export default VoiceChatInterface;
