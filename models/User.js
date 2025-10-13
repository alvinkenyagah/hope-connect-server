const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the user schema
const userSchema = new mongoose.Schema({
    // Common fields
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },

    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },

    phone: {
        type: String,
        // Required only if the user role is 'victim'.
        required: function() { 
            return this.role === 'victim'; 
        },
    },
    
    // Aligned with signupForm.dateOfBirth
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of Birth is required'],
    },

    // Aligned with signupForm.gender
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
        required: [true, 'Gender is required'],
    },

    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
    },

    // Alignment with signupForm.agreeTerms
    agreeTerms: {
        type: Boolean,
        required: [true, 'Must agree to terms and conditions'],
        default: false,
    },

    role: {
        type: String,
        enum: ['admin', 'counselor', 'victim'],
        required: [true, 'Role is required'], 
        default: 'victim',
    },

    // Counselor-specific fields
    qualifications: {
        type: String,
        default: '',
    },
    bio: {
        type: String,
        maxlength: 500,
    },
    specialization: {
        type: String,
    },

    // Victim-specific fields
    location: {
        type: String,
    },
    recoveryScore: {
        type: Number,
        default: 0,
    },

    // Admin-related / general control
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },

}, { timestamps: true });


/**
 * 🛑 CRITICAL CHANGE: REMOVED THE userSchema.pre('save') HOOK! 🛑
 * * Reason: The password is now hashed in the authController.js file 
 * before calling User.create(). Removing this hook prevents double-hashing, 
 * which was the likely cause of the "password mismatch" error.
 */


/**
 * Compare passwords - This logic remains correct.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Hide sensitive data when sending user info - This logic remains correct.
 */
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model('User', userSchema);