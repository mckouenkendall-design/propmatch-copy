import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeProvider';
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
  Moon,
  Globe,
  Briefcase
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import RoleChangeModal from '@/components/settings/RoleChangeModal';
import PaymentScreen from '@/components/onboarding/PaymentScreen';

const ACCENT = '#00DBC5';

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Account Settings
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [contactEmail, setContactEmail] = useState(user?.contact_email || user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  
  // Professional Settings
  const [userType, setUserType] = useState(user?.user_type || '');
  const [brokerageName, setBrokerageName] = useState(user?.brokerage_name || '');
  const [state, setState] = useState(user?.state || '');
  const [employingBrokerNumber, setEmployingBrokerNumber] = useState(user?.employing_broker_number || '');
  const [licenseNumber, setLicenseNumber] = useState(user?.license_number || '');

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(user?.email_notifications !== false);
  const [matchAlerts, setMatchAlerts] = useState(user?.match_alerts !== false);
  const [groupNotifications, setGroupNotifications] = useState(user?.group_notifications !== false);
  const [messageNotifications, setMessageNotifications] = useState(user?.message_notifications !== false);

  // Preferences
  const [language, setLanguage] = useState(user?.language || 'en');

  // Role change flow
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingUserType, setPendingUserType] = useState('');
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);

  // Sync state with updated user data
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setContactEmail(user.contact_email || user.email || '');
      setPhone(user.phone || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setUserType(user.user_type || '');
      setBrokerageName(user.brokerage_name || '');
      setState(user.state || '');
      setEmployingBrokerNumber(user.employing_broker_number || '');
      setLicenseNumber(user.license_number || '');
      setEmailNotifications(user.email_notifications !== false);
      setMatchAlerts(user.match_alerts !== false);
      setGroupNotifications(user.group_notifications !== false);
      setMessageNotifications(user.message_notifications !== false);
      setLanguage(user.language || 'en');
    }
  }, [user]);

  // Handle role change
  const handleUserTypeChange = (newType) => {
    if (newType === 'principal_broker' && userType !== 'principal_broker') {
      setPendingUserType(newType);
      setShowRoleModal(true);
    } else {
      setUserType(newType);
    }
  };

  const confirmRoleChange = () => {
    setShowRoleModal(false);
    setShowPaymentScreen(true);
  };

  const handlePaymentComplete = async (plan) => {
    try {
      await base44.auth.updateMe({
        user_type: 'principal_broker',
        selected_plan: plan,
      });
      await queryClient.invalidateQueries(['user']);
      await queryClient.refetchQueries(['user']);
      setShowPaymentScreen(false);
      toast({
        title: 'Role updated successfully',
        description: 'You are now a Principal Broker with full access.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
    }
  };

  const handleFieldChange = async (field, value) => {
    try {
      await base44.auth.updateMe({ [field]: value });
      queryClient.invalidateQueries(['user']);
    } catch (error) {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  if (showPaymentScreen) {
    return (
      <PaymentScreen
        isBroker={true}
        employingBrokerNumber={employingBrokerNumber}
        fromSettings={true}
        onComplete={handlePaymentComplete}
      />
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
      {showRoleModal && (
        <RoleChangeModal
          onConfirm={confirmRoleChange}
          onCancel={() => {
            setShowRoleModal(false);
            setPendingUserType('');
          }}
        />
      )}
      
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', fontWeight: 400, color: 'white', margin: '0 0 6px' }}>
          Settings
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Manage your account settings and preferences
        </p>
      </div>

        <Tabs defaultValue="notifications" style={{ width: '100%' }}>
          <TabsList style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
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
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={(val) => {
                      setEmailNotifications(val);
                      handleFieldChange('email_notifications', val);
                    }} 
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: '0 0 4px' }}>New Match Alerts</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Get notified when new matches are found</p>
                  </div>
                  <Switch 
                    checked={matchAlerts} 
                    onCheckedChange={(val) => {
                      setMatchAlerts(val);
                      handleFieldChange('match_alerts', val);
                    }} 
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: '0 0 4px' }}>Group Activity</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Updates from groups you've joined</p>
                  </div>
                  <Switch 
                    checked={groupNotifications} 
                    onCheckedChange={(val) => {
                      setGroupNotifications(val);
                      handleFieldChange('group_notifications', val);
                    }} 
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: '0 0 4px' }}>Direct Messages</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Notifications for new messages</p>
                  </div>
                  <Switch 
                    checked={messageNotifications} 
                    onCheckedChange={(val) => {
                      setMessageNotifications(val);
                      handleFieldChange('message_notifications', val);
                    }} 
                  />
                </div>


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
                  <Select value={language} onValueChange={(val) => {
                    setLanguage(val);
                    handleFieldChange('language', val);
                  }}>
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