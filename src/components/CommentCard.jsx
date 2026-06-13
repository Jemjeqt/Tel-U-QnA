import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/formatDate';
import api from '../services/api';
import { swal } from '../utils/swal';

export default function CommentCard({ comment, allComments, postAuthorId, onAccept, onDelete, onRestore, currentUserId, isLoggedIn = true, isAdmin = false }) {
  const navigate = useNavigate();
  const [upvoteCount, setUpvoteCount] = useState(comment.upvotes?.length || 0);
  const [upvoted, setUpvoted] = useState(comment.upvotes?.some(u => u.userId === currentUserId));
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [localChildren, setLocalChildren] = useState([]);
  const derivedChildren = useMemo(
    () => allComments.filter(c => c.parentId === comment._id),
    [allComments, comment._id]
  );
  const children = [...derivedChildren, ...localChildren.filter(
    lc => !derivedChildren.some(dc => dc._id === lc._id)
  )];

  const isAccepted = comment.isAccepted;
  const author = comment.authorId?.username || 'Anonim';
  const isPostOwner = currentUserId === postAuthorId;
  const isCommentOwner = currentUserId === comment.authorId?._id?.toString?.() || currentUserId === comment.authorId?.toString?.();
  const canDelete = isCommentOwner || isAdmin;

  const handleUpvote = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn) { navigate('/login'); return; }
    try {
      const res = await api.put(`/comments/${comment._id}/upvote`);
      setUpvoteCount(res.data.upvoteCount);
      setUpvoted(res.data.upvoted);
    } catch (err) {
      console.error('Gagal melakukan upvote komentar:', err);
    }
  };

  const handleReplyClick = () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setShowReplyForm(!showReplyForm);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${comment.postId}/comments`, {
        body: replyText,
        parentId: comment._id,
      });
      setLocalChildren(prev => [...prev, res.data]);
      setReplyText('');
      setShowReplyForm(false);
    } catch (err) {
      console.error('Gagal mengirim balasan:', err);
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (e) => {
    e.stopPropagation();
    const result = await swal.confirm(
      'Hapus Komentar',
      `Apakah Anda yakin ingin menghapus komentar ini?`,
      'Hapus',
      'Batal'
    );
    if (result.isConfirmed) {
      try {
        if (isAdmin && !isCommentOwner) {
          await api.delete(`/admin/comments/${comment._id}`);
        } else {
          await api.delete(`/comments/${comment._id}`);
        }
        setDeleted(true);
        swal.success('Berhasil', 'Komentar berhasil dihapus');
      } catch (err) {
        swal.error('Gagal', err.response?.data?.error || 'Gagal menghapus komentar');
      }
    }
  };

  if (deleted) return null;

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: `1px solid ${isAccepted ? 'rgba(16,185,129,0.3)' : 'var(--color-border)'}`,
      borderRadius: 16,
      padding: 24,
      borderLeft: isAccepted ? '4px solid var(--color-solved)' : '1px solid var(--color-border)',
      transition: 'all 0.2s ease',
    }}>
      {/* Accepted badge */}
      {isAccepted && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(16,185,129,0.1)', color: 'var(--color-solved)',
          padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700,
          marginBottom: 16
        }}>
          <svg style={{ width: 15, height: 15 }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Jawaban Terbaik
        </div>
      )}

      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: isAccepted
            ? 'linear-gradient(135deg, var(--color-solved), #059669)'
            : 'linear-gradient(135deg, var(--color-primary), #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0,
        }}>
          {author[0]?.toUpperCase()}
        </div>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', display: 'block', lineHeight: 1.3 }}>{author}</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDate(comment.createdAt)}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{
        fontSize: 14, color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap',
        lineHeight: 1.7, marginBottom: 20,
      }}>
        {comment.body}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Upvote */}
        <button
          onClick={handleUpvote}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: upvoted ? 'rgba(59,130,246,0.1)' : 'var(--color-bg-hover)',
            color: upvoted ? 'var(--color-primary)' : 'var(--color-text-muted)',
            border: upvoted ? '1px solid rgba(59,130,246,0.25)' : '1px solid var(--color-border)',
            transition: 'all 0.15s',
          }}
        >
          <svg style={{ width: 14, height: 14 }} fill={upvoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          {upvoteCount}
        </button>

        {/* Reply */}
        <button
          onClick={handleReplyClick}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: showReplyForm ? 'rgba(139,92,246,0.1)' : 'var(--color-bg-hover)',
            color: showReplyForm ? '#8b5cf6' : 'var(--color-text-muted)',
            border: showReplyForm ? '1px solid rgba(139,92,246,0.25)' : '1px solid var(--color-border)',
            transition: 'all 0.15s',
          }}
        >
          <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Balas
        </button>

        {/* Delete */}
        {canDelete && (
          <button
            onClick={handleDeleteComment}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: 'rgba(239,68,68,0.08)', color: 'var(--color-danger)',
              transition: 'all 0.15s',
            }}
          >
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="strokeWidth={2}" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Hapus
          </button>
        )}

        {/* Accept as best answer */}
        {isPostOwner && !isAccepted && !comment.parentId && (
          <button
            onClick={() => onAccept(comment._id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: 'rgba(16,185,129,0.1)', color: 'var(--color-solved)',
              transition: 'all 0.15s', marginLeft: 'auto',
            }}
          >
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Pilih sebagai jawaban terbaik
          </button>
        )}
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <form onSubmit={handleReply} style={{
          marginTop: 20, padding: '20px 24px',
          background: 'var(--color-bg-hover)', borderRadius: 14,
          border: '1px solid var(--color-border)',
        }}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Balas ${author}...`}
            rows={3}
            style={{
              width: '100%', padding: '12px 14px', marginBottom: 14,
              background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)',
              borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit',
              color: 'var(--color-text-primary)', lineHeight: 1.6, resize: 'vertical',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              disabled={submitting || !replyText.trim()}
              style={{
                padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: 'var(--color-primary)', color: '#fff',
                opacity: submitting || !replyText.trim() ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
            >
              {submitting ? 'Mengirim...' : 'Kirim'}
            </button>
            <button
              type="button"
              onClick={() => setShowReplyForm(false)}
              style={{
                padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                border: '1px solid var(--color-border)', cursor: 'pointer', fontFamily: 'inherit',
                background: 'transparent', color: 'var(--color-text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Nested replies */}
      {children.length > 0 && (
        <div style={{
          marginTop: 20, paddingLeft: 24,
          borderLeft: '2px solid var(--color-border)',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {children.map((child) => (
            <CommentCard
              key={child._id}
              comment={child}
              allComments={allComments}
              postAuthorId={postAuthorId}
              onAccept={onAccept}
              currentUserId={currentUserId}
              isLoggedIn={isLoggedIn}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}