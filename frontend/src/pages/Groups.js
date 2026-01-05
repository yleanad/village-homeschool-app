import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Plus, MapPin, Crown, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const FOCUS_AREAS = [
  'Math', 'Science', 'Language Arts', 'History', 'Art', 'Music',
  'Physical Education', 'Foreign Languages', 'Nature Studies', 'STEM',
  'Drama/Theater', 'Outdoor Activities', 'Field Trips', 'Social Skills'
];

const Groups = () => {
  const { user, familyProfile } = useAuth();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState({ owned: [], member_of: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: familyProfile?.city || '',
    state: familyProfile?.state || '',
    zip_code: familyProfile?.zip_code || '',
    group_type: 'co-op',
    focus_areas: [],
    age_range: '',
    meeting_frequency: 'weekly',
    max_members: '',
    is_private: false
  });

  const isPremium = user?.subscription_status === 'active';

  useEffect(() => {
    fetchGroups();
    fetchMyGroups();
  }, [filter]);

  const fetchGroups = async () => {
    try {
      let url = `${API_URL}/api/groups`;
      if (filter !== 'all') {
        url += `?group_type=${filter}`;
      }
      const response = await axios.get(url, { withCredentials: true });
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/groups/my`, { withCredentials: true });
      setMyGroups(response.data);
    } catch (error) {
      console.error('Error fetching my groups:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleFocusArea = (area) => {
    setFormData(prev => ({
      ...prev,
      focus_areas: prev.focus_areas.includes(area)
        ? prev.focus_areas.filter(a => a !== area)
        : [...prev.focus_areas, area]
    }));
  };

  const handleCreateGroup = async () => {
    if (!formData.name || !formData.city || !formData.state) {
      toast.error('Please fill in required fields');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        ...formData,
        max_members: formData.max_members ? parseInt(formData.max_members) : null
      };
      
      await axios.post(`${API_URL}/api/groups`, payload, { withCredentials: true });
      toast.success('Group created successfully!');
      setCreateOpen(false);
      setFormData({
        name: '', description: '', city: familyProfile?.city || '', state: familyProfile?.state || '',
        zip_code: familyProfile?.zip_code || '', group_type: 'co-op', focus_areas: [],
        age_range: '', meeting_frequency: 'weekly', max_members: '', is_private: false
      });
      fetchGroups();
      fetchMyGroups();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const response = await axios.post(`${API_URL}/api/groups/${groupId}/join`, {}, { withCredentials: true });
      toast.success(response.data.message);
      fetchGroups();
      fetchMyGroups();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to join group');
    }
  };

  const groupTypes = [
    { value: 'all', label: 'All Groups' },
    { value: 'co-op', label: 'Co-ops' },
    { value: 'support_group', label: 'Support Groups' },
    { value: 'activity_club', label: 'Activity Clubs' },
  ];

  const isMember = (group) => {
    return group.members?.some(m => m.family_id === familyProfile?.family_id);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="groups-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#2C3E50]">
              Co-ops & Groups
            </h1>
            <p className="text-[#5F6F75] mt-1">
              Join or create homeschool co-ops and activity groups
            </p>
          </div>
          
          {isPremium ? (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary" data-testid="create-group-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-fraunces text-xl">Create a Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Group Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g., Austin Homeschool Co-op"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Group Type</Label>
                    <Select value={formData.group_type} onValueChange={(v) => handleChange('group_type', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="co-op">Co-op (Academic)</SelectItem>
                        <SelectItem value="support_group">Support Group</SelectItem>
                        <SelectItem value="activity_club">Activity Club</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Tell families about your group..."
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>City *</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>State *</Label>
                      <Input
                        value={formData.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>ZIP</Label>
                      <Input
                        value={formData.zip_code}
                        onChange={(e) => handleChange('zip_code', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Focus Areas</Label>
                    <div className="flex flex-wrap gap-2">
                      {FOCUS_AREAS.map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleFocusArea(area)}
                          className={`px-3 py-1 rounded-full text-sm transition ${
                            formData.focus_areas.includes(area)
                              ? 'bg-[#5B9A8B] text-white'
                              : 'bg-[#F5F3EE] text-[#2C3E50]'
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Meeting Frequency</Label>
                      <Select value={formData.meeting_frequency} onValueChange={(v) => handleChange('meeting_frequency', v)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="varies">Varies</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Max Members</Label>
                      <Input
                        type="number"
                        value={formData.max_members}
                        onChange={(e) => handleChange('max_members', e.target.value)}
                        placeholder="No limit"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Age Range</Label>
                    <Input
                      value={formData.age_range}
                      onChange={(e) => handleChange('age_range', e.target.value)}
                      placeholder="e.g., 6-12 years"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label>Private Group</Label>
                      <p className="text-sm text-[#5F6F75]">Require approval to join</p>
                    </div>
                    <Switch
                      checked={formData.is_private}
                      onCheckedChange={(v) => handleChange('is_private', v)}
                    />
                  </div>
                  
                  <Button
                    onClick={handleCreateGroup}
                    className="w-full btn-primary"
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : 'Create Group'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Link to="/pricing">
              <Button className="btn-coral" data-testid="upgrade-for-groups-btn">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade for Groups
              </Button>
            </Link>
          )}
        </div>

        {/* Premium Banner */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#D4B896]/30 to-[#C8907A]/20 rounded-xl p-6 border border-[#D4B896]/40"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#D4B896]/30 flex items-center justify-center">
                <Crown className="w-6 h-6 text-[#8B7355]" />
              </div>
              <div className="flex-1">
                <h3 className="font-fraunces text-lg font-semibold text-[#2C3E50]">
                  Premium Feature: Co-op & Group Management
                </h3>
                <p className="text-[#5F6F75] text-sm">
                  Create and manage co-ops, activity clubs, and support groups. Post announcements, organize group events, and build your community.
                </p>
              </div>
              <Link to="/pricing">
                <Button className="btn-primary">Upgrade Now</Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* My Groups */}
        {(myGroups.owned.length > 0 || myGroups.member_of.length > 0) && (
          <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50] mb-4">My Groups</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...myGroups.owned, ...myGroups.member_of].map((group) => (
                <Link key={group.group_id} to={`/groups/${group.group_id}`}>
                  <div className="p-4 bg-[#F5F3EE] rounded-lg hover:bg-[#D4B896]/20 transition">
                    <div className="flex items-center gap-2 mb-2">
                      {group.owner_family_id === familyProfile?.family_id && (
                        <Crown className="w-4 h-4 text-[#D4B896]" />
                      )}
                      <h3 className="font-semibold text-[#2C3E50] truncate">{group.name}</h3>
                    </div>
                    <p className="text-sm text-[#5F6F75]">{group.member_count} members</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48" data-testid="group-type-filter">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {groupTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-[#E0E0E0]">
            <Users className="w-16 h-16 text-[#5F6F75]/30 mx-auto mb-4" />
            <h3 className="font-fraunces text-xl text-[#2C3E50] mb-2">No groups found</h3>
            <p className="text-[#5F6F75]">Be the first to create a group in your area!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group, index) => (
              <motion.div
                key={group.group_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-[#E0E0E0] p-5 card-hover"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {group.is_private ? (
                      <Lock className="w-4 h-4 text-[#5F6F75]" />
                    ) : (
                      <Unlock className="w-4 h-4 text-[#5B9A8B]" />
                    )}
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#5B9A8B]/10 text-[#5B9A8B]">
                      {group.group_type.replace('_', ' ')}
                    </span>
                  </div>
                  {group.meeting_frequency && (
                    <span className="text-xs text-[#5F6F75]">{group.meeting_frequency}</span>
                  )}
                </div>
                
                <h3 className="font-fraunces text-lg font-semibold text-[#2C3E50] mb-2">
                  {group.name}
                </h3>
                
                <p className="text-sm text-[#5F6F75] flex items-center gap-1 mb-2">
                  <MapPin className="w-4 h-4" />
                  {group.city}, {group.state}
                </p>
                
                {group.description && (
                  <p className="text-sm text-[#5F6F75] line-clamp-2 mb-3">{group.description}</p>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#2C3E50] font-medium">
                    <Users className="w-4 h-4 inline mr-1" />
                    {group.member_count} members
                  </span>
                  
                  {isMember(group) ? (
                    <Link to={`/groups/${group.group_id}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-[#5B9A8B] hover:bg-[#4A8275] text-white"
                      onClick={() => handleJoinGroup(group.group_id)}
                    >
                      Join
                    </Button>
                  )}
                </div>
                
                {group.focus_areas?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-[#E0E0E0]">
                    {group.focus_areas.slice(0, 3).map((area, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-[#F5F3EE] text-[#5F6F75] rounded">
                        {area}
                      </span>
                    ))}
                    {group.focus_areas.length > 3 && (
                      <span className="text-xs text-[#5F6F75]">+{group.focus_areas.length - 3}</span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Groups;
