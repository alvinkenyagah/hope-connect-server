// server.js (Modified for WebSocket)

require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const http = require('http');
// const { Server } = require('socket.io'); // <--- REMOVE Socket.IO import
const WebSocket = require('ws'); // <--- NEW: Import 'ws' library
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

  // HTTP + WebSocket
  const server = http.createServer(app);
  
  // NEW: Initialize WebSocket Server and link it to the HTTP server
  const wss = new WebSocket.Server({ server });

  // Map to store connected clients, using userId as the key
  const clients = new Map(); 

  wss.on('connection', (ws, req) => {
    // ⚠️ IMPORTANT: In a real app, you must authenticate and extract the userId from the 'req'
    // (e.g., from query parameters or session/cookie data in the handshake) here.
    // For simplicity, we'll assume a 'join' message is sent immediately.

    console.log('⚡ New user connected');

    // WebSocket event listener for incoming messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Custom message types to replace Socket.IO events:
        if (data.type === 'join') {
          const userId = data.userId;
          clients.set(userId, ws); // Store the WebSocket connection
          console.log(`User ${userId} joined their private room`);
        } 
        
        else if (data.type === 'send_message') {
          const { from, to, text } = data; 
          
          // 1. Save message to DB
          const messageDoc = await Message.create({ from, to, text }); 
          
          // 2. Format the message for the client (optional but good practice)
          // You might need to populate 'from' and 'to' fields manually if required
          // for the client side display, similar to the chat history route.
          
          const responsePayload = JSON.stringify({
            type: 'receive_message',
            message: messageDoc
          });

          // 3. Send to 'to' user (Counselor)
          const recipientWs = clients.get(to);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            recipientWs.send(responsePayload);
          }
          
          // 4. Send to 'from' user (Victim)
          const senderWs = clients.get(from);
          if (senderWs && senderWs.readyState === WebSocket.OPEN) {
            senderWs.send(responsePayload);
          }
        }
      } catch (e) {
        console.error('Error processing WebSocket message:', e);
      }
    });

    ws.on('close', () => {
      // Remove client from the map when they disconnect
      let disconnectedUserId;
      for (let [userId, clientWs] of clients.entries()) {
        if (clientWs === ws) {
          disconnectedUserId = userId;
          clients.delete(userId);
          break;
        }
      }
      console.log('❌ User disconnected:', disconnectedUserId || 'unknown'); 
    });
  });

  server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 
})
.catch(err => {
  console.error('DB connection error:', err);
  process.exit(1); 
});