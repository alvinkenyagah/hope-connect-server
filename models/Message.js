// models/Message.js
const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/crypto'); 

const MessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String, // Stores the encrypted string
  anonymous: { type: Boolean, default: false },
}, { timestamps: true }); 

// 1. Virtual Getter: Used for HTTP history fetch
MessageSchema.virtual('decryptedText').get(function() {
    if (this.text && this.text.includes(':')) {
        return decrypt(this.text);
    }
    return this.text; 
});

// Ensure virtual fields are included when converting to JSON or Object
MessageSchema.set('toJSON', { virtuals: true });
MessageSchema.set('toObject', { virtuals: true });

// 2. Pre-Save Hook: Encrypts the message before saving
MessageSchema.pre('save', function(next) {
    if (this.isModified('text') && !this.text.includes(':')) {
        this.text = encrypt(this.text);
    }
    next();
});

module.exports = mongoose.model('Message', MessageSchema);