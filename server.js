// server.js 

require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io'); 
const Message = require('./models/Message');
const User = require('./models/User'); 
const { decrypt } = require('./utils/crypto'); 

const PORT = process.env.PORT || 4000; 
const MONGO_URI = process.env.MONGO_URI; 

// CRITICAL FIX 1: Use a deployed origin environment variable for CORS
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "https://hope-connect.netlify.app"; 

mongoose.connect(MONGO_URI, { 
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');

  // CRITICAL FIX 2: HTTP server listens on PORT for the deployed environment
  const server = http.createServer(app);
  
  const io = new Server(server, {
    cors: { 
      // Use the client origin. Use .split(',') to allow multiple origins if needed.
      origin: CLIENT_ORIGIN.split(','), 
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO handlers (Logic remains the same, ensuring decrypted, targeted broadcast)
  io.on('connection', (socket) => {
    
    console.log('⚡ New user connected (Socket ID:', socket.id + ')');

    socket.on('join', (userId) => {
      socket.join(userId); 
      console.log(`User ${userId} joined their private room`);
      socket.data.userId = userId; 
    });

    socket.on('send_message', async (payload) => {
      const { from, to, text } = payload;
      
      try {
        const messageDoc = await Message.create({ from, to, text }); 
        
        const populatedMessage = await Message.findById(messageDoc._id)
            .populate('from to', 'name role email')
            .lean(); 

        const plaintext = decrypt(populatedMessage.text);

        let decryptedMessage;
        if (populatedMessage) {
            decryptedMessage = {
                ...populatedMessage,
                text: plaintext, 
            };
        } else {
            return;
        }

        const responsePayload = {
          message: decryptedMessage 
        };

        // Send to RECIPIENT
        io.to(to).emit('receive_message', responsePayload);
        
        // Send to SENDER's OTHER DEVICES ONLY
        socket.broadcast.to(from).emit('receive_message', responsePayload);

      } catch (e) {
        console.error('Error processing Socket.IO message:', e);
        socket.emit('message_error', { error: 'Failed to send message.' });
      }
    });

    socket.on('disconnect', () => {
      const disconnectedUserId = socket.data.userId || 'unknown';
      console.log('❌ User disconnected:', disconnectedUserId); 
    });
  }); 

  server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 
})
.catch(err => {
  console.error('DB connection error:', err);
  process.exit(1); 
});