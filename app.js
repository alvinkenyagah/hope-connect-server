const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes'); // <-- UNCOMMENTED/ADDED
// const counselorRoutes = require('./routes/counselorRoutes');
// const victimRoutes = require('./routes/victimRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes.js');
const app = express();
app.use(cors());
app.use(express.json());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); // <-- ADDED
// app.use('/api/counselor', counselorRoutes);
// app.use('/api/victim', victimRoutes);

app.use('/api/assessments', assessmentRoutes); 

app.get('/', (req, res) => res.send('Recovery Platform API'));

module.exports = app;
