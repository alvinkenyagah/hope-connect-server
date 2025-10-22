// chat route file (e.g., routes/chat.js)

const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { decrypt } = require('../utils/crypto'); // <-- NEW: Import decrypt

// Get message history between victim and counselor
router.get('/:userId/:otherId', async (req, res) => {
  try {
    const { userId, otherId } = req.params;
    
    // 1. Fetch encrypted messages and populate. Use .lean() without virtuals.
    const messages = await Message.find({
      $or: [
        { from: userId, to: otherId },
        { from: otherId, to: userId }
      ]
    }).populate('from to', 'name role email')
      .sort('createdAt')
      .lean(); // Use .lean() for performance, do NOT use { virtuals: true }

    // 2. CRITICAL FIX: Manually map over the messages and decrypt the text field
    const decryptedMessages = messages.map(msg => {
        let plaintext;

        // The stored text should be "iv:ciphertext". Decrypt it.
        if (msg.text && msg.text.includes(':')) {
            plaintext = decrypt(msg.text);
        } else {
            // Assume it's already plaintext (e.g., old messages) or unencryptable
            plaintext = msg.text;
        }

        // Return the formatted object with the plaintext text
        return {
            ...msg,
            text: plaintext || '--- Decryption Failed: Key Mismatch ---'
        };
    });
    
    res.json(decryptedMessages);
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ message: 'Error fetching chat history' });
  }
});

module.exports = router;