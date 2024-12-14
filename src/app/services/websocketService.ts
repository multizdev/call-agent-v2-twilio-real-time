import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

import { getCallState } from '#app/state/callManager.js';
import { PROMPT } from '#app/utils/promptUtil.js';

function setupWebSocket(server: Server) {
  console.log('Starting websocket server');
  const wss: WebSocketServer = new WebSocketServer({ server });

  wss.on("error", (err) => {
    console.log("There was a problem with websocket server", err.message);
  })

  wss.on('connection', (ws: any, request) => {
    const callId = request.url?.split('/').pop();

    if (!callId) {
      console.error('No call ID found in WebSocket connection URL');
      ws.close();
      return;
    }

    console.log('WebSocket connection established for call ID:', callId);

    const callState = getCallState(callId);

    if (!callState) return;

    callState.websocketConnection = ws;

    // Establish OpenAI WebSocket connection
    const openAiWs: any = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    });

    let streamSid: string | null = null;

    const sendSessionUpdate = () => {
      const sessionUpdate = {
        type: 'session.update',
        session: {
          turn_detection: { type: 'server_vad' },
          input_audio_format: 'g711_ulaw',
          output_audio_format: 'g711_ulaw',
          voice: 'alloy',
          instructions: PROMPT,
          modalities: ["text", "audio"],
          temperature: 0.8,
        }
      };
      console.log('Sending session update:', JSON.stringify(sessionUpdate));
      openAiWs.send(JSON.stringify(sessionUpdate));
    };

    // Handle OpenAI WebSocket connection events
    openAiWs.on('open', () => {
      console.log('Connected to OpenAI Realtime API');
      setTimeout(sendSessionUpdate, 250); // Send session update after connection stabilizes
    });

    openAiWs.on('message', (data:any) => {
      try {
        const response = JSON.parse(data);

        if (response.type === 'response.audio.delta' && response.delta) {
          // Audio response from OpenAI
          const audioDelta = {
            event: 'media',
            streamSid: streamSid,
            media: { payload: Buffer.from(response.delta, 'base64').toString('base64') },
          };

          console.log("CALL STATE", callState);

          const { audioStreamId, websocketConnection } = callState;

          // Send mediaMessage through WebSocket
          if (audioStreamId && websocketConnection.readyState === ws.OPEN) {
            console.log("PLAYING BACK====================================================");

            websocketConnection.send(JSON.stringify(audioDelta));
          }
        } else if (response.type === 'session.updated') {
          console.log('Session updated successfully:', response);
        }
      } catch (error) {
        console.error('Error processing OpenAI message:', error, 'Raw message:', data);
      }
    });

    openAiWs.on('close', () => {
      console.log('Disconnected from OpenAI API');
    });

    openAiWs.on('error', (error: any) => {
      console.error('Error in OpenAI WebSocket:', error);
    });


    ws.on('message', (message: any) => {
      const data = JSON.parse(message);

      switch (data.event) {
        case 'connected':
          console.log('Audio Connected for: ', callId);
          break;
        case 'start':
          console.log('Audio Started for: ', callId);
          callState.audioStreamId = data.start.streamSid;
          break;
        case 'media':
          if (openAiWs.readyState === WebSocket.OPEN) {
            const audioAppend = {
              type: 'input_audio_buffer.append',
              audio: data.media.payload,
            };

            openAiWs.send(JSON.stringify(audioAppend));
          } else {
            console.error('OpenAI WebSocket is not ready. Current state:', openAiWs.readyState);
          }
          /*if (openAiWs.readyState !== openAiWs.OPEN) {
            const audioAppend = {
              type: 'input_audio_buffer.append',
              audio: data.media.payload,
            };

            openAiWs.send(JSON.stringify(audioAppend));
          }*/
          break;
        case 'closed':
          console.log('Closed: ', data);
          openAiWs.close();
          break;
        case 'stop':
          console.log('Closed: ', data);
          openAiWs.close();
          break;
        default:
          console.log("DATA", data);
          console.log('Unknown event type');
      }
    });

    ws.on('error', (error: any) => {
      console.log("ERROR", error);
    });

    ws.on('close', async () => {
      console.log('WebSocket connection closed for call ID:', callId);
      openAiWs.close();
    });
  });
}

export { setupWebSocket };
