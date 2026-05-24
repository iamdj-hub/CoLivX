const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Firebase UID
    title: { type: String, required: true },
    rent: { type: Number, required: true },
    location: { type: String, required: true },
    locationCoords: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: undefined,
            validate: {
                validator: (coordinates) => !coordinates || coordinates.length === 2,
                message: 'Room coordinates must be [longitude, latitude].'
            }
        }
    },
    description: String,
    amenities: [String],
    rules: {
        smoking: Boolean,
        pets: Boolean,
        dietary: String
    },
    images: [String],
    createdAt: { type: Date, default: Date.now }
});

roomSchema.index({ locationCoords: '2dsphere' });

module.exports = mongoose.model('Room', roomSchema);
