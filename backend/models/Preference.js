const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'User' },
    
    // Strict Enums for accurate vector mapping
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer not to say'], required: true },
    genderPreference: { type: String, enum: ['male', 'female', 'other', 'any'], default: 'any' },
    dietary: { type: String, enum: ['veg', 'non-veg', 'vegan', 'any'], default: 'any' },
    
    // Standard Strings
    occupation: String,
    city: String,
    locationCoords: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: undefined
        }
    },
    
    // Ranges
    budget: { 
        min: { type: Number, default: 0 }, 
        max: { type: Number, default: 0 } 
    },
    cleanliness: { type: Number, min: 1, max: 10, default: 5 },
    sleepSchedule: { type: Number, min: 0, max: 23, default: 22 },
    
    // Booleans
    smoking: { type: Boolean, default: false },
    pets: { type: Boolean, default: false },
    
    // Arrays & Text
    bio: { type: String, default: '' },
    hobbies: { type: [String], default: [] },
    dealbreakers: { type: [String], default: [] },
    nlpKeywords: {
        type: [{
            stem: String,
            label: String,
            score: Number
        }],
        default: []
    },
    keywordLabels: { type: [String], default: [] },

    // THE MATCHING ENGINE CACHE: Stores the numerical vector
    matchVector: { type: [Number], default: [] }

}, { timestamps: true });

preferenceSchema.index({ locationCoords: '2dsphere' });

module.exports = mongoose.model('Preference', preferenceSchema);
