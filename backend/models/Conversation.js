const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: {
        type: [String],
        required: true,
        validate: {
            validator: (participants) => participants.length === 2,
            message: 'A conversation must have exactly two participants.'
        }
    },
    participantsKey: { type: String, required: true, unique: true },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

conversationSchema.index({ participants: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
