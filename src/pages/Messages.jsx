import React, { useState } from 'react';
import { Search, Send, Paperclip, Phone, Video, MoreVertical, Building2, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ACCENT = '#00DBC5';

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');

  // Mock conversations
  const mockConversations = [
    {
      id: 1,
      name: 'Sarah Johnson',
      lastMessage: 'Looking forward to the showing tomorrow!',
      time: '2m ago',
      unread: 2,
      avatar: 'SJ',
      context: 'Industrial Property - Detroit'
    },
    {
      id: 2,
      name: 'Mike Chen',
      lastMessage: 'Can we schedule a call to discuss the offer?',
      time: '1h ago',
      unread: 0,
      avatar: 'MC',
      context: 'Office Space - Ann Arbor'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      lastMessage: 'Thanks for the property details',
      time: '3h ago',
      unread: 0,
      avatar: 'ER',
      context: 'Retail Space - Grand Rapids'
    },
  ];

  const mockMessages = selectedConversation ? [
    {
      id: 1,
      sender: 'them',
      text: 'Hi! I saw your listing for the industrial property in Detroit. Is it still available?',
      time: '10:30 AM'
    },
    {
      id: 2,
      sender: 'me',
      text: 'Yes, it is! Would you like to schedule a showing?',
      time: '10:32 AM'
    },
    {
      id: 3,
      sender: 'them',
      text: 'That would be great. How about tomorrow at 2 PM?',
      time: '10:35 AM'
    },
    {
      id: 4,
      sender: 'me',
      text: 'Tomorrow at 2 PM works perfectly. I\'ll send you the address and details.',
      time: '10:36 AM'
    },
    {
      id: 5,
      sender: 'them',
      text: 'Looking forward to the showing tomorrow!',
      time: '10:38 AM'
    },
  ] : [];

  return (
    <div style={{ 
      maxWidth: '1600px', 
      margin: '0 auto', 
      padding: '0', 
      height: 'calc(100vh - 64px)',
      display: 'flex',
      background: '#0E1318'
    }}>
      {/* Conversations Sidebar */}
      <div style={{
        width: '360px',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.02)'
      }}>
        {/* Search Header */}
        <div style={{ padding: '24px 20px 16px' }}>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '24px',
            fontWeight: 500,
            color: 'white',
            margin: '0 0 16px'
          }}>
            Messages
          </h2>
          
          <div style={{
            position: 'relative',
            width: '100%'
          }}>
            <Search style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: 'rgba(255,255,255,0.4)'
            }} />
            <input
              type="text"
              placeholder="Search conversations..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {mockConversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                cursor: 'pointer',
                background: selectedConversation?.id === conv.id ? 'rgba(0,219,197,0.08)' : 'transparent',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                if (selectedConversation?.id !== conv.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }
              }}
              onMouseLeave={e => {
                if (selectedConversation?.id !== conv.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
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
                  color: '#111827',
                  flexShrink: 0
                }}>
                  {conv.avatar}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '15px',
                      fontWeight: 500,
                      color: 'white'
                    }}>
                      {conv.name}
                    </span>
                    <span style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.4)'
                    }}>
                      {conv.time}
                    </span>
                  </div>

                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px',
                    color: conv.unread > 0 ? ACCENT : 'rgba(255,255,255,0.5)',
                    margin: '0 0 6px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: conv.unread > 0 ? 500 : 400
                  }}>
                    {conv.lastMessage}
                  </p>

                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.3)'
                  }}>
                    {conv.context}
                  </span>

                  {conv.unread > 0 && (
                    <div style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      padding: '2px 8px',
                      background: ACCENT,
                      borderRadius: '10px',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#111827'
                    }}>
                      {conv.unread} new
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div style={{
              padding: '20px 32px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div>
                <h3 style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '18px',
                  fontWeight: 500,
                  color: 'white',
                  margin: '0 0 4px'
                }}>
                  {selectedConversation.name}
                </h3>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.5)',
                  margin: 0
                }}>
                  Connected via: {selectedConversation.context}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{
                  padding: '10px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer'
                }}>
                  <Phone style={{ width: '18px', height: '18px' }} />
                </button>
                <button style={{
                  padding: '10px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer'
                }}>
                  <Video style={{ width: '18px', height: '18px' }} />
                </button>
                <button style={{
                  padding: '10px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer'
                }}>
                  <MoreVertical style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
              {mockMessages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{
                    maxWidth: '60%',
                    padding: '12px 16px',
                    background: msg.sender === 'me' ? ACCENT : 'rgba(255,255,255,0.06)',
                    color: msg.sender === 'me' ? '#111827' : 'white',
                    borderRadius: '12px',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    lineHeight: 1.5
                  }}>
                    <p style={{ margin: '0 0 6px' }}>{msg.text}</p>
                    <span style={{
                      fontSize: '11px',
                      opacity: 0.7
                    }}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div style={{
              padding: '20px 32px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button style={{
                  padding: '10px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer'
                }}>
                  <Paperclip style={{ width: '18px', height: '18px' }} />
                </button>

                <input
                  type="text"
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />

                <button style={{
                  padding: '12px 20px',
                  background: ACCENT,
                  border: 'none',
                  borderRadius: '8px',
                  color: '#111827',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  <Send style={{ width: '16px', height: '16px' }} />
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(0,219,197,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Send style={{ width: '36px', height: '36px', color: ACCENT }} />
            </div>
            <h3 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '24px',
              fontWeight: 500,
              color: 'white',
              margin: 0
            }}>
              Select a conversation
            </h3>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              color: 'rgba(255,255,255,0.5)',
              margin: 0
            }}>
              Choose a conversation from the sidebar to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}