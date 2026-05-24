const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.get('/conversations/:uid', messageController.getConversations);
router.post('/conversations', messageController.startConversation);
router.get('/conversations/:conversationId/messages', messageController.getMessages);
router.post('/send', messageController.sendMessageRest);

module.exports = router;
