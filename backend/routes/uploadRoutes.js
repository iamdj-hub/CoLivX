const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middleware/uploadMiddleware');
const uploadController = require('../controllers/uploadController');

router.post('/profile/:uid', upload.single('image'), uploadController.uploadProfilePhoto);
router.post('/rooms', upload.array('images', 6), uploadController.uploadRoomPhotos);

router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        const message = error.code === 'LIMIT_FILE_SIZE'
            ? 'Each photo must be 5MB or smaller.'
            : error.message;
        return res.status(400).json({ success: false, message });
    }

    if (error) {
        return res.status(400).json({ success: false, message: error.message });
    }

    return next();
});

module.exports = router;
