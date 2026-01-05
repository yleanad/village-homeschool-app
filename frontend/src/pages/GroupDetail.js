import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, MapPin, Calendar, Crown, Bell, Plus, LogOut, Settings, Shield, UserMinus, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const GroupDetail = () => {
  const { groupId } = useParams();
  const { familyProfile } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementData, setAnnouncementData] = useState({ title: '', content: '', pinned: false });
  const [posting, setPosting] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState('');

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  useEffect(() => {
    if (group && (isOwner || isAdmin)) {
      fetchJoinRequests();
    }
  }, [group]);

  const fetchGroup = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/groups/${groupId}`, {
        withCredentials: true
      });
      setGroup(response.data);
    } catch (error) {
      console.error('Error fetching group:', error);
      toast.error(error.response?.data?.detail || 'Group not found');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchJoinRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/groups/${groupId}/join-requests`, {
        withCredentials: true
      });
      setJoinRequests(response.data);
    } catch (error) {
      // Silently fail - user might not have permission
    }
  };

  const isOwner = group?.owner_family_id === familyProfile?.family_id;
  const isMember = group?.members?.some(m => m.family_id === familyProfile?.family_id);
  const memberRole = group?.members?.find(m => m.family_id === familyProfile?.family_id)?.role;
  const isAdmin = memberRole === 'admin' || memberRole === 'owner';

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/groups/${groupId}/leave`, { withCredentials: true });
      toast.success('Left the group');
      navigate('/groups');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to leave group');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this group? This cannot be undone.')) return;
    
    try {
      await axios.delete(`${API_URL}/api/groups/${groupId}`, { withCredentials: true });
      toast.success('Group deleted');
      navigate('/groups');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete group');
    }
  };

  const handlePostAnnouncement = async () => {
    if (!announcementData.title || !announcementData.content) {
      toast.error('Please fill in all fields');
      return;
    }

    setPosting(true);
    try {
      await axios.post(`${API_URL}/api/groups/${groupId}/announcements`, announcementData, {
        withCredentials: true
      });
      toast.success('Announcement posted!');
      setAnnouncementOpen(false);
      setAnnouncementData({ title: '', content: '', pinned: false });
      fetchGroup();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to post announcement');
    } finally {
      setPosting(false);
    }
  };

  const handleUpdateRole = async (familyId, newRole) => {
    try {
      await axios.put(`${API_URL}/api/groups/${groupId}/members/role`, 
        { family_id: familyId, role: newRole },
        { withCredentials: true }
      );
      toast.success(`Role updated to ${newRole}`);
      fetchGroup();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (familyId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/groups/${groupId}/members/${familyId}`, {
        withCredentials: true
      });
      toast.success('Member removed');
      fetchGroup();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove member');
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner) {
      toast.error('Please select a new owner');
      return;
    }
    
    if (!window.confirm('Are you sure you want to transfer ownership? This cannot be undone.')) return;
    
    try {
      await axios.post(`${API_URL}/api/groups/${groupId}/transfer-ownership?new_owner_family_id=${selectedNewOwner}`, {}, {
        withCredentials: true
      });
      toast.success('Ownership transferred');
      setTransferOpen(false);
      fetchGroup();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to transfer ownership');
    }
  };

  const handleApproveJoinRequest = async (familyId) => {
    try {
      await axios.post(`${API_URL}/api/groups/${groupId}/join-requests/${familyId}/approve`, {}, {
        withCredentials: true
      });
      toast.success('Member approved!');
      fetchJoinRequests();
      fetchGroup();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve');
    }
  };

  const handleRejectJoinRequest = async (familyId) => {
    try {
      await axios.post(`${API_URL}/api/groups/${groupId}/join-requests/${familyId}/reject`, {}, {
        withCredentials: true
      });
      toast.success('Request rejected');
      fetchJoinRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reject');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      </DashboardLayout>
    );
  }

  if (!group) return null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto" data-testid="group-detail-page">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 text-[#5F6F75]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Groups
        </Button>

        {/* Group Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden mb-6"
        >
          <div className="p-6 sm:p-8 bg-gradient-to-r from-[#5B9A8B]/10 to-[#D4B896]/10">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium px-3 py-1 rounded-full bg-[#5B9A8B]/20 text-[#5B9A8B]">
                    {group.group_type.replace('_', ' ')}
                  </span>
                  {group.is_private && (
                    <span className="text-sm font-medium px-3 py-1 rounded-full bg-[#C8907A]/20 text-[#C8907A]">
                      Private
                    </span>
                  )}
                </div>
                <h1 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#2C3E50]">
                  {group.name}
                </h1>
                <p className="text-[#5F6F75] flex items-center gap-1 mt-2">
                  <MapPin className="w-4 h-4" />
                  {group.city}, {group.state}
                </p>
                <p className="text-[#5F6F75] text-sm mt-1">
                  Organized by{' '}
                  <Link to={`/family/${group.owner_family_id}`} className="text-[#5B9A8B] font-medium hover:underline">
                    {group.owner_family_name}
                  </Link>
                </p>
              </div>
              
              <div className="flex gap-2">
                {isOwner && (
                  <>
                    <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Bell className="w-4 h-4 mr-2" />
                          Post Announcement
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Post Announcement</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label>Title</Label>
                            <Input
                              value={announcementData.title}
                              onChange={(e) => setAnnouncementData(prev => ({ ...prev, title: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Content</Label>
                            <Textarea
                              value={announcementData.content}
                              onChange={(e) => setAnnouncementData(prev => ({ ...prev, content: e.target.value }))}
                              className="mt-1 min-h-[100px]"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Pin to top</Label>
                            <Switch
                              checked={announcementData.pinned}
                              onCheckedChange={(v) => setAnnouncementData(prev => ({ ...prev, pinned: v }))}
                            />
                          </div>
                          <Button onClick={handlePostAnnouncement} className="w-full btn-primary" disabled={posting}>
                            {posting ? 'Posting...' : 'Post Announcement'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" className="text-red-500" onClick={handleDeleteGroup}>
                      Delete Group
                    </Button>
                  </>
                )}
                {isMember && !isOwner && (
                  <Button variant="outline" onClick={handleLeaveGroup}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave
                  </Button>
                )}
              </div>
            </div>
          </div>

          {group.description && (
            <div className="p-6 border-b border-[#E0E0E0]">
              <h3 className="font-semibold text-[#2C3E50] mb-2">About</h3>
              <p className="text-[#5F6F75]">{group.description}</p>
            </div>
          )}

          <div className="p-6 grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[#5F6F75]">Members</p>
              <p className="font-semibold text-[#2C3E50]">{group.member_count}</p>
            </div>
            {group.meeting_frequency && (
              <div>
                <p className="text-[#5F6F75]">Meets</p>
                <p className="font-semibold text-[#2C3E50] capitalize">{group.meeting_frequency}</p>
              </div>
            )}
            {group.age_range && (
              <div>
                <p className="text-[#5F6F75]">Ages</p>
                <p className="font-semibold text-[#2C3E50]">{group.age_range}</p>
              </div>
            )}
          </div>

          {group.focus_areas?.length > 0 && (
            <div className="p-6 pt-0">
              <h3 className="font-semibold text-[#2C3E50] mb-2">Focus Areas</h3>
              <div className="flex flex-wrap gap-2">
                {group.focus_areas.map((area, i) => (
                  <span key={i} className="interest-tag">{area}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Announcements */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
              <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50] mb-4">
                Announcements
              </h2>
              
              {group.announcements?.length === 0 ? (
                <p className="text-[#5F6F75] text-center py-6">No announcements yet</p>
              ) : (
                <div className="space-y-4">
                  {group.announcements?.map((ann) => (
                    <div key={ann.announcement_id} className={`p-4 rounded-lg ${ann.pinned ? 'bg-[#D4B896]/10 border border-[#D4B896]/30' : 'bg-[#F5F3EE]'}`}>
                      {ann.pinned && (
                        <span className="text-xs font-medium text-[#8B7355] mb-2 block">📌 Pinned</span>
                      )}
                      <h4 className="font-semibold text-[#2C3E50]">{ann.title}</h4>
                      <p className="text-[#5F6F75] text-sm mt-1 whitespace-pre-wrap">{ann.content}</p>
                      <p className="text-xs text-[#5F6F75] mt-2">
                        Posted by {ann.author_family_name} · {new Date(ann.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Members */}
          <div>
            <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
              <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50] mb-4">
                Members ({group.member_count})
              </h2>
              <div className="space-y-3">
                {group.members?.map((member) => (
                  <Link
                    key={member.family_id}
                    to={`/family/${member.family_id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F5F3EE] transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#5B9A8B]/10 flex items-center justify-center text-[#5B9A8B] font-semibold">
                      {member.family_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#2C3E50] text-sm truncate">{member.family_name}</p>
                      {member.role === 'owner' && (
                        <span className="text-xs text-[#D4B896] flex items-center gap-1">
                          <Crown className="w-3 h-3" /> Owner
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GroupDetail;
