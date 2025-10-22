// server.js 

require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io'); 
const Message = require('./models/Message');
const User = require('./models/User'); 
const { decrypt } = require('./utils/crypto'); // <-- NEW: Import decrypt function

const PORT = process.env.PORT || 4000; 
const MONGO_URI = process.env.MONGO_URI; 

mongoose.connect(MONGO_URI, { 
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');

  const server = http.createServer(app);
  
  const io = new Server(server, {
    cors: { 
      origin: "https://hope-connect.netlify.app", 
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO connection event
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
        console.log(`Message from ${from} to ${to}: ${text}`);
        
        // 1. Save message (Encryption happens here)
        const messageDoc = await Message.create({ from, to, text }); 
        
        // 2. Fetch the saved document. No virtuals needed as we decrypt manually.
        const populatedMessage = await Message.findById(messageDoc._id)
            .populate('from to', 'name role email')
            .lean(); 

        // 3. CRITICAL FIX: Explicitly decrypt the stored message text
        const plaintext = decrypt(populatedMessage.text);

        // 4. Format the message payload
        let decryptedMessage;
        if (populatedMessage) {
            decryptedMessage = {
                ...populatedMessage,
                // Overwrite the encrypted 'text' with the plaintext
                text: plaintext, 
            };
        } else {
            return;
        }

        const responsePayload = {
          message: decryptedMessage // The plaintext object
        };

        // 5. BROADCAST FIX: 
        
        // A. Send to the RECIPIENT
        io.to(to).emit('receive_message', responsePayload);
        
        // B. Send to SENDER's OTHER DEVICES ONLY (Prevents echo overwrite)
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