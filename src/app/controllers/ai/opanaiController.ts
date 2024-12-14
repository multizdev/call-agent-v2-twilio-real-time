import { openai } from '#app/services/openaiService.js';

// @ts-ignore
import { ChatCompletionMessageParam } from 'openai/resources';

async function getResponseFromOpenai(
  messages: ChatCompletionMessageParam[],
): Promise<string> {
  try {
    const { choices } = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
    });

    return choices[0].message.content || 'Hmm';
  } catch (e) {
    if (e instanceof Error) {
      console.log('Problem getting openai response', e);
      return 'Hmm';
    }
    return 'Hmm';
  }
}

export { getResponseFromOpenai };
