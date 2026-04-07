import { supabase, uploadFile } from '@/api/supabaseClient';
import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Image, Paperclip, BarChart2, Calendar, Loader2, X, Send, ChevronDown, ChevronUp } from 'lucide-react';
import CommentSection from '@/components/groups/CommentSection';
import { format } from 'date-fns';
import GroupEventModal from './GroupEventModal';

const ACCENT = '#00DBC5';
const DARK_BG = 'rgba(255,255,255,0.04)';
const DARK_BORDER = '1px solid rgba(255,255,255,0.08)';
const EMOJIS = ['👍','❤️','🔥','😂','🙌','💯'];

// ─── Reaction Bar ─────────────────────────────────────────────────────────────
function ReactionBar({ post, currentUser, onReact }) {
  const counts = (() => { try { return JSON.parse(post.reaction_counts || '{}'); } catch { return {}; } })();
  const totalReactions = Object.values(counts).reduce((s, arr) => s + (arr?.length || 0), 0);

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'4px', flexWrap:'wrap' }}>
      {EMOJIS.map(emoji => {
        const reactors = counts[emoji] || [];
        const hasReacted = reactors.includes(currentUser?.email);
        return (
          <button key={emoji} onClick={() => onReact(emoji)}
            style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 8px', borderRadius:'20px', border:`1px solid ${hasReacted?ACCENT+'50':'rgba(255,255,255,0.1)'}`, background:hasReacted?`${ACCENT}15`:'rgba(255,255,255,0.04)', cursor:'pointer', transition:'all 0.15s', fontSize:'13px' }}
            onMouseEnter={e => { e.currentTarget.style.background=`${ACCENT}12`; }}
            onMouseLeave={e => { e.currentTarget.style.background=hasReacted?`${ACCENT}15`:'rgba(255,255,255,0.04)'; }}>
            <span>{emoji}</span>
            {reactors.length > 0 && <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:600, color:hasReacted?ACCENT:'rgba(255,255,255,0.5)' }}>{reactors.length}</span>}
          </button>
        );
      })}
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────
export default function GroupDiscussion({ groupId, currentUser }) {
  const [postText, setPostText] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [attachFiles, setAttachFiles] = useState([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const mediaInputRef = useRef();
  const fileInputRef = useRef();
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['group-posts', groupId],
    queryFn: () => supabase.from('group_posts').select('*').eq('group_id', groupId).order('created_at', { ascending: false }),
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['all-user-profiles'],
    queryFn: () => supabase.from('user_profiles').select('*'),
  });
  const profileMap = Object.fromEntries(userProfiles.map(p => [p.user_email, p]));

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const mediaUrls = [], fileUrls = [], fileNames = [];
      for (const file of mediaFiles) {
        setUploadingMedia(true);
        const { file_url } = await uploadFile(file);
        mediaUrls.push(file_url);
      }
      for (const file of attachFiles) {
        setUploadingMedia(true);
        const { file_url } = await uploadFile(file);
        fileUrls.push(file_url); fileNames.push(file.name);
      }
      setUploadingMedia(false);
      const postData = {
        group_id: groupId,
        author_email: currentUser?.email || '',
        author_name: currentUser?.full_name || 'Anonymous',
        content: postText,
        post_type: showPoll ? 'poll' : 'text',
        media_urls: mediaUrls, file_urls: fileUrls, file_names: fileNames,
        comment_count: 0, reaction_counts: '{}',
      };
      if (showPoll && pollQuestion) {
        const opts = pollOptions.filter(o => o.trim());
        postData.poll_question = pollQuestion;
        postData.poll_options = JSON.stringify(opts);
        postData.poll_votes = JSON.stringify(Object.fromEntries(opts.map((_,i) => [i, []])));
      }
      return supabase.from('group_posts').insert(postData).select();
    },
    onSuccess: () => {
      setPostText(''); setMediaFiles([]); setAttachFiles([]);
      setShowPoll(false); setPollQuestion(''); setPollOptions(['', '']);
      setIsComposerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ post, optionIndex }) => {
      const votes = (() => { try { return JSON.parse(post.poll_votes || '{}'); } catch { return {}; } })();
      Object.keys(votes).forEach(key => { votes[key] = (votes[key] || []).filter(e => e !== currentUser?.email); });
      if (!votes[optionIndex]) votes[optionIndex] = [];
      votes[optionIndex].push(currentUser?.email);
      return supabase.from('group_posts').update({ poll_votes: JSON.stringify(votes) }).eq('id', post.id).select();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] }),
  });

  const reactMutation = useMutation({
    mutationFn: async ({ post, emoji }) => {
      const counts = (() => { try { return JSON.parse(post.reaction_counts || '{}'); } catch { return {}; } })();
      if (!counts[emoji]) counts[emoji] = [];
      const already = counts[emoji].includes(currentUser?.email);
      if (already) {
        counts[emoji] = counts[emoji].filter(e => e !== currentUser?.email);
      } else {
        counts[emoji] = [...counts[emoji], currentUser?.email];
      }
      return supabase.from('group_posts').update({ reaction_counts: JSON.stringify(counts) }).eq('id', post.id).select();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] }),
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId) => supabase.from('group_posts').delete().eq('id', postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] }),
  });

  const handleMediaChange = (e) => setMediaFiles(prev => [...prev, ...Array.from(e.target.files)]);
  const handleFileChange  = (e) => setAttachFiles(prev => [...prev, ...Array.from(e.target.files)]);
  const canPost = postText.trim() || mediaFiles.length > 0 || attachFiles.length > 0 ||
    (showPoll && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2);

  const currentUserProfile = profileMap[currentUser?.email];
  const currentUserPhoto = currentUserProfile?.profile_photo_url;
  const currentUserInitial = (currentUser?.full_name || currentUser?.email || 'U')[0]?.toUpperCase();

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
      {/* Composer */}
      {!isComposerOpen ? (
        <div onClick={() => setIsComposerOpen(true)}
          style={{ background:DARK_BG, border:DARK_BORDER, borderRadius:'12px', padding:'16px', display:'flex', alignItems:'center', gap:'12px', cursor:'text' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:ACCENT, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden', color:'#111827', fontSize:'14px', fontWeight:700 }}>
            {currentUserPhoto ? <img src={currentUserPhoto} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : currentUserInitial}
          </div>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.35)', margin:0 }}>Write something to the group...</p>
        </div>
      ) : (
        <div style={{ background:DARK_BG, border:DARK_BORDER, borderRadius:'12px', overflow:'hidden' }}>
          <div style={{ padding:'16px', borderBottom:DARK_BORDER, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <h3 style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:600, color:'white', margin:0 }}>Create a Post</h3>
            <button onClick={() => setIsComposerOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', borderRadius:'4px' }}>
              <X style={{ width:'16px', height:'16px', color:'rgba(255,255,255,0.5)' }}/>
            </button>
          </div>
          <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
            <textarea autoFocus value={postText} onChange={e => setPostText(e.target.value)}
              placeholder={showPoll ? "Add context for your poll..." : "What's on your mind?"}
              rows={4} style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:DARK_BORDER, borderRadius:'8px', padding:'12px', color:'white', fontFamily:"'Inter',sans-serif", fontSize:'14px', resize:'none', outline:'none', boxSizing:'border-box' }}/>
            {showPoll && (
              <div style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'8px', padding:'12px', display:'flex', flexDirection:'column', gap:'8px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <p style={{ fontSize:'12px', fontWeight:600, color:'#a5b4fc', margin:0 }}>Poll</p>
                  <button onClick={() => setShowPoll(false)} style={{ background:'none', border:'none', cursor:'pointer' }}><X style={{ width:'14px', height:'14px', color:'#a5b4fc' }}/></button>
                </div>
                <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="Ask a question..."
                  style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:'6px', padding:'8px 12px', color:'white', fontSize:'13px', outline:'none', width:'100%', boxSizing:'border-box' }}/>
                {pollOptions.map((opt, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <input value={opt} onChange={e => setPollOptions(prev => prev.map((o, idx) => idx===i?e.target.value:o))} placeholder={`Option ${i+1}`}
                      style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:'6px', padding:'8px 12px', color:'white', fontSize:'13px', outline:'none' }}/>
                    {pollOptions.length > 2 && (
                      <button onClick={() => setPollOptions(prev => prev.filter((_,idx) => idx!==i))} style={{ background:'none', border:'none', cursor:'pointer' }}><X style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.4)' }}/></button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 5 && (
                  <button onClick={() => setPollOptions(prev => [...prev, ''])} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'12px', color:'#a5b4fc', textAlign:'left', padding:0 }}>+ Add option</button>
                )}
              </div>
            )}
            {mediaFiles.length > 0 && (
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {mediaFiles.map((f, i) => (
                  <div key={i} style={{ position:'relative' }}>
                    <img src={URL.createObjectURL(f)} alt="" style={{ width:'64px', height:'64px', borderRadius:'8px', objectFit:'cover' }}/>
                    <button onClick={() => setMediaFiles(prev => prev.filter((_,idx) => idx!==i))}
                      style={{ position:'absolute', top:'-4px', right:'-4px', background:'#374151', color:'white', border:'none', borderRadius:'50%', width:'18px', height:'18px', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}
            {attachFiles.length > 0 && (
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {attachFiles.map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.08)', borderRadius:'6px', padding:'4px 10px' }}>
                    <Paperclip style={{ width:'12px', height:'12px', color:'rgba(255,255,255,0.5)' }}/>
                    <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)', maxWidth:'120px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                    <button onClick={() => setAttachFiles(prev => prev.filter((_,idx) => idx!==i))} style={{ background:'none', border:'none', cursor:'pointer' }}><X style={{ width:'12px', height:'12px', color:'rgba(255,255,255,0.4)' }}/></button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ border:DARK_BORDER, borderRadius:'8px', padding:'10px' }}>
              <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:'0 0 8px', fontWeight:500 }}>Add to your post</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                <input type="file" ref={mediaInputRef} style={{ display:'none' }} accept="image/*,video/*" multiple onChange={handleMediaChange}/>
                <input type="file" ref={fileInputRef} style={{ display:'none' }} multiple onChange={handleFileChange}/>
                <ActionButton icon={<Image style={{ width:'14px', height:'14px' }}/>} label="Photo/Video" color="#4caf50" onClick={() => mediaInputRef.current.click()}/>
                <ActionButton icon={<Paperclip style={{ width:'14px', height:'14px' }}/>} label="File" color="#ff9800" onClick={() => fileInputRef.current.click()}/>
                <ActionButton icon={<BarChart2 style={{ width:'14px', height:'14px' }}/>} label="Poll" color="#9c27b0" onClick={() => setShowPoll(!showPoll)} active={showPoll}/>
                <ActionButton icon={<Calendar style={{ width:'14px', height:'14px' }}/>} label="Create Event" color="#2196f3" onClick={() => setShowEventModal(true)}/>
              </div>
            </div>
          </div>
          <div style={{ padding:'0 16px 16px', display:'flex', justifyContent:'flex-end' }}>
            <Button onClick={() => createPostMutation.mutate()} disabled={!canPost || createPostMutation.isPending || uploadingMedia}
              style={{ background:ACCENT, color:'#111827', display:'flex', alignItems:'center', gap:'8px' }}>
              {(createPostMutation.isPending || uploadingMedia) ? <Loader2 style={{ width:'16px', height:'16px', animation:'spin 1s linear infinite' }}/> : <Send style={{ width:'16px', height:'16px' }}/>}
              Post
            </Button>
          </div>
        </div>
      )}

      {/* Post list */}
      {isLoading ? (
        <div style={{ textAlign:'center', padding:'32px', color:'rgba(255,255,255,0.4)', fontFamily:"'Inter',sans-serif" }}>Loading posts...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px', background:DARK_BG, border:DARK_BORDER, borderRadius:'12px' }}>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.35)', margin:0 }}>No posts yet. Start the conversation!</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {posts.map(post => (
            <DiscussionPostCard key={post.id} post={post} currentUser={currentUser} authorProfile={profileMap[post.author_email]}
              profileMap={profileMap} groupId={groupId}
              onDelete={() => deletePostMutation.mutate(post.id)}
              onVote={(optionIndex) => voteMutation.mutate({ post, optionIndex })}
              onReact={(emoji) => reactMutation.mutate({ post, emoji })}/>
          ))}
        </div>
      )}

      {showEventModal && (
        <GroupEventModal groupId={groupId} onClose={() => setShowEventModal(false)}
          onSuccess={() => { setShowEventModal(false); queryClient.invalidateQueries({ queryKey:['group-events', groupId] }); }}/>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ActionButton({ icon, label, color, onClick, active }) {
  return (
    <button type="button" onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:500, cursor:'pointer', background:active?`${color}20`:'rgba(255,255,255,0.06)', color:active?color:'rgba(255,255,255,0.5)', border:active?`1px solid ${color}40`:'1px solid transparent', transition:'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.background=`${color}15`; e.currentTarget.style.color=color; }}
      onMouseLeave={e => { e.currentTarget.style.background=active?`${color}20`:'rgba(255,255,255,0.06)'; e.currentTarget.style.color=active?color:'rgba(255,255,255,0.5)'; }}>
      {icon} {label}
    </button>
  );
}

function DiscussionPostCard({ post, currentUser, authorProfile, profileMap, groupId, onDelete, onVote, onReact }) {
  const [showFull, setShowFull] = useState(false);
  const isAuthor = post.author_email === currentUser?.email;
  const pollOptions = (() => { try { return post.poll_options ? JSON.parse(post.poll_options) : []; } catch { return []; } })();
  const pollVotes = (() => { try { return post.poll_votes ? JSON.parse(post.poll_votes) : {}; } catch { return {}; } })();
  const totalVotes = Object.values(pollVotes).reduce((acc, arr) => acc + (arr?.length || 0), 0);
  const userVoted = Object.entries(pollVotes).find(([, voters]) => voters?.includes(currentUser?.email));
  const isLong = post.content?.length > 200;
  const displayContent = isLong && !showFull ? post.content.slice(0,200)+'...' : post.content;

  const photoUrl = authorProfile?.profile_photo_url;
  const displayName = authorProfile?.full_name || post.author_name || 'Member';
  const initial = displayName[0]?.toUpperCase() || '?';

  return (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', overflow:'hidden' }}>
      <div style={{ padding:'16px' }}>
        {/* Author + delete */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#00DBC5', display:'flex', alignItems:'center', justifyContent:'center', color:'#111827', fontSize:'13px', fontWeight:700, flexShrink:0, overflow:'hidden' }}>
              {photoUrl ? <img src={photoUrl} alt={displayName} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : initial}
            </div>
            <div>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:600, color:'white', margin:0 }}>{displayName}</p>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)', margin:0 }}>{format(new Date(post.created_date), 'MMM d, yyyy · h:mm a')}</p>
            </div>
          </div>
          {isAuthor && (
            <button onClick={onDelete} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'12px', color:'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.color='#EF4444'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.3)'}>Delete</button>
          )}
        </div>

        {/* Content */}
        {post.content && (
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.8)', lineHeight:1.6, whiteSpace:'pre-wrap', margin:'0 0 8px' }}>{displayContent}</p>
        )}
        {isLong && (
          <button onClick={() => setShowFull(!showFull)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'12px', color:'#00DBC5', display:'flex', alignItems:'center', gap:'4px', padding:0 }}>
            {showFull ? <><ChevronUp style={{ width:'12px', height:'12px' }}/> Show less</> : <><ChevronDown style={{ width:'12px', height:'12px' }}/> See more</>}
          </button>
        )}

        {/* Media */}
        {post.media_urls?.length > 0 && (
          <div style={{ display:'flex', gap:'8px', marginTop:'12px', flexWrap:'wrap' }}>
            {post.media_urls.map((url,i) => (
              <img key={i} src={url} alt="" style={{ borderRadius:'8px', maxHeight:'192px', objectFit:'cover' }}/>
            ))}
          </div>
        )}

        {/* Files */}
        {post.file_urls?.length > 0 && (
          <div style={{ marginTop:'12px', display:'flex', flexDirection:'column', gap:'6px' }}>
            {post.file_urls.map((url,i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer"
                style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:'#00DBC5', background:'rgba(255,255,255,0.04)', borderRadius:'6px', padding:'6px 12px', textDecoration:'none' }}>
                <Paperclip style={{ width:'14px', height:'14px' }}/>{post.file_names?.[i] || `Attachment ${i+1}`}
              </a>
            ))}
          </div>
        )}

        {/* Poll */}
        {post.post_type === 'poll' && pollOptions.length > 0 && (
          <div style={{ marginTop:'12px', background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'8px', padding:'12px' }}>
            <p style={{ fontSize:'13px', fontWeight:600, color:'#a5b4fc', margin:'0 0 10px' }}>{post.poll_question}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {pollOptions.map((opt, i) => {
                const voteCount = pollVotes[i]?.length || 0;
                const pct = totalVotes > 0 ? Math.round((voteCount/totalVotes)*100) : 0;
                const hasVoted = userVoted?.[0] === String(i);
                return (
                  <button key={i} onClick={() => onVote(i)} style={{ width:'100%', textAlign:'left', borderRadius:'8px', overflow:'hidden', border:`1px solid ${hasVoted?'#00DBC5':'rgba(99,102,241,0.3)'}`, background:'none', cursor:'pointer', position:'relative' }}>
                    <div style={{ position:'absolute', inset:0, width:`${pct}%`, background:hasVoted?'rgba(0,219,197,0.2)':'rgba(99,102,241,0.1)', borderRadius:'8px' }}/>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', position:'relative' }}>
                      <span style={{ fontSize:'13px', fontWeight:500, color:'rgba(255,255,255,0.8)' }}>{opt}</span>
                      <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>{pct}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', margin:'8px 0 0' }}>{totalVotes} {totalVotes===1?'vote':'votes'}</p>
          </div>
        )}

        {/* Reactions */}
        <div style={{ marginTop:'12px', marginBottom:'4px' }}>
          <ReactionBar post={post} currentUser={currentUser} onReact={onReact}/>
        </div>

        {/* Comments */}
        <CommentSection postId={post.id} postType="group_post" groupId={groupId} currentUser={currentUser} profileMap={profileMap} postAuthorEmail={post.author_email}/>
      </div>
    </div>
  );
}