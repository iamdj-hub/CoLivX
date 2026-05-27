const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateFirebase, requireSelfParam } = require('../middleware/authMiddleware');

router.get('/conversations/:uid', authenticateFirebase, requireSelfParam('uid'), messageController.getConversations);
router.post('/conversations', authenticateFirebase, messageController.startConversation);
router.get('/conversations/:conversationId/messages', authenticateFirebase, messageController.getMessages);
router.post('/send', authenticateFirebase, messageController.sendMessageRest);

module.exports = router;
