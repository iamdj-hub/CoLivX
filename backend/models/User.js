const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // We override the default ID to strictly match the Firebase user ID!
    _id: { type: String, required: true }, 
    email: { type: String, required: true, unique: true },
    displayName: { type: String },
    age: { type: Number },
    profileImage: { type: String }, // We will store the cloud image URL here
    accountStatus: { type: String, default: 'setting_up' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);