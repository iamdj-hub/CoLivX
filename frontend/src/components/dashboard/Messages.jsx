import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../api';

const getRecipientId = (recipient) => recipient?._id || recipient?.id;

const formatTime = (dateValue) => {
  if (!dateValue) return '';
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(dateValue));
};

const sortConversations = (items) => (
  [...items].sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0))
);

const Messages = ({ currentUid, initialRecipient }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const activeConversationIdRef = useRef(null);
  const lastStartedRecipientRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    activeConversationIdRef.current = activeConversation?._id || null;
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!currentUid) {
      return undefined;
    }

    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join', currentUid);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('message_received', ({ message, conversation }) => {
      setConversations((previous) => {
        const withoutCurrent = previous.filter((item) => item._id !== conversation._id);
        return sortConversations([conversation, ...withoutCurrent]);
      });

      if (activeConversationIdRef.current === String(message.conversationId)) {
        setMessages((previous) => {
          if (previous.some((item) => item._id === message._id)) return previous;
          return [...previous, message];
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUid]);

  useEffect(() => {
    const loadConversations = async () => {
      if (!currentUid) return;

      try {
        setLoadingConversations(true);
        const response = await axios.get(`${API_BASE_URL}/api/messages/conversations/${currentUid}`);
        if (response.data.success) {
          setConversations(response.data.conversations);
          if (!activeConversation && response.data.conversations.length > 0) {
            setActiveConversation(response.data.conversations[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
        setError('Could not load conversations. Make sure the backend is running.');
      } finally {
        setLoadingConversations(false);
      }
    };

    loadConversations();
  }, [currentUid, activeConversation]);

  useEffect(() => {
    const recipientId = getRecipientId(initialRecipient);
    if (!currentUid || !recipientId || recipientId === currentUid) return;
    if (lastStartedRecipientRef.current === recipientId) return;

    const startConversation = async () => {
      try {
        lastStartedRecipientRef.current = recipientId;
        const response = await axios.post(`${API_BASE_URL}/api/messages/conversations`, {
          currentUserId: currentUid,
          recipientId
        });

        if (response.data.success) {
          const conversation = response.data.conversation;
          setConversations((previous) => {
            const withoutCurrent = previous.filter((item) => item._id !== conversation._id);
            return sortConversations([conversation, ...withoutCurrent]);
          });
          setActiveConversation(conversation);
        }
      } catch (err) {
        console.error('Failed to start conversation:', err);
        setError(err.response?.data?.message || 'Could not start this conversation.');
      }
    };

    startConversation();
  }, [currentUid, initialRecipient]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversation?._id || !currentUid) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        const response = await axios.get(
          `${API_BASE_URL}/api/messages/conversations/${activeConversation._id}/messages`,
          { params: { uid: currentUid } }
        );

        if (response.data.success) {
          setMessages(response.data.messages);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError(err.response?.data?.message || 'Could not load message history.');
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeConversation, currentUid]);

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');

    const text = draft.trim();
    const receiverId = activeConversation?.otherUser?.id;

    if (!text || !receiverId || !currentUid) return;

    setSending(true);

    const payload = {
      senderId: currentUid,
      receiverId,
      text
    };

    const socket = socketRef.current;

    if (socket?.connected) {
      socket.emit('send_message', payload, (response) => {
        setSending(false);
        if (!response?.success) {
          setError(response?.message || 'Message could not be sent.');
          return;
        }
        setDraft('');
      });
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/messages/send`, payload);
      if (response.data.success) {
        setDraft('');
        setConversations((previous) => {
          const conversation = response.data.conversation;
          const withoutCurrent = previous.filter((item) => item._id !== conversation._id);
          return sortConversations([conversation, ...withoutCurrent]);
        });
        setMessages((previous) => [...previous, response.data.message]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.response?.data?.message || 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  if (!currentUid) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-500 font-bold">
        Please log in to use live messages.
      </div>
    );
  }

  return (
    <div className="h-[650px] flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="w-full md:w-1/3 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b">
          <div className="font-bold text-gray-800">Messages</div>
          <div className={`text-xs font-bold mt-1 ${socketConnected ? 'text-green-600' : 'text-gray-400'}`}>
            {socketConnected ? 'Live now' : 'Connecting live chat...'}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="p-4 text-gray-400 font-medium">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-gray-400 font-medium">No conversations yet. Open a profile and tap Message.</div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation._id}
                onClick={() => setActiveConversation(conversation)}
                className={`w-full p-4 text-left cursor-pointer hover:bg-blue-50 transition border-b border-gray-50 ${
                  activeConversation?._id === conversation._id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold text-gray-900 truncate">
                    {conversation.otherUser?.displayName || 'CoLivX User'}
                  </div>
                  <div className="text-xs text-gray-400 shrink-0">{formatTime(conversation.lastMessageAt)}</div>
                </div>
                <div className="text-sm text-gray-500 truncate mt-1">
                  {conversation.lastMessage || 'Start the conversation'}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="hidden md:flex w-2/3 flex-col bg-gray-50">
        {activeConversation ? (
          <>
            <div className="p-4 bg-white border-b">
              <div className="font-bold text-gray-900">
                {activeConversation.otherUser?.displayName || 'CoLivX User'}
              </div>
              <div className="text-xs text-gray-500">Direct roommate chat</div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {loadingMessages ? (
                <div className="text-gray-400 font-medium">Loading message history...</div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 italic">
                  No messages yet. Say hello.
                </div>
              ) : (
                messages.map((message) => {
                  const mine = message.senderId === currentUid;
                  return (
                    <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${
                        mine ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'
                      }`}>
                        <div>{message.text}</div>
                        <div className={`text-[11px] mt-1 ${mine ? 'text-blue-100' : 'text-gray-400'}`}>
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 bg-white border-t space-y-2">
              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-bold transition"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 italic">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
