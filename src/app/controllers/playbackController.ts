import ffmpeg from 'fluent-ffmpeg';

import { TextToSpeechClient } from '@google-cloud/text-to-speech';

import { CallState } from '#app/state/callManager.js';
import { openai } from '#app/services/openaiService.js';

async function speechFromGoogle(text: string, callState: CallState) {
  const ttsClient = new TextToSpeechClient();

  const [{audioContent}] = await ttsClient.synthesizeSpeech({
    audioConfig: {
      audioEncoding: 'MULAW',
      sampleRateHertz: 8000, speakingRate: undefined
    },
    input: { text: text },
    voice: {
      languageCode: 'en-US', ssmlGender: 'NEUTRAL'
    },
  });

  const { audioStreamId: streamSid, websocketConnection: ws } = callState;

  if (audioContent) {
    // Check if audioContent is a Buffer, if not, convert it
    let base64Audio;
    if (Buffer.isBuffer(audioContent)) {
      base64Audio = audioContent.toString('base64');
    } else {
      base64Audio = Buffer.from(audioContent).toString('base64');
    }

    const mediaMessage = {
      event: 'media',
      streamSid, // replace with actual streamSid
      media: {
        payload: base64Audio,
      },
    };

    // Send mediaMessage through WebSocket
    if (streamSid && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(mediaMessage));
    }
  }
}

async function speechFromOpenai(text: string, callState: CallState): Promise<void> {
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: text, response_format: 'wav'
  });

  const ffmpegCommand = ffmpeg()
    .input(response.body as any)  // Input raw PCM stream from OpenAI
    .inputFormat('wav')   // Raw PCM format (16-bit signed, little-endian)
    .audioChannels(1)       // Mono channel (if stereo, change to 2)
    .audioCodec('pcm_mulaw')  // Convert to mulaw format (8-bit, 8000Hz, mono)
    .audioFrequency(8000)   // Resample to 8000Hz
    .format('mulaw')         // Set the output format to mulaw (8-bit, 8000Hz)
    .on('error', (err) => {
      console.error('Error during FFmpeg conversion:', err);
    });


  const { audioStreamId: streamSid, websocketConnection: ws } = callState;

  ffmpegCommand.pipe().on('data', (chunk) => {
    const base64Audio = chunk.toString('base64');

    const mediaMessage = {
      event: 'media',
      streamSid, // replace with actual streamSid
      media: {
        payload: base64Audio,
      },
    };

    // Send mediaMessage through WebSocket
    if (streamSid && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(mediaMessage));
    }
  });
}

export { speechFromOpenai, speechFromGoogle };
