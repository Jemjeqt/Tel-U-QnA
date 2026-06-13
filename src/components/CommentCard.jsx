import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/formatDate';
import api from '../services/api';

export default function CommentCard({ comment, allComments, postAuthorId, onAccept, currentUserId, isLoggedIn = true }) {
  const navigate = useNavigate();
  const [upvoteCount, setUpvoteCount] = useState(comment.upvotes?.length || 0);
  const [upvoted, setUpvoted] = useState(comment.upvotes?.some(u => u.userId === currentUserId));
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [children, setChildren] = useState(
    allComments.filter(c => c.parentId === comment._id)
  );

  const isAccepted = comment.isAccepted;
  const author = comment.authorId?.username || 'Anonim';
  const isPostOwner = currentUserId === postAuthorId;

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
      setChildren([...children, res.data]);
      setReplyText('');
      setShowReplyForm(false);
    } catch (err) {
      console.error('Gagal mengirim balasan:', err);
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (e) => {
    e.stopPropagation();
    try {
      await api.delete(`/comments/${comment._id}`);
      setDeleted(true);
    } catch (err) {
      console.error('Gagal menghapus komentar:', err);
    }
  };

  // Jika sudah dihapus, jangan render apa-apa
  if (deleted) return null;

  return (
    <div className={`ka-comment ${isAccepted ? 'accepted' : ''} animate-in`}>
      {/* Accepted badge */}
      {isAccepted && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--color-solved-light)', color: 'var(--color-solved)',
          padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
          marginBottom: 16
        }}>
          <svg style={{ width: 16, height: 16 }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Jawaban Terbaik
        </div>
      )}

      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div className="ka-avatar ka-avatar-md" style={{ background: 'var(--color-primary)', color: '#fff' }}>
          {author[0]?.toUpperCase()}
        </div>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', display: 'block', lineHeight: 1.3 }}>{author}</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDate(comment.createdAt)}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ fontSize: 14, color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.7, marginBottom: 20, paddingLeft: 52 }}>
        {comment.body}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 52 }}>
        <button onClick={handleUpvote} className={`ka-upvote ${upvoted ? 'active' : ''}`}>
          ▲ {upvoteCount}
        </button>

        <button
          onClick={handleReplyClick}
          style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'transparent', fontFamily: 'inherit' }}
        >
          Balas
        </button>

        {/* Tombol Hapus — hanya muncul untuk pemilik komentar */}
        {(currentUserId === comment.authorId?._id?.toString?.() || currentUserId === comment.authorId?.toString?.()) && (
          confirmDelete ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Yakin hapus?</span>
              <button
                onClick={handleDeleteComment}
                style={{ fontSize: 13, color: '#fff', background: '#ef4444', border: 'none', borderRadius: 6, padding: '4px 10px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Ya
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                style={{ fontSize: 13, color: 'var(--color-text-muted)', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Batal
              </button>
            </>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              style={{ fontSize: 13, color: '#ef4444', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'transparent', fontFamily: 'inherit' }}
            >
              Hapus
            </button>
          )
        )}

        {isPostOwner && !isAccepted && !comment.parentId && (
          <button
            onClick={() => onAccept(comment._id)}
            style={{ fontSize: 13, color: 'var(--color-solved)', fontWeight: 600, cursor: 'pointer', border: 'none', background: 'transparent', fontFamily: 'inherit', marginLeft: 'auto' }}
          >
            ✓ Pilih sebagai jawaban terbaik
          </button>
        )}
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <form onSubmit={handleReply} style={{ marginTop: 20, marginLeft: 52, paddingLeft: 20, borderLeft: '3px solid var(--color-primary-light)' }}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Balas ${author}...`}
            rows={3}
            className="ka-input"
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={submitting || !replyText.trim()} className="ka-btn-primary" style={{ padding: '8px 16px', fontSize: 13, opacity: submitting || !replyText.trim() ? 0.5 : 1 }}>
              {submitting ? 'Mengirim...' : 'Kirim'}
            </button>
            <button type="button" onClick={() => setShowReplyForm(false)} className="ka-btn-outline" style={{ padding: '8px 16px', fontSize: 13 }}>
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Nested replies */}
      {children.length > 0 && (
        <div style={{ marginTop: 20, marginLeft: 52, paddingLeft: 20, borderLeft: '2px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {children.map((child) => (
            <CommentCard
              key={child._id}
              comment={child}
              allComments={allComments}
              postAuthorId={postAuthorId}
              onAccept={onAccept}
              currentUserId={currentUserId}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}
    </div>
  );
}
