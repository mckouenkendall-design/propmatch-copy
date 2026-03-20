import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, 
  Bell, 
  Lock, 
  Shield,
  Mail,
  Moon,
  Globe
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ACCENT = '#00DBC5';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Account Settings
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');



  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(user?.email_notifications !== false);
  const [matchAlerts, setMatchAlerts] = useState(user?.match_alerts !== false);
  const [groupNotifications, setGroupNotifications] = useState(user?.group_notifications !== false);
  const [messageNotifications, setMessageNotifications] = useState(user?.message_notifications !== false);

  // Preferences
  const [theme, setTheme] = useState(user?.theme || 'dark');
  const [language, setLanguage] = useState(user?.language || 'en');

  // Sync state with updated user data
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setEmailNotifications(user.email_notifications !== false);
      setMatchAlerts(user.match_alerts !== false);
      setGroupNotifications(user.group_notifications !== false);
      setMessageNotifications(user.message_notifications !== false);
      setTheme(user.theme || 'dark');
      setLanguage(user.language || 'en');
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const result = await base44.auth.updateMe(data);
      // Wait for the query to be invalidated and refetched
      await queryClient.invalidateQueries(['user']);
      await queryClient.refetchQueries(['user']);
      return result;
    },
    onSuccess: () => {
      toast({ 
        title: 'Settings updated successfully',
        duration: 4000,
      });
    },
  });

  const saveAccountSettings = async () => {
    await updateMutation.mutateAsync({ full_name: fullName, email });
  };

  const saveNotificationSettings = async () => {
    await updateMutation.mutateAsync({
      email_notifications: emailNotifications,
      match_alerts: matchAlerts,
      group_notifications: groupNotifications,
      message_notifications: messageNotifications,
    });
  };

  const savePreferences = async () => {
    await updateMutation.mutateAsync({ theme, language });
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
      
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', fontWeight: 400, color: 'white', margin: '0 0 6px' }}>
          Settings
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Manage your account settings and preferences
        </p>
      </div>

        <Tabs defaultValue="account" style={{ width: '100%' }}>
          <TabsList style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
            <TabsTrigger 
              value="account" 
              style={{ 
                color: 'rgba(255,255,255,0.6)',
                fontFamily: "'Inter', sans-serif"
              }}
              className="data-[state=active]:bg-[rgba(0,219,197,0.15)] data-[state=active]:text-[#00DBC5]"
            >
              <User style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              Account
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              style={{ 
                color: 'rgba(255,255,255,0.6)',
                fontFamily: "'Inter', sans-serif"
              }}
              className="data-[state=active]:bg-[rgba(0,219,197,0.15)] data-[state=active]:text-[#00DBC5]"
            >
              <Bell style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              style={{ 
                color: 'rgba(255,255,255,0.6)',
                fontFamily: "'Inter', sans-serif"
              }}
              className="data-[state=active]:bg-[rgba(0,219,197,0.15)] data-[state=active]:text-[#00DBC5]"
            >
              <Globe style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              Preferences
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              style={{ 
                color: 'rgba(255,255,255,0.6)',
                fontFamily: "'Inter', sans-serif"
              }}
              className="data-[state=active]:bg-[rgba(0,219,197,0.15)] data-[state=active]:text-[#00DBC5]"
            >
              <Lock style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account">
            <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'white' }}>Account Information</CardTitle>
                <CardDescription style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Update your account details
                </CardDescription>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>Full Name</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>Email Address</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>Account Type</Label>
                  <div style={{
                    background: 'rgba(0,219,197,0.08)',
                    border: `1px solid ${ACCENT}`,
                    borderRadius: '6px',
                    padding: '12px 16px',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: ACCENT,
                    textTransform: 'capitalize',
                  }}>
                    {user?.role || 'User'}
                  </div>
                </div>
                <Button
                  onClick={saveAccountSettings}
                  disabled={updateMutation.isPending}
                  style={{ background: ACCENT, color: '#111827', alignSelf: 'flex-start' }}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'white' }}>Notification Preferences</CardTitle>
                <CardDescription style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Choose what notifications you receive
                </CardDescription>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: '0 0 4px' }}>Email Notifications</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Receive updates via email</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: '0 0 4px' }}>New Match Alerts</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Get notified when new matches are found</p>
                  </div>
                  <Switch checked={matchAlerts} onCheckedChange={setMatchAlerts} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: '0 0 4px' }}>Group Activity</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Updates from groups you've joined</p>
                  </div>
                  <Switch checked={groupNotifications} onCheckedChange={setGroupNotifications} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: '0 0 4px' }}>Direct Messages</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Notifications for new messages</p>
                  </div>
                  <Switch checked={messageNotifications} onCheckedChange={setMessageNotifications} />
                </div>

                <Button
                  onClick={saveNotificationSettings}
                  disabled={updateMutation.isPending}
                  style={{ background: ACCENT, color: '#111827', alignSelf: 'flex-start' }}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences">
            <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'white' }}>General Preferences</CardTitle>
                <CardDescription style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Customize your experience
                </CardDescription>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>
                    <Moon style={{ width: '16px', height: '16px', display: 'inline', marginRight: '8px' }} />
                    Theme
                  </Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <SelectItem value="dark" style={{ color: 'rgba(255,255,255,0.85)' }}>Dark Mode</SelectItem>
                      <SelectItem value="light" style={{ color: 'rgba(255,255,255,0.85)' }}>Light Mode</SelectItem>
                      <SelectItem value="auto" style={{ color: 'rgba(255,255,255,0.85)' }}>Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <SelectItem value="en" style={{ color: 'rgba(255,255,255,0.85)' }}>English</SelectItem>
                      <SelectItem value="es" style={{ color: 'rgba(255,255,255,0.85)' }}>Spanish</SelectItem>
                      <SelectItem value="fr" style={{ color: 'rgba(255,255,255,0.85)' }}>French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={savePreferences}
                  disabled={updateMutation.isPending}
                  style={{ background: ACCENT, color: '#111827', alignSelf: 'flex-start' }}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'white' }}>Security Settings</CardTitle>
                <CardDescription style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Manage your account security
                </CardDescription>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '20px', background: 'rgba(0,219,197,0.08)', border: `1px solid ${ACCENT}`, borderRadius: '8px' }}>
                  <Shield style={{ width: '24px', height: '24px', color: ACCENT, marginBottom: '12px' }} />
                  <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', fontWeight: 500, color: 'white', margin: '0 0 8px' }}>
                    Password Management
                  </h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px' }}>
                    Password changes are managed through Base44's authentication system. Click below to update your password securely.
                  </p>
                  <Button
                    variant="outline"
                    style={{ borderColor: ACCENT, color: ACCENT }}
                    onClick={() => window.open('https://app.base44.com/account/security', '_blank')}
                  >
                    Manage Password →
                  </Button>
                </div>

                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: '0 0 8px' }}>
                    Account Status
                  </h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                    Your account is active and secure
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}