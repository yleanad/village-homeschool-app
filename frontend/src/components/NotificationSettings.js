import React, { useState, useEffect } from 'react';
import { Bell, BellOff, MessageCircle, Calendar, Users, Handshake, Send, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  isPushSupported,
  isNotificationEnabled,
  subscribeToPush,
  unsubscribeFromPush,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
  getPushSubscriptionStatus
} from '@/utils/notifications';

const NotificationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [permission, setPermission] = useState('default');
  const [preferences, setPreferences] = useState({
    messages: true,
    events: true,
    meetup_requests: true,
    group_updates: true
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadNotificationStatus();
  }, []);

  const loadNotificationStatus = async () => {
    setLoading(true);
    try {
      // Check local push status
      const status = await getPushSubscriptionStatus();
      setPushSupported(status.supported);
      setPushEnabled(status.subscribed);
      setPermission(status.permission);

      // Get server-side preferences
      if (status.supported) {
        const prefs = await getNotificationPreferences();
        setPreferences(prefs.preferences);
        setPushEnabled(prefs.push_enabled);
      }
    } catch (error) {
      console.error('Failed to load notification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePush = async () => {
    try {
      if (pushEnabled) {
        // Unsubscribe
        await unsubscribeFromPush();
        setPushEnabled(false);
        toast.success('Push notifications disabled');
      } else {
        // Subscribe
        await subscribeToPush();
        setPushEnabled(true);
        toast.success('Push notifications enabled! 🔔');
      }
    } catch (error) {
      console.error('Failed to toggle push:', error);
      if (error.message.includes('permission denied')) {
        toast.error('Please enable notifications in your browser settings');
      } else {
        toast.error('Failed to update notification settings');
      }
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    
    setSaving(true);
    try {
      await updateNotificationPreferences(newPrefs);
      toast.success('Preferences updated');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      // Revert on error
      setPreferences(preferences);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    try {
      await sendTestNotification();
      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!pushSupported) {
    return (
      <div className="bg-[#F5F3EE] rounded-xl p-6 text-center">
        <BellOff className="w-12 h-12 text-[#5F6F75] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#2C3E50] mb-2">
          Push Notifications Not Supported
        </h3>
        <p className="text-[#5F6F75] text-sm">
          Your browser doesn&apos;t support push notifications. Try using Chrome, Firefox, or Safari on a supported device.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable Push */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              pushEnabled ? 'bg-[#C8907A]/15 text-[#C8907A]' : 'bg-gray-100 text-gray-400'
            }`}>
              {pushEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-[#2C3E50]">Push Notifications</h3>
              <p className="text-sm text-[#5F6F75]">
                {pushEnabled ? 'Enabled - You\'ll receive alerts' : 'Disabled - Enable to stay updated'}
              </p>
            </div>
          </div>
          <Switch
            checked={pushEnabled}
            onCheckedChange={handleTogglePush}
            data-testid="push-toggle"
          />
        </div>

        {permission === 'denied' && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-sm">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">Notifications Blocked</p>
              <p className="text-red-600">
                You&apos;ve blocked notifications. To enable them, click the lock icon in your browser&apos;s address bar and allow notifications.
              </p>
            </div>
          </div>
        )}

        {pushEnabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestNotification}
            disabled={testing}
            className="mt-4"
            data-testid="test-notification-btn"
          >
            <Send className="w-4 h-4 mr-2" />
            {testing ? 'Sending...' : 'Send Test Notification'}
          </Button>
        )}
      </div>

      {/* Notification Preferences */}
      {pushEnabled && (
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
          <h3 className="font-semibold text-[#2C3E50] mb-4">Notification Types</h3>
          <p className="text-sm text-[#5F6F75] mb-6">
            Choose which notifications you want to receive
          </p>

          <div className="space-y-4">
            {/* Messages */}
            <div className="flex items-center justify-between p-3 bg-[#F5F3EE] rounded-lg">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-[#C8907A]" />
                <div>
                  <Label className="font-medium text-[#2C3E50]">Messages</Label>
                  <p className="text-xs text-[#5F6F75]">New messages from other families</p>
                </div>
              </div>
              <Switch
                checked={preferences.messages}
                onCheckedChange={(v) => handlePreferenceChange('messages', v)}
                disabled={saving}
                data-testid="pref-messages"
              />
            </div>

            {/* Events */}
            <div className="flex items-center justify-between p-3 bg-[#F5F3EE] rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#C8907A]" />
                <div>
                  <Label className="font-medium text-[#2C3E50]">Events</Label>
                  <p className="text-xs text-[#5F6F75]">New events near you</p>
                </div>
              </div>
              <Switch
                checked={preferences.events}
                onCheckedChange={(v) => handlePreferenceChange('events', v)}
                disabled={saving}
                data-testid="pref-events"
              />
            </div>

            {/* Meetup Requests */}
            <div className="flex items-center justify-between p-3 bg-[#F5F3EE] rounded-lg">
              <div className="flex items-center gap-3">
                <Handshake className="w-5 h-5 text-[#C8907A]" />
                <div>
                  <Label className="font-medium text-[#2C3E50]">Meetup Requests</Label>
                  <p className="text-xs text-[#5F6F75]">New meetup requests and responses</p>
                </div>
              </div>
              <Switch
                checked={preferences.meetup_requests}
                onCheckedChange={(v) => handlePreferenceChange('meetup_requests', v)}
                disabled={saving}
                data-testid="pref-meetups"
              />
            </div>

            {/* Group Updates */}
            <div className="flex items-center justify-between p-3 bg-[#F5F3EE] rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#C8907A]" />
                <div>
                  <Label className="font-medium text-[#2C3E50]">Group Updates</Label>
                  <p className="text-xs text-[#5F6F75]">Announcements and activity in your groups</p>
                </div>
              </div>
              <Switch
                checked={preferences.group_updates}
                onCheckedChange={(v) => handlePreferenceChange('group_updates', v)}
                disabled={saving}
                data-testid="pref-groups"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
