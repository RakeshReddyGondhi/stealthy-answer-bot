export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private silenceTimeout: number | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private isRecording = false;
  private onSpeechDetected: (() => void) | null = null;
  private onSilenceDetected: ((audioBlob: Blob) => void) | null = null;
  
  private readonly SILENCE_THRESHOLD = 12; // lowered threshold for better sensitivity
  private readonly SILENCE_DURATION = 800; // 0.8 seconds of silence

  async initialize(
    onSpeechDetected: () => void,
    onSilenceDetected: (audioBlob: Blob) => void
  ) {
    this.onSpeechDetected = onSpeechDetected;
    this.onSilenceDetected = onSilenceDetected;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Set up audio analysis for voice activity detection
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      source.connect(this.analyser);
      
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Set up media recorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm',
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        if (this.onSilenceDetected && audioBlob.size > 0) {
          this.onSilenceDetected(audioBlob);
        }
      };

      // Start continuous monitoring
      this.startVoiceActivityDetection();

      return true;
    } catch (error) {
      console.error('Error initializing voice recorder:', error);
      throw error;
    }
  }

  private startVoiceActivityDetection() {
    const checkAudioLevel = () => {
      if (!this.analyser || !this.dataArray) return;

      // Use time domain data to compute RMS which is more reliable for VAD
      const timeData = new Uint8Array(this.analyser.fftSize);
      this.analyser.getByteTimeDomainData(timeData);

      // compute RMS
      let sumSq = 0;
      for (let i = 0; i < timeData.length; i++) {
        const v = (timeData[i] - 128) / 128; // normalize to -1..1
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / timeData.length) * 100; // scale to easier threshold

      if (rms > this.SILENCE_THRESHOLD) {
        // Speech detected
        if (!this.isRecording) {
          this.startRecording();
        }
        
        // Reset silence timeout
        if (this.silenceTimeout) {
          clearTimeout(this.silenceTimeout);
        }
        
        this.silenceTimeout = window.setTimeout(() => {
          if (this.isRecording) {
            this.stopRecording();
          }
        }, this.SILENCE_DURATION);
      }

      requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  }

  private startRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      this.audioChunks = [];
      this.mediaRecorder.start();
      this.isRecording = true;
      if (this.onSpeechDetected) {
        this.onSpeechDetected();
      }
      console.log('Recording started');
    }
  }

  private stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.isRecording = false;
      console.log('Recording stopped');
    }
  }

  stop() {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
    }
    
    if (this.isRecording) {
      this.stopRecording();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.dataArray = null;
  }

  getRecordingState(): boolean {
    return this.isRecording;
  }
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
