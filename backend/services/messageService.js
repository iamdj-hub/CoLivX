const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

const buildParticipantsKey = (userA, userB) => [userA, userB].sort().join(':');

const ensureUsersExist = async (senderId, receiverId) => {
    const [sender, receiver] = await Promise.all([
        User.findById(senderId),
        User.findById(receiverId)
    ]);

    if (!sender) {
        throw new Error('Sender profile not found.');
    }

    if (!receiver) {
        throw new Error('Receiver profile not found.');
    }
};

const getOrCreateConversation = async (userA, userB) => {
    if (!userA || !userB) {
        throw new Error('Both users are required to create a conversation.');
    }

    if (userA === userB) {
        throw new Error('You cannot message yourself.');
    }

    await ensureUsersExist(userA, userB);

    const participantsKey = buildParticipantsKey(userA, userB);

    return Conversation.findOneAndUpdate(
        { participantsKey },
        {
            $setOnInsert: {
                participants: [userA, userB],
                participantsKey
            }
        },
        { upsert: true, new: true, runValidators: true }
    );
};

const enrichConversation = async (conversation, currentUserId) => {
    const otherUserId = conversation.participants.find((participant) => participant !== currentUserId);
    const otherUser = otherUserId ? await User.findById(otherUserId) : null;

    return {
        ...conversation._doc,
        otherUser: otherUser ? {
            id: otherUser._id,
            displayName: otherUser.displayName,
            email: otherUser.email,
            age: otherUser.age,
            profileImage: otherUser.profileImage
        } : {
            id: otherUserId,
            displayName: 'CoLivX User'
        }
    };
};

const listConversationsForUser = async (uid) => {
    const conversations = await Conversation.find({ participants: uid }).sort({ lastMessageAt: -1 });
    return Promise.all(conversations.map((conversation) => enrichConversation(conversation, uid)));
};

const listMessagesForConversation = async (conversationId, uid) => {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        throw new Error('Conversation not found.');
    }

    if (!conversation.participants.includes(uid)) {
        throw new Error('You do not have access to this conversation.');
    }

    return Message.find({ conversationId }).sort({ createdAt: 1 });
};

const sendMessage = async ({ senderId, receiverId, text }) => {
    const cleanText = String(text || '').trim();

    if (!cleanText) {
        throw new Error('Message text is required.');
    }

    const conversation = await getOrCreateConversation(senderId, receiverId);

    const message = await Message.create({
        conversationId: conversation._id,
        senderId,
        receiverId,
        text: cleanText
    });

    conversation.lastMessage = cleanText;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const [senderConversation, receiverConversation] = await Promise.all([
        enrichConversation(conversation, senderId),
        enrichConversation(conversation, receiverId)
    ]);

    return {
        message,
        conversation,
        senderConversation,
        receiverConversation
    };
};

module.exports = {
    getOrCreateConversation,
    listConversationsForUser,
    listMessagesForConversation,
    sendMessage
};
