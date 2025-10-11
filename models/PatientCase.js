const mongoose = require('mongoose');
const PatientCaseSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // victim
  counselor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // assigned counselor
  name: String,
  age: Number,
  addictionType: String,
  selfAssessment: Object, // store questionnaire answers
  status: { type: String, enum: ['active','recovered','dropped'], default: 'active' },
  notes: [{ text: String, by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, date: Date }],
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('PatientCase', PatientCaseSchema);
