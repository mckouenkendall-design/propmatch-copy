import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Search, Building2, Users, FileText, Calendar, MessageSquare, Megaphone, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ACCENT = '#00DBC5';

const typeIcons = {
  listing:      Building2,
  requirement:  Search,
  user:         Users,
  fish_tank:    Users,
  post:         MessageSquare,
  event:        Calendar,
  resource:     FileText,
  announcement: Megaphone,
};

const typeColors = {
  listing:      ACCENT,
  requirement:  '#818cf8',
  user:         '#f59e0b',
  fish_tank:    '#06b6d4',
  post:         '#10b981',
  event:        '#ef4444',
  resource:     '#6366f1',
  announcement: '#ec4899',
};

export default function GlobalSearch() {
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen]       = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef(null);
  const navigate  = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setIsOpen(false); return; }
    const t = setTimeout(async () => {
      setIsLoading(true);
      setIsOpen(true);
      try {
        const response = await supabase.functions.invoke('aiSearch', { body: { query } });
        setResults(response.data?.results || response.results || []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [query]);

  const handleResultClick = (result) => {
    setIsOpen(false);
    setQuery('');
    setResults([]);

    switch (result.type) {
      case 'listing':
        navigate('/Listings');
        break;
      case 'requirement':
        navigate('/Requirements');
        break;
      case 'user':
        // Navigate to Inbox and signal to open a conversation with this person
        navigate('/Messages', {
          state: {
            startConversationWith: {
              email: result.email,
              full_name: result.title,
              username: result.username,
            },
          },
        });
        break;
      case 'fish_tank':
        navigate(result.id ? `/GroupDetail?id=${result.id}` : '/Groups');
        break;
      case 'post':
        navigate(result.group_id ? `/GroupDetail?id=${result.group_id}` : result.id ? `/GroupDetail?id=${result.id}` : '/Groups');
        break;
      case 'event':
        navigate(result.group_id ? `/GroupDetail?id=${result.group_id}` : '/Groups');
        break;
      case 'resource':
        navigate('/Teams');
        break;
      case 'announcement':
        navigate('/Teams');
        break;
      default:
        navigate('/Dashboard');
    }
  };

  return (
    <div ref={searchRef} style={{ position: 'relative', width: isFocused ? '100%' : '220px', maxWidth: '500px', transition: 'width 0.3s ease' }}>
      <div style={{ position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'rgba(255,255,255,0.5)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={e => {
            setIsFocused(true);
            if (query.trim()) setIsOpen(true);
            e.target.style.borderColor = ACCENT;
            e.target.style.background  = 'rgba(255,255,255,0.08)';
          }}
          onBlur={e => {
            setTimeout(() => setIsFocused(false), 200);
            e.target.style.borderColor = 'rgba(255,255,255,0.1)';
            e.target.style.background  = 'rgba(255,255,255,0.06)';
          }}
          placeholder="Search anything..."
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 40px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '14px', outline: 'none', transition: 'all 0.2s ease' }}
          onMouseEnter={e => { if (!isFocused) e.target.style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={e => { if (!isFocused) e.target.style.background = 'rgba(255,255,255,0.06)'; }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
            <X style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.5)' }} />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: '#1a1f26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 12px 40px rgba(0,0,0,0.4)', maxHeight: '500px', overflowY: 'auto', zIndex: 1000 }}>
          {isLoading ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <Loader2 style={{ width: '28px', height: '28px', color: ACCENT, margin: '0 auto', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginTop: '10px' }}>Searching everywhere...</p>
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <Search style={{ width: '28px', height: '28px', color: 'rgba(255,255,255,0.3)', margin: '0 auto 10px' }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>No results found</p>
            </div>
          ) : (
            <div style={{ padding: '8px' }}>
              {results.map((result, idx) => {
                const Icon  = typeIcons[result.type] || Search;
                const color = typeColors[result.type] || ACCENT;
                return (
                  <button key={idx} onClick={() => handleResultClick(result)}
                    style={{ width: '100%', padding: '12px', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '4px' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon style={{ width: '18px', height: '18px', color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {result.title}
                        </h4>
                        <span style={{ fontSize: '11px', padding: '2px 8px', background: `${color}15`, color, borderRadius: '4px', textTransform: 'uppercase', fontWeight: 500, flexShrink: 0 }}>
                          {result.type.replace('_', ' ')}
                        </span>
                      </div>
                      {result.subtitle && (
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.subtitle}
                        </p>
                      )}
                      {result.match_reason && (
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0, fontStyle: 'italic' }}>
                          {result.match_reason}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}