const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  title: String,
  body: String,
  tags: [String],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin
  publishedAt: Date,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Content', schema);
