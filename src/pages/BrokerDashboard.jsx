import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Users, Building2, TrendingUp, DollarSign, Award, Activity, Settings, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import AddTeamModal from '@/components/broker/AddTeamModal';

const ACCENT = '#00DBC5';

export default function BrokerDashboard() {
  const { user } = useAuth();
  const [showAddTeam, setShowAddTeam] = useState(false);

  const { data: rosterEntries = [] } = useQuery({
    queryKey: ['brokerage-roster'],
    queryFn: () => base44.entities.BrokerageRoster.filter({ 
      broker_email: user?.email,
      status: 'active'
    }),
  });

  const { data: allListings = [] } = useQuery({
    queryKey: ['team-listings'],
    queryFn: () => base44.entities.Listing.list('-created_date', 100),
  });

  const { data: allRequirements = [] } = useQuery({
    queryKey: ['team-requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date', 100),
  });

  // Mock data for team performance
  const totalAgents = rosterEntries.length;
  const totalDeals = allListings.length + allRequirements.length;
  const pipelineValue = allListings.reduce((sum, l) => sum + (l.price || 0), 0);
  const dealsClosed = Math.floor(totalDeals * 0.15); // Mock 15% close rate

  const StatCard = ({ icon: Icon, label, value, subtext, color = ACCENT }) => (
    <Card style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
    >
      <CardContent style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: `${color}15`,
            border: `1px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon style={{ width: '28px', height: '28px', color }} />
          </div>
        </div>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '36px',
          fontWeight: 600,
          color: 'white',
          margin: '0 0 4px'
        }}>
          {value}
        </p>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          color: 'rgba(255,255,255,0.5)',
          margin: '0 0 8px'
        }}>
          {label}
        </p>
        {subtext && (
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            color: color,
            margin: 0
          }}>
            {subtext}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const AgentRow = ({ agent, rank }) => {
    const mockDeals = Math.floor(Math.random() * 15) + 5;
    const mockValue = Math.floor(Math.random() * 2000000) + 500000;

    return (
      <div style={{
        padding: '16px 20px',
        background: rank <= 3 ? 'rgba(0,219,197,0.04)' : 'rgba(255,255,255,0.02)',
        border: rank <= 3 ? `1px solid ${ACCENT}20` : '1px solid rgba(255,255,255,0.05)',
        borderRadius: '10px',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '32px',
          textAlign: 'center',
          fontFamily: "'Inter', sans-serif",
          fontSize: '18px',
          fontWeight: 600,
          color: rank <= 3 ? ACCENT : 'rgba(255,255,255,0.4)'
        }}>
          #{rank}
        </div>

        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: ACCENT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', sans-serif",
          fontSize: '16px',
          fontWeight: 600,
          color: '#111827'
        }}>
          {agent.agent_name?.split(' ').map(n => n[0]).join('') || 'AG'}
        </div>

        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '15px',
            fontWeight: 500,
            color: 'white',
            margin: '0 0 4px'
          }}>
            {agent.agent_name}
          </p>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            color: 'rgba(255,255,255,0.5)',
            margin: 0
          }}>
            {agent.agent_email}
          </p>
        </div>

        <div style={{ textAlign: 'right', marginRight: '20px' }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '18px',
            fontWeight: 600,
            color: ACCENT,
            margin: '0 0 4px'
          }}>
            {mockDeals}
          </p>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)',
            margin: 0
          }}>
            Active Deals
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '18px',
            fontWeight: 600,
            color: 'white',
            margin: '0 0 4px'
          }}>
            ${(mockValue / 1000).toFixed(0)}K
          </p>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)',
            margin: 0
          }}>
            Pipeline Value
          </p>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '48px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '42px',
            fontWeight: 300,
            color: 'white',
            margin: '0 0 8px'
          }}>
            Brokerage Admin
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            {user?.brokerage_name || 'Your Brokerage'} • Manage your team and view performance
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowAddTeam(true)}
            style={{
              padding: '10px 20px',
              background: ACCENT,
              border: 'none',
              borderRadius: '8px',
              color: '#111827',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Add Agents
          </button>

          <button
            onClick={() => window.location.href = '/Settings'}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Settings style={{ width: '16px', height: '16px' }} />
            Manage Subscription
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '48px'
      }}>
        <StatCard
          icon={Users}
          label="Active Agents"
          value={totalAgents}
          subtext={`of ${user?.brokerage_seats || totalAgents} seats`}
        />
        <StatCard
          icon={Activity}
          label="Active Deals"
          value={totalDeals}
          subtext="+12% this month"
        />
        <StatCard
          icon={DollarSign}
          label="Pipeline Value"
          value={`$${(pipelineValue / 1000000).toFixed(1)}M`}
          subtext="+8% this month"
        />
        <StatCard
          icon={Award}
          label="Closed Deals"
          value={dealsClosed}
          subtext="This month"
        />
      </div>

      {/* Top Performers */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '28px',
            fontWeight: 500,
            color: 'white',
            margin: 0
          }}>
            Team Performance
          </h2>
        </div>

        {rosterEntries.length === 0 ? (
          <Card style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <CardContent style={{ padding: '64px', textAlign: 'center' }}>
              <Users style={{ width: '64px', height: '64px', color: `${ACCENT}40`, margin: '0 auto 24px' }} />
              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '24px',
                fontWeight: 500,
                color: 'white',
                margin: '0 0 12px'
              }}>
                No agents added yet
              </h3>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '15px',
                color: 'rgba(255,255,255,0.5)',
                margin: '0 0 24px'
              }}>
                Add your first team member to start tracking performance
              </p>
              <button
                onClick={() => setShowAddTeam(true)}
                style={{
                  padding: '12px 24px',
                  background: ACCENT,
                  border: 'none',
                  borderRadius: '8px',
                  color: '#111827',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Add Team Members
              </button>
            </CardContent>
          </Card>
        ) : (
          <div>
            {rosterEntries.map((agent, idx) => (
              <AgentRow key={agent.id} agent={agent} rank={idx + 1} />
            ))}
          </div>
        )}
      </div>

      {/* Billing Summary */}
      <div>
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '28px',
          fontWeight: 500,
          color: 'white',
          margin: '0 0 24px'
        }}>
          Billing Summary
        </h2>

        <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <CardContent style={{ padding: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
              <div>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.5)',
                  margin: '0 0 8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Current Plan
                </p>
                <p style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '24px',
                  fontWeight: 500,
                  color: 'white',
                  margin: 0
                }}>
                  Brokerage Plan
                </p>
              </div>

              <div>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.5)',
                  margin: '0 0 8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Seats Used
                </p>
                <p style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '24px',
                  fontWeight: 500,
                  color: ACCENT,
                  margin: 0
                }}>
                  {totalAgents} / {user?.brokerage_seats || totalAgents}
                </p>
              </div>

              <div>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.5)',
                  margin: '0 0 8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Next Billing
                </p>
                <p style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '24px',
                  fontWeight: 500,
                  color: 'white',
                  margin: 0
                }}>
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddTeam && (
        <AddTeamModal
          totalSeats={user?.brokerage_seats || 10}
          brokerEmail={user?.email}
          brokerName={user?.full_name}
          brokerageName={user?.brokerage_name}
          employingBrokerNumber={user?.employing_broker_id}
          stripeSubscriptionId={user?.stripe_subscription_id}
          onClose={() => setShowAddTeam(false)}
          onComplete={() => setShowAddTeam(false)}
        />
      )}
    </div>
  );
}