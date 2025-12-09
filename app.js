const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const counselorRoutes = require('./routes/counselorRoutes');


const notesRoutes = require('./routes/notesRoutes');

const appointmentRoutes = require('./routes/appointmentRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
// const counselorRoutes = require('./routes/counselorRoutes');
// const victimRoutes = require('./routes/victimRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes.js');
const app = express();
app.use(cors());
app.use(express.json());







// routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/counselor', counselorRoutes);

app.use('/api/appointments', appointmentRoutes);
app.use('/api/assignments', assignmentRoutes);

app.use('/api/chat', chatRoutes);
// app.use('/api/counselor', counselorRoutes);
// app.use('/api/victim', victimRoutes);

app.use('/api/assessments', assessmentRoutes); 



app.use('/api/notes', notesRoutes);



app.get('/', (req, res) => res.send('Recovery Platform API'));

module.exports = app;
