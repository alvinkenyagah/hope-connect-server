require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
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
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on('connection', (socket) => {
    console.log('⚡ New user connected:', socket.id);

    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their private room`);
    });

    socket.on('send_message', async (data) => {
      const { from, to, text } = data;
      const message = await Message.create({ from, to, text });
      io.to(to).emit('receive_message', message);
      io.to(from).emit('receive_message', message);
    });

    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });
  });

  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch(err => {
  console.error('DB connection error:', err);
  process.exit(1);
});
