const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });


exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, dateOfBirth, gender, agreeTerms } = req.body;

  const trimmedPassword = password ? password.trim() : null;

  if (!name || !email || !trimmedPassword || !role || !phone || !dateOfBirth || !gender) {
    return res.status(400).json({ message: 'Please fill in all required fields.' });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already used' });

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(trimmedPassword, salt);

  let assignedCounselor = null;

  // 🧠 Auto-assign a counselor if the user is a victim
  if (role === 'victim') {
    const availableCounselor = await User.findOne({ role: 'counselor' }).sort({ createdAt: 1 });
    if (availableCounselor) {
      assignedCounselor = availableCounselor._id;
    }
  }

  const user = await User.create({
    name,
    email,
    password: hashed,
    role,
    phone,
    dateOfBirth,
    gender,
    agreeTerms,
    assignedCounselor,
  });

  // Populate counselor data if assigned
  const populatedUser = assignedCounselor
    ? await user.populate('assignedCounselor', 'name email role')
    : user;

  res.status(201).json({
    user: {
      id: populatedUser._id,
      name: populatedUser.name,
      email: populatedUser.email,
      role: populatedUser.role,
      assignedCounselor: populatedUser.assignedCounselor || null,
    },
    token: generateToken(user._id),
  });
});


// Utility logger for debugging login issues
function logLoginDebug(email, stage, extra = null) {
    console.log(`[LOGIN DEBUG] ${stage} for ${email}`);
    if (extra) console.log('Details:', extra);
}

exports.login = asyncHandler(async (req, res) => {
    try {
        const { email, password } = req.body;

        logLoginDebug(email, 'Attempt', { enteredPassword: password });

        // Ensure email is trimmed and lowercased for lookup
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            logLoginDebug(email, 'No user found');
            return res.status(401).json({ message: 'Invalid credentials (user not found)' });
        }

        // Log what’s stored
        logLoginDebug(email, 'User found', { storedHash: user.password });

        try {
            // Trim the incoming password for comparison (This was already correct but is the key fix)
            const isMatch = await bcrypt.compare(password.trim(), user.password); 

            if (!isMatch) {
                logLoginDebug(email, 'Password mismatch', {
                    enteredPasswordLength: password.length,
                    hashPrefix: user.password.substring(0, 15) + '...',
                });
                return res.status(401).json({ message: 'Invalid credentials (password mismatch)' });
            }

                logLoginDebug(email, 'Password match successful');

                // 🧠 If the user is a victim, populate their counselor
                let counselorData = null;
                if (user.role === 'victim' && user.assignedCounselor) {
                const counselor = await User.findById(user.assignedCounselor).select('name email role');
                counselorData = counselor;
                }

                res.json({
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    assignedCounselor: counselorData, // ✅ Include this in response
                },
                token: generateToken(user._id),
                });

        } catch (compareErr) {
            logLoginDebug(email, 'Bcrypt compare error', { error: compareErr.message });
            return res.status(500).json({ message: 'Hash comparison failed' });
        }

    } catch (err) {
        logLoginDebug('GLOBAL', 'Unexpected error', { error: err.message });
        res.status(500).json({ message: 'Server error' });
    }
});


