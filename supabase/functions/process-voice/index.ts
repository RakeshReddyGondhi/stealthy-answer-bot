import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Processing audio...');

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Step 1: Transcribe audio
    console.log('Transcribing audio...');
    const binaryAudio = processBase64Chunks(audio);
    
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('Transcription error:', errorText);
      throw new Error(`Transcription failed: ${errorText}`);
    }

    const transcriptionData = await transcriptionResponse.json();
    const transcription = transcriptionData.text;
    console.log('Transcription:', transcription);

    // Step 2: Get AI response
    console.log('Getting AI response...');
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Provide concise, clear answers to questions. Keep responses brief but informative, typically 2-3 sentences unless more detail is needed.'
          },
          {
            role: 'user',
            content: transcription
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('Chat API error:', errorText);
      throw new Error(`Chat API failed: ${errorText}`);
    }

    const chatData = await chatResponse.json();
    const response = chatData.choices[0].message.content;
    console.log('AI Response:', response);

    // Step 3: Convert response to speech
    console.log('Converting response to speech...');
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'alloy',
        input: response,
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('TTS error:', errorText);
      throw new Error(`TTS failed: ${errorText}`);
    }

    const audioArrayBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioArrayBuffer)));

    return new Response(
      JSON.stringify({ 
        transcription,
        response,
        audioResponse: audioBase64
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Process voice error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
