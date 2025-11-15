import { useEffect, useRef, useState } from 'react';
import './VoiceChatInterface.css';
import { supabase } from '@/integrations/supabase/client';
import { VoiceRecorder, blobToBase64 } from '@/utils/voiceRecorder';
import { useAuth } from '@/hooks/useAuth';
import useAdminControl from '@/hooks/useAdminControl';
import { useSession } from '@/hooks/useSession';

const VoiceChatInterface = () => {
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const { user, isAdmin } = useAuth();
  const { denied, appLocked } = useAdminControl();
  const lastProcessingRef = useRef<number>(0);

  const { isApproved } = useSession();

  // Auto-start listening when component mounts and approved
  useEffect(() => {
    const checkPermissionAndStart = async () => {
      // Do not start if user is denied or app is globally locked for non-admins
      if (denied) {
        console.log('User denied — not starting voice chat');
        await speak('Access denied by administrator.');
        return;
      }

      if (appLocked && !isAdmin) {
        console.log('App is locked — not starting voice chat for non-admin');
        await speak('Application is currently locked.');
        return;
      }

      if (!isApproved) {
        console.log('Session not approved — waiting for admin approval');
        await speak('Waiting for administrator approval.');
        return;
      }

      await speak('Voice chat initialized. You can start speaking.');
      startListening();
    };

    checkPermissionAndStart();

    // Cleanup on unmount
    return () => {
      if (recorderRef.current) {
        recorderRef.current.stop();
        recorderRef.current = null;
      }
    };
  }, [denied, appLocked, isAdmin, isApproved]);

  const speak = async (text: string) => {
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => resolve();
      speechSynthesis.speak(utterance);
    });
  };

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
      await speak('Failed to initialize voice recorder. Please refresh the page.');
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    console.log('Processing audio...');

    // Rate-limit: prevent rapid repeated requests (60s window)
    const now = Date.now();
    if (now - lastProcessingRef.current < 60000) { // 1 minute cooldown
      console.log('Rate limit: please wait before asking again');
      await speak('Please wait a moment before asking again.');
      return;
    }
    lastProcessingRef.current = now;

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

      // Send answer to overlay window
      if (window.electron) {
        window.electron.send('show-overlay-answer', data.response);
      }

      // Persist help request for admin review
      if (user) {
        try {
          await supabase.from('help_requests').insert({
            user_id: user.id,
            title: data.transcription.slice(0, 80) || 'Voice request',
            question: data.transcription,
            status: 'answered'
          });
        } catch (e) {
          console.warn('Failed to persist help_request (non-fatal)', e);
        }
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      await speak('Sorry, there was an error processing your request.');
    }
  };

  // Return empty fragment - all UI is handled by overlay window
  return <></>;
};

export default VoiceChatInterface;
