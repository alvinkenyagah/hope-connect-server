const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the user schema
const userSchema = new mongoose.Schema({
    // Common fields
    name: {
        type: String,
        // Now unconditionally required
        required: [true, 'Name is required'],
        trim: true,
    },

    email: {
        type: String,
        // Now unconditionally required
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
        // Making it required for all signups (since there's no anonymous option)
        required: [true, 'Date of Birth is required'],
    },



    // Aligned with signupForm.gender
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
        // Making it required for all signups
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

// **Password hashing and methods remain the same**

/**
 * Password hashing before saving
 */
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

/**
 * Compare passwords
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Hide sensitive data when sending user info
 */
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model('User', userSchema);