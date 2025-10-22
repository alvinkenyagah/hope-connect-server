// server.js (Converted for Socket.IO)

require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io'); // <--- NEW: Import Socket.IO Server
// const WebSocket = require('ws'); // <--- REMOVED 'ws' library
const Message = require('./models/Message');
const User = require('./models/User');

const PORT = process.env.PORT || 4000; 
const MONGO_URI = process.env.MONGO_URI; 

mongoose.connect(MONGO_URI, { 
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');

  // HTTP + Socket.IO setup
  const server = http.createServer(app);
  
  // NEW: Initialize Socket.IO Server and link it to the HTTP server
  const io = new Server(server, {
    cors: { // Configure CORS for the Socket.IO server (adjust origin as needed)
      origin: "https://hope-connect.netlify.app", 
      methods: ["GET", "POST"]
    }
  });

  // REMOVED: The manual 'clients' Map is no longer strictly needed 
  // because Socket.IO handles connections and 'rooms'.

  // Socket.IO connection event
  io.on('connection', (socket) => {
    // 'socket' is the individual client connection instance
    
    console.log('⚡ New user connected (Socket ID:', socket.id + ')');

    // 1. Handle user joining their private room
    // The client should send a 'join' event immediately after connecting.
    socket.on('join', (userId) => {
      // Socket.IO 'rooms' replace the custom 'clients' Map for organization.
      // A 'room' is essentially a channel. We'll use the userId as the room name.
      socket.join(userId); 
      console.log(`User ${userId} joined their private room`);
      // Optional: You could store the userId on the socket object for easier access later
      socket.data.userId = userId; 
    });

    // 2. Handle a message being sent
    // The client should send a 'send_message' event.
    socket.on('send_message', async ({ from, to, text }) => {
      try {
        console.log(`Message from ${from} to ${to}: ${text}`);
        
        // 1. Save message to DB
        // NOTE: Ensure 'from' and 'to' are valid User IDs
        const messageDoc = await Message.create({ from, to, text }); 
        
        // 2. Format the message for the client
        // Populate sender/recipient details if needed for client display
        // Example: messageDoc = await messageDoc.populate('from to', 'name').execPopulate();

        const responsePayload = {
          message: messageDoc
        };

        // 3. Send to 'to' user (Counselor) 
        // io.to(roomName) targets a specific room/client.
        // The recipient is in a room named after their ID.
        io.to(to).emit('receive_message', responsePayload);
        
        // 4. Send to 'from' user (Victim)
        // The sender is also in a room named after their ID.
        // We emit to the room to ensure all tabs/devices for that user get the message.
        io.to(from).emit('receive_message', responsePayload);

        // Alternative: If you only want to send back to the sender
        // socket.emit('receive_message', responsePayload); 

      } catch (e) {
        console.error('Error processing Socket.IO message:', e);
        // Optional: Send an error back to the sender
        socket.emit('message_error', { error: 'Failed to send message.' });
      }
    });

    // 3. Handle disconnection
    socket.on('disconnect', () => {
      const disconnectedUserId = socket.data.userId || 'unknown';
      // Socket.IO automatically cleans up room memberships and connection state.
      console.log('❌ User disconnected:', disconnectedUserId); 
    });
  }); // End io.on('connection')

  server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 
})
.catch(err => {
  console.error('DB connection error:', err);
  process.exit(1); 
});