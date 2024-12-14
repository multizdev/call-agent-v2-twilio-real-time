import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer, Server } from 'http';

import { PORT } from '#app/config/config.mjs';
import { setupWebSocket } from '#app/services/websocketService.js';
import incomingRouter from '#app/routes/incoming/index.js';

const app = express();

dotenv.config();

app.set('port', PORT);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));
app.use('/api/incoming', incomingRouter);

const server: Server = createServer(app);

server.listen(PORT, async () => {
  console.log(`Server is listening on port ${PORT}`);

  console.log(`RingAssist - Voice Client Active`);
});

setupWebSocket(server);

export { app };
