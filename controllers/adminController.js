
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
    const users = await User.find({})
        .select('-password')
        .populate('assignedCounselor', 'name email specialization') // 👈 new line
        .sort({ createdAt: -1 });

    res.status(200).json(users);
});



/**
 * @desc    Admin assigns a counselor to a victim
 * @route   POST /api/admin/assign-counselor
 * @access  Private (Admin only)
 */
exports.assignCounselor = asyncHandler(async (req, res) => {
    const { victimId, counselorId } = req.body;

    if (!victimId || !counselorId) {
        return res.status(400).json({ message: 'Both victimId and counselorId are required.' });
    }

    // Fetch both users
    const victim = await User.findById(victimId);
    const counselor = await User.findById(counselorId);

    if (!victim || victim.role !== 'victim') {
        return res.status(404).json({ message: 'Victim not found or invalid role.' });
    }

    if (!counselor || counselor.role !== 'counselor') {
        return res.status(404).json({ message: 'Counselor not found or invalid role.' });
    }

    // Assign the counselor to victim
    victim.assignedCounselor = counselor._id;
    await victim.save();

    // Return updated info
    res.status(200).json({
        message: `Counselor ${counselor.name} has been assigned to victim ${victim.name}.`,
        victim: {
            id: victim._id,
            name: victim.name,
            email: victim.email,
            assignedCounselor: counselor.name
        }
    });
});
