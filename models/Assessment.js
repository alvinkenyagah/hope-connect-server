const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        // Ensures only one assessment per user, per day (useful for daily check-ins)
        // We'll enforce this uniqueness in the controller logic as well.
    },
    dateTaken: {
        type: Date,
        default: Date.now,
        required: true,
    },
    // The total calculated score
    score: {
        type: Number,
        required: true,
        min: 0,
    },
    // Store the detailed answers for deeper analysis by counselors
    answers: [
        {
            questionIndex: {
                type: Number,
                required: true,
            },
            // The score given to that specific answer (e.g., 0 to 4)
            value: {
                type: Number,
                required: true,
            }
        }
    ],
}, { timestamps: true });

// Indexing for faster lookup by user and date
assessmentSchema.index({ user: 1, dateTaken: -1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
