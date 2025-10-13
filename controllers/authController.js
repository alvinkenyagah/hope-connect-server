const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });


exports.register = asyncHandler(async (req, res) => {
    const { name, email, password, role, phone, dateOfBirth, gender, agreeTerms } = req.body;

    // --- START: FIX FOR PASSWORD INCONSISTENCY ---
    // Trim the password immediately to handle leading/trailing spaces from client input.
    const trimmedPassword = password ? password.trim() : null;

    // Basic validation check now uses the trimmed password
    if (!name || !email || !trimmedPassword || !role || !phone || !dateOfBirth || !gender) {
        return res.status(400).json({ message: 'Please fill in all required fields.' });
    }
    // --- END: FIX FOR PASSWORD INCONSISTENCY ---

    // Check if email is already used
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already used' });

    // Hash password (using the trimmed password)
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(trimmedPassword, salt);

    // Create new user
    const user = await User.create({
        name,
        email,
        password: hashed,
        role,
        phone,
        dateOfBirth,
        gender,
        agreeTerms,
    });

    res.status(201).json({
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
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
            res.json({
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
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


