
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * @desc    Admin adds a new counsellor/user
 * @route   POST /api/admin/counsellor
 * @access  Private (Admin only)
 */
exports.addCounsellor = asyncHandler(async (req, res) => {
    const { name, email, password, specialization, qualifications } = req.body;
    
    // Default the role to 'counselor'
    const role = 'counselor';

    // Basic Validation
    if (!name || !email || !password || !specialization) {
        return res.status(400).json({ message: 'Please include name, email, password, and specialization.' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in the database
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role, // Set the role to 'counselor'
        specialization,
        qualifications,
        // Since the User model requires dateOfBirth, gender, and phone for 'victim', 
        // we set dummy values here to satisfy the schema validation for non-victim roles.
        dateOfBirth: new Date(), 
        gender: 'Other', 
        phone: 'N/A' 
    });

    if (user) {
        // Return success message and new user details (without password)
        res.status(201).json({
            message: 'Counsellor added successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                specialization: user.specialization,
            }
        });
    } else {
        res.status(400).json({ message: 'Invalid counsellor data' });
    }
});

/**
 * @desc    Admin gets a list of all users
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
    // Select all users, but exclude the password field
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    res.status(200).json(users);
});