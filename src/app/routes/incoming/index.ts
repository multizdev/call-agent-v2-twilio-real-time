import { Router, Request, Response } from 'express';

import Twilio from 'twilio';

import { createCallState } from '#app/state/callManager.js';
import { initialMessages } from '#app/utils/promptUtil.js';
const incomingRouter: Router = Router();

incomingRouter.post('/answer-call',(req: Request, res: Response) => {
  const callId = req.body.CallSid;

  console.log("RECEIVED CALL ID", callId);

  try {
    const response = new Twilio.twiml.VoiceResponse();

    const callSpecificWsUri = `${process.env.WS_SERVER_URI}/${callId}`;

    console.log("WS-URI-COMPLETE", callSpecificWsUri);

    const callState = createCallState(callId);

    callState.callId = callId;
    callState.messages = [...initialMessages];
    callState.currentCall = response;

    const connect = response.connect();

    connect.stream({
      url: callSpecificWsUri,
    })

    response.say("I say this after websocket connection ends");

    // Respond with the TwiML (XML format)
    res.type('text/xml');
    res.send(response.toString());
  } catch (e) {
    if (e instanceof Error) {
      console.log('Problem', e.message);
    }

  }
});

export default incomingRouter;
