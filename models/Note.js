const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    counselor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    victim: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
        maxlength: 1000,
    },
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
