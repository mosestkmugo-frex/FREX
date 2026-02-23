import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { bookingsRouter } from './routes/bookings.js';
import { paymentsRouter } from './routes/payments.js';
import { trackingRouter } from './routes/tracking.js';
import { ratingsRouter } from './routes/ratings.js';
import { API_PREFIX } from '@frex/shared';

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN ?? '*', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: process.env.CORS_ORIGIN ?? true }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true, service: 'frex-api' }));

app.use(`${API_PREFIX}/auth`, authRouter);
app.use(`${API_PREFIX}/users`, usersRouter);
app.use(`${API_PREFIX}/bookings`, bookingsRouter);
app.use(`${API_PREFIX}/payments`, paymentsRouter);
app.use(`${API_PREFIX}/tracking`, trackingRouter);
app.use(`${API_PREFIX}/ratings`, ratingsRouter);

// Real-time: attach io to req for use in routes
app.set('io', io);
io.on('connection', (socket) => {
  const bookingId = socket.handshake.query?.bookingId as string | undefined;
  if (bookingId) {
    socket.join(`booking:${bookingId}`);
  }
});

const PORT = Number(process.env.PORT) || 4000;
httpServer.listen(PORT, () => {
  console.log(`FREX API listening on http://localhost:${PORT}`);
});
