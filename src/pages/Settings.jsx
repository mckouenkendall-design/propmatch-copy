import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeProvider';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Lock, Shield, Moon, Globe, CreditCard, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import RoleChangeModal from '@/components/settings/RoleChangeModal';
import PaymentScreen from '@/components/onboarding/PaymentScreen';

const ACCENT = '#00DBC5';

const CANCEL_REASONS = [
  'Too expensive',
  'Not finding enough matches',
  'Switching platforms',
  'My brokerage is covering it now',
  'Taking a break',
  'Technical issues',
  'Other',
];

// ── Cancel Confirmation Modal (Step 1) ──────────────────────────────────────
function CancelConfirmModal({ onConfirm, onBack, isDark }) {
  const bg = isDark ? '#1a1f25' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textPrimary = isDark ? 'white' : '#111827';
  const textSecondary = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle style={{ width: '24px', height: '24px', color: '#ef4444' }} />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 500, color: textPrimary, margin: 0 }}>
              Cancel your subscription?
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: textSecondary, margin: '4px 0 0' }}>
              You'll lose access to all paid features.
            </p>
          </div>
        </div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: textSecondary, lineHeight: 1.6, margin: '0 0 24px' }}>
          Your subscription will remain active until the end of your current billing period. After that, your account will revert to the free plan.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${border}`, borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: textSecondary, cursor: 'pointer' }}
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '12px', background: '#ef4444', border: 'none', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', cursor: 'pointer' }}
          >
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cancel Reason Modal (Step 2) ─────────────────────────────────────────────
function CancelReasonModal({ onSubmit, onBack, isDark }) {
  const [selected, setSelected] = useState('');
  const [other, setOther] = useState('');
  const bg = isDark ? '#1a1f25' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textPrimary = isDark ? 'white' : '#111827';
  const textSecondary = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const chipBase = isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6';
  const canSubmit = selected && (selected !== 'Other' || other.trim());

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 500, color: textPrimary, margin: '0 0 8px' }}>
          One more thing — why are you leaving?
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: textSecondary, margin: '0 0 20px' }}>
          Your feedback helps us improve PropMatch.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {CANCEL_REASONS.map(reason => (
            <button
              key={reason}
              onClick={() => setSelected(reason)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                background: selected === reason ? 'rgba(0,219,197,0.08)' : chipBase,
                border: `1px solid ${selected === reason ? ACCENT : border}`,
                fontFamily: "'Inter', sans-serif", fontSize: '14px',
                color: selected === reason ? ACCENT : textPrimary,
                transition: 'all 0.15s',
              }}
            >
              {reason}
              {selected === reason && <CheckCircle style={{ width: '16px', height: '16px', color: ACCENT, flexShrink: 0 }} />}
            </button>
          ))}
        </div>
        {selected === 'Other' && (
          <textarea
            value={other}
            onChange={e => setOther(e.target.value)}
            placeholder="Tell us more..."
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', border: `1px solid ${border}`, borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: textPrimary, outline: 'none', resize: 'vertical', marginBottom: '16px' }}
          />
        )}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            onClick={onBack}
            style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${border}`, borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: textSecondary, cursor: 'pointer' }}
          >
            Go Back
          </button>
          <button
            onClick={() => canSubmit && onSubmit(selected === 'Other' ? other : selected)}
            disabled={!canSubmit}
            style={{ flex: 1, padding: '12px', background: canSubmit ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'), border: 'none', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: canSubmit ? 'white' : textSecondary, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
          >
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Settings Page ───────────────────────────────────────────────────────
export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [emailNotifications, setEmailNotifications] = useState(user?.email_notifications !== false);
  const [matchAlerts, setMatchAlerts] = useState(user?.match_alerts !== false);
  const [groupNotifications, setGroupNotifications] = useState(user?.group_notifications !== false);
  const [messageNotifications, setMessageNotifications] = useState(user?.message_notifications !== false);

  const [isAnnual, setIsAnnual] = useState(user?.billing_cycle === 'annual');
  const [autoRenew, setAutoRenew] = useState(user?.auto_renew !== false);
  const [showCancelStep1, setShowCancelStep1] = useState(false);
  const [showCancelStep2, setShowCancelStep2] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);

  const [language, setLanguage] = useState(user?.language || 'en');

  useEffect(() => {
    if (user) {
      setEmailNotifications(user.email_notifications !== false);
      setMatchAlerts(user.match_alerts !== false);
      setGroupNotifications(user.group_notifications !== false);
      setMessageNotifications(user.message_notifications !== false);
      setIsAnnual(user.billing_cycle === 'annual');
      setAutoRenew(user.auto_renew !== false);
      setLanguage(user.language || 'en');
    }
  }, [user]);

  const isBroker = user?.user_type === 'principal_broker';
  const isBrokerSponsored = user?.selected_plan === 'broker_sponsored';
  const isPaidPlan = user?.selected_plan && user.selected_plan !== 'free';

  const planLabel = () => {
    if (!user?.selected_plan || user.selected_plan === 'free') return 'Free';
    if (user.selected_plan === 'broker_sponsored') return 'Broker-Sponsored';
    if (user.selected_plan === 'individual') return 'Individual';
    if (user.selected_plan === 'brokerage') return 'Brokerage';
    return user.selected_plan;
  };

  const planPrice = () => {
    if (isBrokerSponsored) return '$0 — covered by your brokerage';
    if (user?.selected_plan === 'individual') return isAnnual ? '$849 / year ($70.75/mo)' : '$79 / month';
    if (user?.selected_plan === 'brokerage') {
      const seats = user?.brokerage_seats || 2;
      return isAnnual ? `$${seats * 708} / year` : `$${seats * 64} / month`;
    }
    return 'Free';
  };

  const getOrCreateProfile = async () => {
    const email = user?.email;
    if (!email) return null;
    const existing = await base44.entities.UserProfile.list();
    return existing.find(p => p.user_email === email) || null;
  };

  const saveNotifications = async () => {
    try {
      const profile = await getOrCreateProfile();
      if (profile) {
        await base44.entities.UserProfile.update(profile.id, {
          email_notifications: emailNotifications,
          match_alerts: matchAlerts,
          group_notifications: groupNotifications,
          message_notifications: messageNotifications,
        });
        await refreshUser();
      }
      toast({ title: 'Notification preferences saved' });
    } catch (e) {
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
  };

  const savePreferences = async () => {
    try {
      const profile = await getOrCreateProfile();
      if (profile) {
        await base44.entities.UserProfile.update(profile.id, { language });
        await refreshUser();
      }
      toast({ title: 'Preferences saved' });
    } catch (e) {
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
  };

  // NOTE: No manual createNotification call here.
  // onSubscriptionChanged trigger fires automatically when selected_plan changes
  // and handles the cancellation notification with the correct message.
  const handleCancelSubscription = async (reason) => {
    try {
      const profile = await getOrCreateProfile();
      if (profile) {
        await base44.entities.UserProfile.update(profile.id, {
          selected_plan: 'free',
          subscription_status: 'cancelled',
          cancellation_reason: reason,
        });
        await refreshUser();
      }
      setShowCancelStep2(false);
      setCancelDone(true);
      toast({ title: 'Subscription cancelled', description: 'You have access until the end of your current period.' });
    } catch (e) {
      toast({ title: 'Failed to cancel', variant: 'destructive' });
    }
  };

  const handlePaymentComplete = async (plan) => {
    try {
      const profile = await getOrCreateProfile();
      if (profile) {
        await base44.entities.UserProfile.update(profile.id, {
          user_type: 'principal_broker',
          selected_plan: plan,
          subscription_status: 'active',
        });
      }
      await base44.auth.updateMe({ user_type: 'principal_broker' });
      await refreshUser();
      setShowPaymentScreen(false);
      toast({ title: 'Role updated — you are now a Principal Broker' });
    } catch (e) {
      toast({ title: 'Error updating role', variant: 'destructive' });
    }
  };

  if (showPaymentScreen) {
    return (
      <PaymentScreen
        isBroker={true}
        employingBrokerNumber={user?.employing_broker_id || ''}
        fromSettings={true}
        onComplete={handlePaymentComplete}
      />
    );
  }

  const sectionStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '16px',
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '8px',
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>
      {showRoleModal && (
        <RoleChangeModal
          onConfirm={() => { setShowRoleModal(false); setShowPaymentScreen(true); }}
          onCancel={() => setShowRoleModal(false)}
        />
      )}
      {showCancelStep1 && (
        <CancelConfirmModal
          isDark={isDark}
          onBack={() => setShowCancelStep1(false)}
          onConfirm={() => { setShowCancelStep1(false); setShowCancelStep2(true); }}
        />
      )}
      {showCancelStep2 && (
        <CancelReasonModal
          isDark={isDark}
          onBack={() => { setShowCancelStep2(false); setShowCancelStep1(true); }}
          onSubmit={handleCancelSubscription}
        />
      )}

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', fontWeight: 400, color: 'white', margin: '0 0 6px' }}>Settings</h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="subscription" style={{ width: '100%' }}>
        <TabsList style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px', flexWrap: 'wrap', height: 'auto', gap: '4px' }}>
          {[
            { value: 'subscription', icon: CreditCard, label: 'Subscription' },
            { value: 'notifications', icon: Bell, label: 'Notifications' },
            { value: 'preferences', icon: Globe, label: 'Preferences' },
            { value: 'security', icon: Lock, label: 'Security' },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif" }}
              className="data-[state=active]:bg-[rgba(0,219,197,0.15)] data-[state=active]:text-[#00DBC5]"
            >
              <tab.icon style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── SUBSCRIPTION TAB ── */}
        <TabsContent value="subscription">
          <div style={sectionStyle}>
            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>
              Current Plan
            </h3>

            {isBrokerSponsored ? (
              <div style={{ background: 'rgba(0,219,197,0.06)', border: `1px solid ${ACCENT}30`, borderRadius: '10px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <CheckCircle style={{ width: '20px', height: '20px', color: ACCENT }} />
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: 500, color: 'white', margin: 0 }}>
                    Broker-Sponsored
                  </p>
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: '0 0 12px' }}>
                  Your subscription is covered by <strong style={{ color: ACCENT }}>{user?.brokerage_name || 'your brokerage'}</strong>. You have full Individual-level access at no cost.
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                  Contact your broker to make changes to this plan.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'Plan', value: planLabel() },
                    { label: 'Price', value: planPrice() },
                    { label: 'Billing', value: isAnnual ? 'Annual' : 'Monthly' },
                    ...(isBroker ? [{ label: 'Seats', value: String(user?.brokerage_seats || 2) }] : []),
                  ].map(item => (
                    <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '14px' }}>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '15px', fontWeight: 500, color: 'white', margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {isPaidPlan && (
                  <>
                    <div style={{ ...rowStyle, marginBottom: '10px' }}>
                      <div>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: '0 0 4px' }}>Annual Billing</p>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Save up to 25% by paying annually</p>
                      </div>
                      <Switch checked={isAnnual} onCheckedChange={(val) => { setIsAnnual(val); toast({ title: `Switched to ${val ? 'annual' : 'monthly'} billing. Takes effect at next renewal.` }); }} />
                    </div>
                    <div style={{ ...rowStyle, marginBottom: '10px' }}>
                      <div>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: '0 0 4px' }}>Auto-Renew</p>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Automatically renew your subscription</p>
                      </div>
                      <Switch checked={autoRenew} onCheckedChange={(val) => { setAutoRenew(val); toast({ title: `Auto-renew ${val ? 'enabled' : 'disabled'}` }); }} />
                    </div>
                  </>
                )}

                {isBroker && (
                  <div style={{ background: 'rgba(0,219,197,0.04)', border: '1px solid rgba(0,219,197,0.15)', borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: '0 0 8px' }}>Manage Seats & Roster</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 12px' }}>
                      Add or remove agents from your brokerage plan in the Brokerage Admin dashboard.
                    </p>
                    <button
                      onClick={() => navigate('/BrokerDashboard')}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: ACCENT, border: 'none', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#111827', cursor: 'pointer' }}
                    >
                      Go to Brokerage Admin <ChevronRight style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                )}

                {isPaidPlan && !cancelDone && (
                  <button
                    onClick={() => setShowCancelStep1(true)}
                    style={{ marginTop: '8px', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 20px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#ef4444', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Cancel Subscription
                  </button>
                )}

                {cancelDone && (
                  <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '16px', marginTop: '8px' }}>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#ef4444', margin: 0 }}>
                      Your subscription has been cancelled. You'll have access until the end of your billing period.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── NOTIFICATIONS TAB ── */}
        <TabsContent value="notifications">
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'white' }}>Notification Preferences</CardTitle>
              <CardDescription style={{ color: 'rgba(255,255,255,0.5)' }}>Choose what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Email Notifications', desc: 'Receive updates via email', value: emailNotifications, set: setEmailNotifications },
                { label: 'New Match Alerts', desc: 'Get notified when new matches are found', value: matchAlerts, set: setMatchAlerts },
                { label: 'Group Activity', desc: 'Updates from groups you\'ve joined', value: groupNotifications, set: setGroupNotifications },
                { label: 'Direct Messages', desc: 'Notifications for new messages', value: messageNotifications, set: setMessageNotifications },
              ].map(item => (
                <div key={item.label} style={rowStyle}>
                  <div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: '0 0 4px' }}>{item.label}</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{item.desc}</p>
                  </div>
                  <Switch checked={item.value} onCheckedChange={item.set} />
                </div>
              ))}
              <Button onClick={saveNotifications} style={{ background: ACCENT, color: '#111827', alignSelf: 'flex-start', marginTop: '8px' }}>
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PREFERENCES TAB ── */}
        <TabsContent value="preferences">
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'white' }}>General Preferences</CardTitle>
              <CardDescription style={{ color: 'rgba(255,255,255,0.5)' }}>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Moon style={{ width: '16px', height: '16px' }} /> Theme
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
              <Button onClick={savePreferences} style={{ background: ACCENT, color: '#111827', alignSelf: 'flex-start' }}>
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SECURITY TAB ── */}
        <TabsContent value="security">
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'white' }}>Security Settings</CardTitle>
              <CardDescription style={{ color: 'rgba(255,255,255,0.5)' }}>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '20px', background: 'rgba(0,219,197,0.08)', border: `1px solid ${ACCENT}`, borderRadius: '8px' }}>
                <Shield style={{ width: '24px', height: '24px', color: ACCENT, marginBottom: '12px' }} />
                <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', fontWeight: 500, color: 'white', margin: '0 0 8px' }}>Password Management</h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px' }}>
                  Password changes are managed through Base44's authentication system.
                </p>
                <Button variant="outline" style={{ borderColor: ACCENT, color: ACCENT }} onClick={() => window.open('https://app.base44.com/account/security', '_blank')}>
                  Manage Password →
                </Button>
              </div>
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: '0 0 8px' }}>Account Status</h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Your account is active and secure</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}