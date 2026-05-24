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
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
};
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});
const marketplaceController = require('./controllers/marketplaceController');
const messageService = require('./services/messageService');

// --- MIDDLEWARE ---
app.use(cors(corsOptions)); // Allows your React frontend to talk to this backend
app.use(express.json()); // Allows the server to read incoming JSON data

// Marketplace Routes
app.post('/api/rooms', marketplaceController.postRoom);
app.get('/api/rooms', marketplaceController.getAllRooms);
app.post('/api/reviews', marketplaceController.submitReview);

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
io.on('connection', (socket) => {
    socket.on('join', (uid) => {
        if (uid) {
            socket.join(`user:${uid}`);
        }
    });

    socket.on('send_message', async (payload, ack) => {
        try {
            const result = await messageService.sendMessage(payload);
            const responseForSender = {
                message: result.message,
                conversation: result.senderConversation
            };
            const responseForReceiver = {
                message: result.message,
                conversation: result.receiverConversation
            };

            io.to(`user:${payload.senderId}`).emit('message_received', responseForSender);
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
