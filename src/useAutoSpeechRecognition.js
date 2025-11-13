import { useEffect } from 'react';

// This hook starts microphone, captures speech, and sends transcript to main process (Electron)
export function useAutoSpeechRecognition() {
  useEffect(() => {
    // Only run in browser/Electron renderer
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn('Speech recognition API not supported');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // auto-restart for repeated questioning
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      // Send transcript to main process via IPC for AI answering
      window.electron.ipcRenderer.send('question-from-voice', transcript);
    };
    recognition.onerror = function(e) { console.error('Speech recognition error:', e); };
    recognition.onend = function() { recognition.start(); }; // auto-restart on stop

    recognition.start();
    return () => recognition.stop();
  }, []);
}

// Usage:
// import { useAutoSpeechRecognition } from './useAutoSpeechRecognition';
// In your component: useAutoSpeechRecognition();
