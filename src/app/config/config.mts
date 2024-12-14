import dotenv from 'dotenv';

import { google } from '@google-cloud/speech/build/protos/protos';

dotenv.config();

const WS_SERVER_URI = process.env.WS_SERVER_URI || '';
const PORT = process.env.PORT || 3000;

const SPEECH_REQUEST: google.cloud.speech.v1.IStreamingRecognitionConfig = {
  config: {
    encoding: 'MULAW',
    sampleRateHertz: 8000,
    languageCode: 'en-US',
    alternativeLanguageCodes: ['ur-PK'],
  },
  interimResults: false,
};

const getPort = function (): number {
  return Number(process.env.PORT) || 3000;
};

const getApiUrl = function (): string {
  const host = process.env.API_HOST || 'localhost';
  return `http://${host}:${getPort()}`;
};

export { getApiUrl, getPort, WS_SERVER_URI, PORT, SPEECH_REQUEST };
