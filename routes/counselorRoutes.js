// routes/counselor.js

const express = require('express');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Message = require('../models/Message');

const router = express.Router();

// Middleware: Restrict routes to authenticated counselors only
router.use(protect, authorize(['counselor']));

/**
 * @desc    Get all victims assigned to the logged-in counselor
 *          Includes the last contact timestamp for each victim.
 * @route   GET /api/counselor/my-victims
 * @access  Private (Counselor)
 */
router.get(
  '/my-victims',
  asyncHandler(async (req, res) => {
    const counselorId = new mongoose.Types.ObjectId(req.user.id);

    const victimsWithLastContact = await User.aggregate([
      // Match victims assigned to this counselor
      {
        $match: {
          assignedCounselor: counselorId,
          role: 'victim',
        },
      },
      // Lookup messages where the victim is the sender
      {
        $lookup: {
          from: Message.collection.name,
          localField: '_id',
          foreignField: 'from',
          as: 'sentMessages',
        },
      },
      // Lookup messages where the victim is the receiver
      {
        $lookup: {
          from: Message.collection.name,
          localField: '_id',
          foreignField: 'to',
          as: 'receivedMessages',
        },
      },
      // Combine messages and filter for those between the victim and counselor
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
      // Determine latest contact timestamp
      {
        $addFields: {
          lastContact: { $max: '$allMessagesWithCounselor.createdAt' },
        },
      },
      // Project final fields
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
      // Sort by last contact (latest first)
      {
        $sort: { lastContact: -1, createdAt: -1 },
      },
    ]);

    res.status(200).json(victimsWithLastContact);
  })
);

module.exports = router;
