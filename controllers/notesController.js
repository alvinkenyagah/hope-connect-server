const Note = require('../models/Note');
const User = require('../models/User');

// Create a note
exports.createNote = async (req, res) => {
    try {
        const { victimId, content } = req.body;
        const counselorId = req.user._id;

        // Ensure counselor is assigned to the victim
        const victim = await User.findById(victimId);
        if (!victim || victim.assignedCounselor?.toString() !== counselorId.toString()) {
            return res.status(403).json({ message: 'Not authorized to add notes for this victim' });
        }

        const note = await Note.create({ counselor: counselorId, victim: victimId, content });
        res.status(201).json(note);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all notes for a victim
exports.getVictimNotes = async (req, res) => {
    try {
        const victimId = req.params.victimId;
        const notes = await Note.find({ victim: victimId })
            .populate('counselor', 'name email');
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update a note (only by creator)
exports.updateNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ message: 'Note not found' });
        if (note.counselor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        note.content = req.body.content || note.content;
        await note.save();

        res.json(note);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete a note (only by creator)
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    // Only the counselor who created the note can delete it
    if (note.counselor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Use deleteOne on the model instead of note.remove()
    await Note.deleteOne({ _id: note._id });

    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
