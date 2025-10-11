const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  type: { type: String, enum: ['monthly','yearly','patient'] },
  data: Object,
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Report', schema);
