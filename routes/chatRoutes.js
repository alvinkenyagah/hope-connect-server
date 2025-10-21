const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Get message history between victim and counselor
router.get('/:userId/:otherId', async (req, res) => {
  try {
    const { userId, otherId } = req.params;
    const messages = await Message.find({
      $or: [
        { from: userId, to: otherId },
        { from: otherId, to: userId }
      ]
    }).populate('from to', 'name role email').sort('createdAt');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching chat history' });
  }
});

module.exports = router;
