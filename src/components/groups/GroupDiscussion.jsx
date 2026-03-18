import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Image, Paperclip, BarChart2, Calendar, Loader2, X, Send, ChevronDown, ChevronUp, User } from 'lucide-react';
import { format } from 'date-fns';
import GroupEventModal from './GroupEventModal';

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
    queryFn: () => base44.entities.GroupPost.filter({ group_id: groupId }, '-created_date'),
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const mediaUrls = [];
      const fileUrls = [];
      const fileNames = [];

      // Upload media
      for (const file of mediaFiles) {
        setUploadingMedia(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        mediaUrls.push(file_url);
      }
      // Upload attachments
      for (const file of attachFiles) {
        setUploadingMedia(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        fileUrls.push(file_url);
        fileNames.push(file.name);
      }
      setUploadingMedia(false);

      const postData = {
        group_id: groupId,
        author_email: currentUser?.email || '',
        author_name: currentUser?.full_name || 'Anonymous',
        content: postText,
        post_type: showPoll ? 'poll' : 'text',
        media_urls: mediaUrls,
        file_urls: fileUrls,
        file_names: fileNames,
        comment_count: 0,
      };

      if (showPoll && pollQuestion) {
        const opts = pollOptions.filter(o => o.trim());
        postData.poll_question = pollQuestion;
        postData.poll_options = JSON.stringify(opts);
        postData.poll_votes = JSON.stringify(Object.fromEntries(opts.map((_, i) => [i, []])));
      }

      return base44.entities.GroupPost.create(postData);
    },
    onSuccess: () => {
      setPostText('');
      setMediaFiles([]);
      setAttachFiles([]);
      setShowPoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setIsComposerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ post, optionIndex }) => {
      const votes = JSON.parse(post.poll_votes || '{}');
      // Remove user from all options first
      Object.keys(votes).forEach(key => {
        votes[key] = (votes[key] || []).filter(e => e !== currentUser?.email);
      });
      // Add vote
      if (!votes[optionIndex]) votes[optionIndex] = [];
      votes[optionIndex].push(currentUser?.email);
      return base44.entities.GroupPost.update(post.id, { poll_votes: JSON.stringify(votes) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] }),
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId) => base44.entities.GroupPost.delete(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] }),
  });

  const handleMediaChange = (e) => {
    setMediaFiles(prev => [...prev, ...Array.from(e.target.files)]);
  };
  const handleFileChange = (e) => {
    setAttachFiles(prev => [...prev, ...Array.from(e.target.files)]);
  };

  const canPost = postText.trim() || mediaFiles.length > 0 || attachFiles.length > 0 ||
    (showPoll && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2);

  return (
    <div className="space-y-4">
      {/* Composer Trigger / Box */}
      {!isComposerOpen ? (
        <div
          onClick={() => setIsComposerOpen(true)}
          className="bg-white rounded-xl shadow-md p-4 flex items-center gap-3 cursor-text hover:shadow-lg transition-all"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#e6f7f5' }}
          >
            <User className="w-4 h-4" style={{ color: 'var(--tiffany-blue)' }} />
          </div>
          <p className="text-gray-400 text-sm">Write something to the group...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Create a Post</h3>
            <button onClick={() => setIsComposerOpen(false)} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <textarea
              autoFocus
              value={postText}
              onChange={e => setPostText(e.target.value)}
              placeholder={showPoll ? "Add context for your poll..." : "What's on your mind? Ask a question, share an update, make an announcement..."}
              rows={4}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
              style={{ '--tw-ring-color': 'var(--tiffany-blue)' }}
            />

            {/* Poll Builder */}
            {showPoll && (
              <div className="bg-indigo-50 rounded-lg p-3 space-y-2 border border-indigo-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-indigo-700">Poll</p>
                  <button onClick={() => setShowPoll(false)} className="p-0.5 hover:bg-indigo-100 rounded">
                    <X className="w-3.5 h-3.5 text-indigo-500" />
                  </button>
                </div>
                <input
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full text-sm border border-indigo-200 rounded px-3 py-1.5 bg-white focus:outline-none"
                />
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={opt}
                      onChange={e => setPollOptions(prev => prev.map((o, idx) => idx === i ? e.target.value : o))}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 text-sm border border-indigo-200 rounded px-3 py-1.5 bg-white focus:outline-none"
                    />
                    {pollOptions.length > 2 && (
                      <button onClick={() => setPollOptions(prev => prev.filter((_, idx) => idx !== i))}>
                        <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 5 && (
                  <button onClick={() => setPollOptions(prev => [...prev, ''])} className="text-xs text-indigo-600 hover:underline">
                    + Add option
                  </button>
                )}
              </div>
            )}

            {/* Media previews */}
            {mediaFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {mediaFiles.map((f, i) => (
                  <div key={i} className="relative">
                    <img src={URL.createObjectURL(f)} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    <button onClick={() => setMediaFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 bg-gray-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {attachFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {attachFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-gray-100 rounded px-2 py-1">
                    <Paperclip className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-700 max-w-[120px] truncate">{f.name}</span>
                    <button onClick={() => setAttachFiles(prev => prev.filter((_, idx) => idx !== i))}>
                      <X className="w-3 h-3 text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add to post actions */}
            <div className="border border-gray-200 rounded-lg p-2.5">
              <p className="text-xs text-gray-500 mb-2 font-medium">Add to your post</p>
              <div className="flex flex-wrap gap-2">
                <input type="file" ref={mediaInputRef} className="hidden" accept="image/*,video/*" multiple onChange={handleMediaChange} />
                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                <ActionButton icon={<Image className="w-4 h-4" />} label="Photo/Video" color="#4caf50" onClick={() => mediaInputRef.current.click()} />
                <ActionButton icon={<Paperclip className="w-4 h-4" />} label="File" color="#ff9800" onClick={() => fileInputRef.current.click()} />
                <ActionButton icon={<BarChart2 className="w-4 h-4" />} label="Poll" color="#9c27b0" onClick={() => setShowPoll(!showPoll)} active={showPoll} />
                <ActionButton icon={<Calendar className="w-4 h-4" />} label="Create Event" color="#2196f3" onClick={() => setShowEventModal(true)} />
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 flex justify-end">
            <Button
              onClick={() => createPostMutation.mutate()}
              disabled={!canPost || createPostMutation.isPending || uploadingMedia}
              className="text-white gap-2"
              style={{ backgroundColor: 'var(--tiffany-blue)' }}
            >
              {(createPostMutation.isPending || uploadingMedia) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post
            </Button>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl shadow-md">
          <p className="text-gray-400 text-sm">No posts yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <DiscussionPostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onDelete={() => deletePostMutation.mutate(post.id)}
              onVote={(optionIndex) => voteMutation.mutate({ post, optionIndex })}
            />
          ))}
        </div>
      )}

      {showEventModal && (
        <GroupEventModal
          groupId={groupId}
          onClose={() => setShowEventModal(false)}
          onSuccess={() => {
            setShowEventModal(false);
            queryClient.invalidateQueries({ queryKey: ['group-events', groupId] });
          }}
        />
      )}
    </div>
  );
}

function ActionButton({ icon, label, color, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={{
        backgroundColor: active ? `${color}20` : '#f3f4f6',
        color: active ? color : '#6b7280',
        border: active ? `1px solid ${color}40` : '1px solid transparent',
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${color}15`; e.currentTarget.style.color = color; }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = active ? `${color}20` : '#f3f4f6';
        e.currentTarget.style.color = active ? color : '#6b7280';
      }}
    >
      {icon} {label}
    </button>
  );
}

function DiscussionPostCard({ post, currentUser, onDelete, onVote }) {
  const [showFull, setShowFull] = useState(false);
  const isAuthor = post.author_email === currentUser?.email;
  const pollOptions = post.poll_options ? JSON.parse(post.poll_options) : [];
  const pollVotes = post.poll_votes ? JSON.parse(post.poll_votes) : {};
  const totalVotes = Object.values(pollVotes).reduce((acc, arr) => acc + (arr?.length || 0), 0);
  const userVoted = Object.entries(pollVotes).find(([, voters]) => voters?.includes(currentUser?.email));

  const isLong = post.content?.length > 200;
  const displayContent = isLong && !showFull ? post.content.slice(0, 200) + '...' : post.content;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4">
        {/* Author header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: 'var(--tiffany-blue)' }}>
              {post.author_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{post.author_name || 'Member'}</p>
              <p className="text-xs text-gray-400">{format(new Date(post.created_date), 'MMM d, yyyy · h:mm a')}</p>
            </div>
          </div>
          {isAuthor && (
            <button onClick={onDelete} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Delete</button>
          )}
        </div>

        {/* Content */}
        {post.content && (
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-2">{displayContent}</p>
        )}
        {isLong && (
          <button onClick={() => setShowFull(!showFull)} className="text-xs flex items-center gap-1" style={{ color: 'var(--tiffany-blue)' }}>
            {showFull ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> See more</>}
          </button>
        )}

        {/* Media */}
        {post.media_urls?.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {post.media_urls.map((url, i) => (
              <img key={i} src={url} alt="" className="rounded-lg max-h-48 object-cover" />
            ))}
          </div>
        )}

        {/* Files */}
        {post.file_urls?.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {post.file_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-xs text-blue-600 hover:underline bg-gray-50 rounded px-3 py-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                {post.file_names?.[i] || `Attachment ${i + 1}`}
              </a>
            ))}
          </div>
        )}

        {/* Poll */}
        {post.post_type === 'poll' && pollOptions.length > 0 && (
          <div className="mt-3 bg-indigo-50 rounded-lg p-3 border border-indigo-100">
            <p className="text-sm font-semibold text-indigo-900 mb-2">{post.poll_question}</p>
            <div className="space-y-2">
              {pollOptions.map((opt, i) => {
                const voteCount = pollVotes[i]?.length || 0;
                const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                const hasVoted = userVoted?.[0] === String(i);
                return (
                  <button key={i} onClick={() => onVote(i)}
                    className="w-full text-left rounded-lg overflow-hidden border transition-all"
                    style={{ borderColor: hasVoted ? 'var(--tiffany-blue)' : '#e0e7ff' }}>
                    <div className="flex items-center justify-between px-3 py-2 relative">
                      <div className="absolute inset-0 rounded-lg" style={{ width: `${pct}%`, backgroundColor: hasVoted ? '#e6f7f5' : '#eef2ff', zIndex: 0 }} />
                      <span className="relative text-xs font-medium text-gray-800 z-10">{opt}</span>
                      <span className="relative text-xs text-gray-500 z-10">{pct}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</p>
          </div>
        )}
      </div>
    </div>
  );
}