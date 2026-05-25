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
    availableFrom: { type: String, default: '' },
    leaseTerm: { type: String, default: '' },
    amenities: [String],
    rules: {
        smoking: Boolean,
        pets: Boolean,
        dietary: String
    },
    renterPreferences: {
        gender: {
            type: String,
            enum: ['any', 'male', 'female', 'other'],
            default: 'any'
        },
        occupation: {
            type: String,
            enum: ['any', 'student', 'working professional', 'looking for job'],
            default: 'any'
        },
        budgetMin: { type: Number, default: 0 },
        budgetMax: { type: Number, default: 0 },
        notes: { type: String, default: '' }
    },
    images: [String],
    allocation: {
        status: {
            type: String,
            enum: ['available', 'allocated', 'booked', 'rented'],
            default: 'available'
        },
        durationValue: { type: Number, default: 0 },
        durationUnit: {
            type: String,
            enum: ['months', 'years'],
            default: 'months'
        },
        allocatedAt: { type: Date }
    },
    createdAt: { type: Date, default: Date.now }
});

roomSchema.index({ locationCoords: '2dsphere' });

module.exports = mongoose.model('Room', roomSchema);
