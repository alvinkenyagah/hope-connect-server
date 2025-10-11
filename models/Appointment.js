const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  counselor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  time: { type: Date, required: true },
  mode: { type: String, enum: ['online','in-person'], default: 'online' },
  status: { type: String, enum: ['scheduled','completed','cancelled'], default: 'scheduled' },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Appointment', schema);
