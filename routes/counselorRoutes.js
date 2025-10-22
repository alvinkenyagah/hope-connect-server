// routes/counselor.js

const express = require('express');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Message = require('../models/Message');

const router = express.Router();

// Middleware: only logged-in counselors can use these routes
router.use(protect, authorize(['counselor']));

/**
 * @desc    Get victims assigned to the logged-in counselor
 *          Includes last contact time and summary counts.
 * @route   GET /api/counselor/my-victims
 * @access  Private (Counselor)
 */
router.get(
  '/my-victims',
  asyncHandler(async (req, res) => {
    const counselorId = new mongoose.Types.ObjectId(req.user.id);

    const victimsWithLastContact = await User.aggregate([
      // 1. Match victims assigned to this counselor
      {
        $match: {
          assignedCounselor: counselorId,
          role: 'victim',
        },
      },
      // 2. Look up messages where the victim is the sender
      {
        $lookup: {
          from: Message.collection.name,
          localField: '_id',
          foreignField: 'from',
          as: 'sentMessages',
        },
      },
      // 3. Look up messages where the victim is the receiver
      {
        $lookup: {
          from: Message.collection.name,
          localField: '_id',
          foreignField: 'to',
          as: 'receivedMessages',
        },
      },
      // 4. Combine all messages and filter those between the victim and counselor
      {
        $addFields: {
          allMessagesWithCounselor: {
            $filter: {
              input: { $concatArrays: ['$sentMessages', '$receivedMessages'] },
              as: 'msg',
              cond: {
                $or: [
                  { $eq: ['$$msg.to', counselorId] },
                  { $eq: ['$$msg.from', counselorId] },
                ],
              },
            },
          },
        },
      },
      // 5. Compute the latest message timestamp
      {
        $addFields: {
          lastContact: { $max: '$allMessagesWithCounselor.createdAt' },
        },
      },
      // 6. Select the fields to return
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          assignedCounselor: 1,
          createdAt: 1,
          lastLogin: 1,
          lastContact: 1,
        },
      },
      // 7. Sort by latest contact and creation date
      {
        $sort: { lastContact: -1, createdAt: -1 },
      },
    ]);

    // Summary statistics
    const totalAssigned = victimsWithLastContact.length;
    const contactedClients = victimsWithLastContact.filter(
      (v) => v.lastContact
    ).length;

    res.status(200).json({
      victims: victimsWithLastContact,
      totalAssigned,
      contactedClients,
    });
  })
);

module.exports = router;
