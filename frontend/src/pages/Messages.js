import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Messages = () => {
  const { familyId } = useParams();
  const { familyProfile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (familyId) {
      fetchMessages(familyId);
      fetchFamilyInfo(familyId);
    }
  }, [familyId]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/messages/conversations`, {
        withCredentials: true
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (targetFamilyId) => {
    try {
      const response = await axios.get(`${API_URL}/api/messages/${targetFamilyId}`, {
        withCredentials: true
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchFamilyInfo = async (targetFamilyId) => {
    try {
      const response = await axios.get(`${API_URL}/api/family/${targetFamilyId}`, {
        withCredentials: true
      });
      setSelectedFamily(response.data);
    } catch (error) {
      console.error('Error fetching family info:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !familyId) return;

    setSending(true);
    try {
      await axios.post(`${API_URL}/api/messages`, {
        recipient_family_id: familyId,
        content: newMessage.trim()
      }, { withCredentials: true });
      
      setNewMessage('');
      fetchMessages(familyId);
      fetchConversations();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-120px)] flex bg-white rounded-xl border border-[#E0E0E0] overflow-hidden" data-testid="messages-page">
        {/* Conversations List */}
        <div className={`w-full md:w-80 border-r border-[#E0E0E0] flex flex-col ${familyId ? 'hidden md:flex' : ''}`}>
          <div className="p-4 border-b border-[#E0E0E0]">
            <h2 className="font-fraunces text-xl font-semibold text-[#264653]">Messages</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="spinner" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-[#5F6F75]">No conversations yet</p>
                <Link to="/discover" className="text-[#2A9D8F] text-sm font-medium hover:underline">
                  Find families to connect with →
                </Link>
              </div>
            ) : (
              conversations.map((conv) => (
                <Link
                  key={conv.family_id}
                  to={`/messages/${conv.family_id}`}
                  className={`block p-4 border-b border-[#E0E0E0] hover:bg-[#F4F1DE] transition ${
                    familyId === conv.family_id ? 'bg-[#F4F1DE]' : ''
                  }`}
                  data-testid={`conversation-${conv.family_id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center text-[#2A9D8F] font-semibold">
                      {conv.family_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-[#264653] truncate">{conv.family_name}</p>
                        {conv.unread && (
                          <span className="w-2 h-2 rounded-full bg-[#E76F51]" />
                        )}
                      </div>
                      <p className="text-sm text-[#5F6F75] truncate">{conv.last_message}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!familyId ? 'hidden md:flex' : ''}`}>
          {familyId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[#E0E0E0] flex items-center gap-3">
                <Link to="/messages" className="md:hidden">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
                {selectedFamily && (
                  <Link to={`/family/${selectedFamily.family_id}`} className="flex items-center gap-3 hover:opacity-80">
                    <div className="w-10 h-10 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center text-[#2A9D8F] font-semibold">
                      {selectedFamily.family_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-[#264653]">{selectedFamily.family_name}</p>
                      <p className="text-xs text-[#5F6F75]">{selectedFamily.city}, {selectedFamily.state}</p>
                    </div>
                  </Link>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.message_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`chat-message ${
                      msg.sender_family_id === familyProfile?.family_id ? 'sent' : 'received'
                    }`}
                  >
                    {msg.content}
                  </motion.div>
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-[#E0E0E0] flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 h-11 border-[#E0E0E0]"
                  data-testid="message-input"
                />
                <Button 
                  type="submit" 
                  className="btn-primary h-11 px-4"
                  disabled={sending || !newMessage.trim()}
                  data-testid="send-message-btn"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="w-16 h-16 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-[#2A9D8F]" />
                </div>
                <h3 className="font-fraunces text-xl text-[#264653] mb-2">Select a conversation</h3>
                <p className="text-[#5F6F75]">Choose a family to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
