// @ts-ignore
import { ChatCompletionMessageParam } from 'openai/resources';

import {
  GenerateContentResult,
  HarmBlockThreshold,
  HarmCategory,
  VertexAI,
} from '@google-cloud/vertexai';

import { PROMPT } from '#app/utils/promptUtil.js';

const project = 'multi-431915';
const location = 'us-west1';
const modelId = 'gemini-1.5-pro';

// Construct the full model path
const vertexAI = new VertexAI({ project: project, location: location });

const generativeModel = vertexAI.getGenerativeModel({
  model: modelId,
  // The following parameters are optional
  // They can also be passed to individual content generation requests
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
  generationConfig: { maxOutputTokens: 256 },
  systemInstruction: {
    role: 'system',
    parts: [{ text: PROMPT }],
  },
});

async function getResponseFromGemini(
  messages: ChatCompletionMessageParam[],
): Promise<string> {
  const chat = generativeModel.startChat();

  const chatInput = messages[messages.length - 1].content;
  const result: GenerateContentResult = await chat.sendMessage(chatInput);

  if (result.response.candidates)
    return result.response?.candidates[0].content.parts[0].text || '';
  else return 'Hmm';
}

export { getResponseFromGemini };
