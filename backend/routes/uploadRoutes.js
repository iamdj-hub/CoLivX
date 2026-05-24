const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const uploadController = require('../controllers/uploadController');

router.post('/profile/:uid', upload.single('image'), uploadController.uploadProfilePhoto);
router.post('/rooms', upload.array('images', 6), uploadController.uploadRoomPhotos);

module.exports = router;
