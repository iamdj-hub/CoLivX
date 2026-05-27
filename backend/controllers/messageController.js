const {
    getOrCreateConversation,
    listConversationsForUser,
    listMessagesForConversation,
    sendMessage
} = require('../services/messageService');

exports.getConversations = async (req, res) => {
    try {
        const conversations = await listConversationsForUser(req.user.uid);
        res.status(200).json({ success: true, conversations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.startConversation = async (req, res) => {
    try {
        const currentUserId = req.user.uid;
        const { recipientId } = req.body;
        const conversation = await getOrCreateConversation(currentUserId, recipientId);
        const conversations = await listConversationsForUser(currentUserId);
        const enrichedConversation = conversations.find((item) => String(item._id) === String(conversation._id));

        res.status(200).json({ success: true, conversation: enrichedConversation });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const messages = await listMessagesForConversation(req.params.conversationId, req.user.uid);
        res.status(200).json({ success: true, messages });
    } catch (error) {
        res.status(403).json({ success: false, message: error.message });
    }
};

exports.sendMessageRest = async (req, res) => {
    try {
        const result = await sendMessage({
            ...req.body,
            senderId: req.user.uid
        });
        res.status(201).json({
            success: true,
            message: result.message,
            conversation: result.senderConversation
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
