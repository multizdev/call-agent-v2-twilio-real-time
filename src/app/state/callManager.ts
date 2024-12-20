// @ts-ignore
import { ChatCompletionMessageParam } from 'openai/resources';
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';

export type CallState = {
  callId: string | null;
  audioStreamId: string | null;
  currentCall: VoiceResponse | null;
  websocketConnection: any;
  messages: ChatCompletionMessageParam[];
};

const callStates: { [callId: string]: CallState } = {};

export const createCallState = (callId: string): CallState => {
  const initialState: CallState = {
    callId: null,
    audioStreamId: null,
    currentCall: null,
    websocketConnection: null,
    messages: [],
  };

  callStates[callId] = initialState;

  return initialState;
};

export const getCallState = (callId: string): CallState | undefined =>
  callStates[callId];

export const deleteCallState = (callId: string): void => {
  delete callStates[callId];
};

export const resetCallState = async (callId: string) => {
  const callState = getCallState(callId);

  if (!callState) return;

  try {
    callState.messages = [];
    deleteCallState(callId);
  } catch (error) {
    if (error instanceof Error) {
      console.log(
        `There was a problem resetting state for call ID ${callId}: ${error.message}`,
      );
    }
  }

  deleteCallState(callId);
};
