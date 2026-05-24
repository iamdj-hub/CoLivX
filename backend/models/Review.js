const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    reviewerId: { type: String, required: true }, // Who wrote it
    targetId: { type: String, required: true },   // Who/What is being reviewed
    targetType: { type: String, enum: ['user', 'room'], required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
    text: String
}, { timestamps: true });

reviewSchema.index({ targetId: 1, targetType: 1, createdAt: -1 });
reviewSchema.index({ reviewerId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
