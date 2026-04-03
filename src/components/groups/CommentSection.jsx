import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, MessageSquare, ChevronDown, ChevronUp, Paperclip, X, File } from 'lucide-react';

const ACCENT = '#00DBC5';

function timeAgo(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Avatar({ profile, name, size = 28 }) {
  const initial = (profile?.full_name || name || '?')[0].toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:ACCENT, flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'#111827', fontSize:size*0.38, fontWeight:700 }}>
      {profile?.profile_photo_url
        ? <img src={profile.profile_photo_url} alt={initial} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
        : initial}
    </div>
  );
}

function CommentComposer({ onSubmit, placeholder = 'Write a comment...', autoFocus = false }) {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'file';
    setAttachment({ file, type, name: file.name, preview: type === 'image' ? URL.createObjectURL(file) : null });
    e.target.value = '';
  };

  const handleSend = async () => {
    if (!text.trim() && !attachment) return;
    setUploading(true);
    let url = null, aType = null, aName = null;
    if (attachment) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: attachment.file });
        url = file_url; aType = attachment.type; aName = attachment.name;
      } catch (e) { console.error('Upload failed:', e); }
    }
    await onSubmit({ content: text.trim(), attachmentUrl: url, attachmentType: aType, attachmentName: aName });
    setText(''); setAttachment(null); setUploading(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      {attachment && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px' }}>
          {attachment.preview
            ? <img src={attachment.preview} alt="" style={{ width:'32px', height:'32px', borderRadius:'5px', objectFit:'cover' }}/>
            : <File style={{ width:'14px', height:'14px', color:ACCENT, flexShrink:0 }}/>}
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.7)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{attachment.name}</span>
          <button onClick={() => setAttachment(null)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:0 }}>
            <X style={{ width:'12px', height:'12px', color:'rgba(255,255,255,0.4)' }}/>
          </button>
        </div>
      )}
      <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
        <input ref={fileRef} type="file" style={{ display:'none' }} onChange={handleFile}
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx"/>
        <button onClick={() => fileRef.current?.click()}
          style={{ width:'28px', height:'28px', borderRadius:'7px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Paperclip style={{ width:'12px', height:'12px', color:'rgba(255,255,255,0.45)' }}/>
        </button>
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && (text.trim() || attachment)) { e.preventDefault(); handleSend(); } }}
          placeholder={placeholder} autoFocus={autoFocus}
          style={{ flex:1, padding:'7px 12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'white', outline:'none' }}/>
        <button onClick={handleSend} disabled={(!text.trim() && !attachment) || uploading}
          style={{ width:'30px', height:'30px', borderRadius:'50%', background:(text.trim()||attachment)&&!uploading?ACCENT:'rgba(255,255,255,0.08)', border:'none', cursor:(text.trim()||attachment)&&!uploading?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
          {uploading
            ? <div style={{ width:'11px', height:'11px', border:'2px solid #111827', borderTopColor:'transparent', borderRadius:'50%', animation:'cspin 0.8s linear infinite' }}/>
            : <Send style={{ width:'12px', height:'12px', color:(text.trim()||attachment)?'#111827':'rgba(255,255,255,0.3)' }}/>}
        </button>
      </div>
    </div>
  );
}

function CommentBubble({ comment, profileMap, currentUser, postId, groupId, postType, allComments, queryClient }) {
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const replies = allComments.filter(c => c.parent_comment_id === comment.id);
  const profile = profileMap?.[comment.author_email];
  const isMe = comment.author_email === currentUser?.email;

  const deleteComment = useMutation({
    mutationFn: (id) => base44.entities.GroupComment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
  });

  const addReply = useMutation({
    mutationFn: ({ content, attachmentUrl, attachmentType, attachmentName }) =>
      base44.entities.GroupComment.create({
        post_id: postId, post_type: postType, group_id: groupId,
        author_email: currentUser?.email || '',
        author_name: currentUser?.full_name || currentUser?.email || 'Member',
        content, parent_comment_id: comment.id,
        ...(attachmentUrl && { attachment_url: attachmentUrl, attachment_type: attachmentType, attachment_name: attachmentName }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      setShowReplyBox(false);
      setShowReplies(true);
    },
  });

  return (
    <div style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
      <Avatar profile={profile} name={comment.author_name} size={28}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', padding:'8px 12px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'3px' }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:600, color:'white' }}>
              {profile?.full_name || comment.author_name || 'Member'}
            </span>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.28)' }}>{timeAgo(comment.created_date)}</span>
              {isMe && (
                <button onClick={() => deleteComment.mutate(comment.id)}
                  style={{ background:'transparent', border:'none', cursor:'pointer', padding:0, fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.2)' }}
                  onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.2)'}>Delete</button>
              )}
            </div>
          </div>
          {comment.content && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.8)', margin:0, lineHeight:1.5 }}>{comment.content}</p>}
          {comment.attachment_url && (
            <div style={{ marginTop:'6px' }}>
              {comment.attachment_type === 'image'
                ? <img src={comment.attachment_url} alt="" style={{ maxWidth:'200px', maxHeight:'140px', borderRadius:'6px', objectFit:'cover', cursor:'pointer', display:'block' }} onClick={() => window.open(comment.attachment_url, '_blank')}/>
                : <a href={comment.attachment_url} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:ACCENT, textDecoration:'none', padding:'5px 10px', background:'rgba(0,219,197,0.08)', borderRadius:'6px', width:'fit-content', marginTop:'4px' }}>
                    <Paperclip style={{ width:'12px', height:'12px' }}/>{comment.attachment_name || 'Attachment'}
                  </a>}
            </div>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginTop:'4px', paddingLeft:'4px' }}>
          <button onClick={() => setShowReplyBox(!showReplyBox)}
            style={{ background:'transparent', border:'none', cursor:'pointer', fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)', padding:0 }}
            onMouseEnter={e => e.currentTarget.style.color=ACCENT}
            onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.35)'}>Reply</button>
          {replies.length > 0 && (
            <button onClick={() => setShowReplies(!showReplies)}
              style={{ display:'flex', alignItems:'center', gap:'3px', background:'transparent', border:'none', cursor:'pointer', fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)', padding:0 }}
              onMouseEnter={e => e.currentTarget.style.color=ACCENT}
              onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.35)'}>
              {showReplies ? <ChevronUp style={{ width:'10px', height:'10px' }}/> : <ChevronDown style={{ width:'10px', height:'10px' }}/>}
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
        {showReplyBox && (
          <div style={{ marginTop:'6px' }}>
            <CommentComposer autoFocus placeholder={`Reply to ${profile?.full_name || comment.author_name}...`}
              onSubmit={async (data) => addReply.mutateAsync(data)}/>
          </div>
        )}
        {showReplies && replies.length > 0 && (
          <div style={{ marginTop:'8px', paddingLeft:'12px', borderLeft:'2px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', gap:'8px' }}>
            {replies.map(reply => {
              const rp = profileMap?.[reply.author_email];
              const rMe = reply.author_email === currentUser?.email;
              return (
                <div key={reply.id} style={{ display:'flex', gap:'7px', alignItems:'flex-start' }}>
                  <Avatar profile={rp} name={reply.author_name} size={24}/>
                  <div style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'8px', padding:'6px 10px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2px' }}>
                      <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:600, color:'white' }}>{rp?.full_name || reply.author_name}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.28)' }}>{timeAgo(reply.created_date)}</span>
                        {rMe && <button onClick={() => deleteComment.mutate(reply.id)}
                          style={{ background:'transparent', border:'none', cursor:'pointer', padding:0, fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.2)' }}
                          onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.2)'}>Delete</button>}
                      </div>
                    </div>
                    {reply.content && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.75)', margin:0, lineHeight:1.5 }}>{reply.content}</p>}
                    {reply.attachment_url && (
                      reply.attachment_type === 'image'
                        ? <img src={reply.attachment_url} alt="" style={{ maxWidth:'160px', borderRadius:'5px', objectFit:'cover', cursor:'pointer', marginTop:'4px', display:'block' }} onClick={() => window.open(reply.attachment_url, '_blank')}/>
                        : <a href={reply.attachment_url} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:ACCENT, textDecoration:'none', marginTop:'4px' }}>
                            <Paperclip style={{ width:'10px', height:'10px' }}/>{reply.attachment_name || 'Attachment'}
                          </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({ postId, postType = 'group_post', groupId, currentUser, profileMap }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const { data: allComments = [], isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => base44.entities.GroupComment
      .filter({ post_id: postId })
      .then(r => r.sort((a,b) => new Date(a.created_date) - new Date(b.created_date))),
    enabled: expanded,
    refetchInterval: expanded ? 10000 : false,
  });

  const topLevel = allComments.filter(c => !c.parent_comment_id);

  const addComment = useMutation({
    mutationFn: ({ content, attachmentUrl, attachmentType, attachmentName }) =>
      base44.entities.GroupComment.create({
        post_id: postId, post_type: postType, group_id: groupId,
        author_email: currentUser?.email || '',
        author_name: currentUser?.full_name || currentUser?.email || 'Member',
        content,
        ...(attachmentUrl && { attachment_url: attachmentUrl, attachment_type: attachmentType, attachment_name: attachmentName }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
  });

  const label = !expanded
    ? (allComments.length > 0 ? `${allComments.length} comment${allComments.length !== 1 ? 's' : ''}` : 'Comment')
    : 'Hide comments';

  return (
    <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'10px', marginTop:'4px' }}>
      <button onClick={() => setExpanded(!expanded)}
        style={{ display:'flex', alignItems:'center', gap:'6px', background:'transparent', border:'none', cursor:'pointer', padding:'4px 0', color:'rgba(255,255,255,0.4)' }}
        onMouseEnter={e => e.currentTarget.style.color=ACCENT}
        onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.4)'}>
        <MessageSquare style={{ width:'13px', height:'13px' }}/>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:500 }}>{label}</span>
        {expanded ? <ChevronUp style={{ width:'11px', height:'11px' }}/> : <ChevronDown style={{ width:'11px', height:'11px' }}/>}
      </button>

      {expanded && (
        <div style={{ marginTop:'10px', display:'flex', flexDirection:'column', gap:'10px' }}>
          {isLoading ? (
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.3)', margin:0 }}>Loading...</p>
          ) : topLevel.length === 0 ? (
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.25)', margin:0 }}>No comments yet.</p>
          ) : topLevel.map(comment => (
            <CommentBubble key={comment.id} comment={comment} profileMap={profileMap}
              currentUser={currentUser} postId={postId} groupId={groupId} postType={postType}
              allComments={allComments} queryClient={queryClient}/>
          ))}
          <div style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
            <Avatar profile={profileMap?.[currentUser?.email]} name={currentUser?.full_name || 'Me'} size={28}/>
            <div style={{ flex:1 }}>
              <CommentComposer placeholder="Write a comment..."
                onSubmit={async (data) => addComment.mutateAsync(data)}/>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes cspin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}