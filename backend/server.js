const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config(); // Loads our secret variables from .env

// Initialize the Express app
const app = express();
const parseOrigins = (value = '') => value
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.FRONTEND_URLS),
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin || allowedOrigins.includes(origin)) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true
};
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});
const marketplaceController = require('./controllers/marketplaceController');
const messageService = require('./services/messageService');
const { authenticateFirebase } = require('./middleware/authMiddleware');
const { getFirebaseAuth } = require('./config/firebaseAdmin');

// --- MIDDLEWARE ---
app.use(cors(corsOptions)); // Allows your React frontend to talk to this backend
app.use(express.json()); // Allows the server to read incoming JSON data

// Marketplace Routes
app.post('/api/rooms', authenticateFirebase, marketplaceController.postRoom);
app.get('/api/rooms', marketplaceController.getAllRooms);
app.put('/api/rooms/:roomId', authenticateFirebase, marketplaceController.updateRoom);
app.post('/api/reviews', authenticateFirebase, marketplaceController.submitReview);

// ---- ROUTES -----
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));

// --- TEST ROUTE ---
app.get('/', (req, res) => {
    res.send('CoLivX API is live and running!');
});

app.get('/api/health', (req, res) => {
    const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const database = dbStates[mongoose.connection.readyState] || 'unknown';
    const isDatabaseConnected = mongoose.connection.readyState === 1;

    res.status(isDatabaseConnected ? 200 : 503).json({
        success: isDatabaseConnected,
        service: 'CoLivX API',
        status: isDatabaseConnected ? 'ok' : 'database_unavailable',
        database
    });
});

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Successfully connected to MongoDB!'))
  .catch((error) => console.log('❌ MongoDB connection error:', error));

// --- REAL-TIME MESSAGING ---
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication token is required.'));
        }

        const decodedToken = await getFirebaseAuth().verifyIdToken(token);
        if (!decodedToken?.uid) {
            return next(new Error('Invalid authentication token.'));
        }

        socket.user = {
            uid: decodedToken.uid,
            email: decodedToken.email
        };

        return next();
    } catch (error) {
        return next(new Error('Authentication token is invalid or expired.'));
    }
});

io.on('connection', (socket) => {
    socket.join(`user:${socket.user.uid}`);

    socket.on('join', (uid) => {
        if (uid && uid === socket.user.uid) {
            socket.join(`user:${uid}`);
        }
    });

    socket.on('send_message', async (payload, ack) => {
        try {
            const result = await messageService.sendMessage({
                ...payload,
                senderId: socket.user.uid
            });
            const responseForSender = {
                message: result.message,
                conversation: result.senderConversation
            };
            const responseForReceiver = {
                message: result.message,
                conversation: result.receiverConversation
            };

            io.to(`user:${socket.user.uid}`).emit('message_received', responseForSender);
            io.to(`user:${payload.receiverId}`).emit('message_received', responseForReceiver);

            if (typeof ack === 'function') {
                ack({ success: true, ...responseForSender });
            }
        } catch (error) {
            if (typeof ack === 'function') {
                ack({ success: false, message: error.message });
            }
        }
    });
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server successfully started on port ${PORT}`);
});
