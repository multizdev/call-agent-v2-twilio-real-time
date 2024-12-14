import {
  getCallState,
} from '#app/state/callManager.js';
import { getResponseFromOpenai } from '#app/controllers/ai/opanaiController.js';
import { speechFromOpenai } from '#app/controllers/playbackController.js';

export const handleSpeechData = async (callId: string, data: any) => {
  const callState = getCallState(callId);

  if (!callState) return;

  if (data.results[0] && data.results[0].alternatives[0]) {
    const transcription = data.results[0].alternatives[0].transcript;

    console.log('CALL ID: ', callId, 'TRANSCRIPTION: ', transcription);

    if (callState.currentCall) {
      try {
        /*if (callState.ttsPlayback) {
          await callState.ttsPlayback.stop();
          callState.ttsPlayback = null;
        }*/

        if (!data.results[0].isFinal) {
          return;
        }

        callState.messages.push({ role: 'user', content: transcription });

        console.time('AI');

        const completion: string = await getResponseFromOpenai(
          callState.messages,
        );

        // const completion = await getResponseFromGemini(callState.messages);

        console.timeEnd('AI');

        console.log('CALL ID: ', callId, 'COMPLETION: ', completion);

        await speechFromOpenai(completion, callState)

        callState.messages.push({ role: 'assistant', content: completion });
      } catch (error) {
        console.error('Error playing TTS:', error);
      }
    } else {
      console.error('No current call to play TTS');
    }
  }
};

