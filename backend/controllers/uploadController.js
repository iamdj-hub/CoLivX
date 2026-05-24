const User = require('../models/User');
const { uploadImageBuffer } = require('../services/cloudinaryService');

exports.uploadProfilePhoto = async (req, res) => {
    try {
        const { uid } = req.params;
        const { email, displayName } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Profile photo is required.' });
        }

        const existingUser = await User.findById(uid);
        const safeEmail = email || existingUser?.email;
        if (!safeEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email is required to create a profile before uploading a photo.'
            });
        }

        const uploaded = await uploadImageBuffer(req.file, `colivx/profiles/${uid}`);
        const updatedUser = await User.findByIdAndUpdate(
            uid,
            {
                email: safeEmail,
                displayName: displayName || existingUser?.displayName || safeEmail.split('@')[0],
                profileImage: uploaded.url,
                accountStatus: 'active'
            },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            success: true,
            profileImage: uploaded.url,
            upload: uploaded,
            user: updatedUser
        });
    } catch (error) {
        console.error('Profile photo upload error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.uploadRoomPhotos = async (req, res) => {
    try {
        if (!req.files?.length) {
            return res.status(400).json({ success: false, message: 'At least one room photo is required.' });
        }

        const uploads = await Promise.all(
            req.files.map((file) => uploadImageBuffer(file, 'colivx/rooms'))
        );

        res.status(200).json({
            success: true,
            images: uploads.map((upload) => upload.url),
            uploads
        });
    } catch (error) {
        console.error('Room photo upload error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
