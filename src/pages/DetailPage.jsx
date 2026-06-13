import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import CommentCard from '../components/CommentCard';
import { formatDate } from '../utils/formatDate';
import { swal } from '../utils/swal';

export default function DetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');
  const isLoggedIn = !!(token && user);
  const isAdmin = user?.role === 'admin';
  const isOwner = user?.id && (post?.authorId?._id?.toString() === user.id || post?.authorId?.toString() === user.id);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [postRes, commentsRes] = await Promise.all([
        api.get(`/posts/${postId}`),
        api.get(`/posts/${postId}/comments`),
      ]);
      setPost(postRes.data);
      setComments(commentsRes.data);
      setUpvoteCount(postRes.data.upvoteCount || 0);
      setUpvoted(postRes.data.upvotes?.some(u => u.userId === user?.id));
    } catch (err) {
      console.error('Gagal mengambil detail pertanyaan:', err);
    }
    setLoading(false);
  }, [postId, user?.id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpvote = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    try {
      const res = await api.put(`/posts/${postId}/upvote`);
      setUpvoteCount(res.data.upvoteCount);
      setUpvoted(res.data.upvoted);
    } catch (err) {
      console.error('Gagal melakukan upvote:', err);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/posts/${postId}/comments`, { body: answerText });
      setAnswerText('');
      const res = await api.get(`/posts/${postId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error('Gagal mengirim jawaban:', err);
    }
    setSubmitting(false);
  };

  const handleAccept = async (commentId) => {
    try {
      await api.put(`/posts/${postId}/solve`, { commentId });
      fetchData();
    } catch (err) {
      console.error('Gagal menerima jawaban:', err);
    }
  };

  const handleDeletePost = async () => {
    const endpoint = isAdmin && !isOwner ? `/admin/posts/${postId}` : `/posts/${postId}`;
    try {
      await api.delete(endpoint);
      swal.success('Berhasil', 'Post berhasil dihapus');
      navigate('/forum');
    } catch (err) {
      swal.error('Gagal', err.response?.data?.error || 'Gagal menghapus pertanyaan');
    }
  };

  const confirmDeletePost = async () => {
    const result = await swal.confirm(
      'Hapus Pertanyaan',
      `Apakah Anda yakin ingin menghapus pertanyaan "${post.title}"?`,
      'Hapus',
      'Batal'
    );
    if (result.isConfirmed) {
      handleDeletePost();
    }
  };

  if (loading) return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '80px 32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', marginBottom: 16 }} />
      <p style={{ fontSize: 14 }}>Memuat...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!post) return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
      <svg style={{ width: 56, height: 56, color: 'var(--color-text-muted)', marginBottom: 16, display: 'inline-block' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Pertanyaan tidak ditemukan</p>
      <Link to="/forum" style={{ color: 'var(--color-primary)', fontSize: 14, fontWeight: 500 }}>← Kembali ke forum</Link>
    </div>
  );

  const topLevel = comments.filter(c => !c.parentId);
  const accepted = topLevel.find(c => c.isAccepted);
  const others = topLevel.filter(c => !c.isAccepted);
  const sorted = accepted ? [accepted, ...others] : others;
  const author = post.authorId?.username || 'Anonim';
  const category = post.categoryId?.name || '';

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 32px' }}>
      {/* Back */}
      <Link to="/forum" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none',
        fontWeight: 500, marginBottom: 24, padding: '6px 12px',
        background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
        borderRadius: 10, transition: 'all 0.15s',
      }}
 onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
      >
        <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali
      </Link>

      {/* Post Card */}
      <article style={{
        background: 'var(--color-bg-card)',
        border: `1px solid ${post.isSolved ? 'rgba(16,185,129,0.3)' : 'var(--color-border)'}`,
        borderRadius: 20,
        padding: 32,
        marginBottom: 28,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        borderLeft: post.isSolved ? '4px solid var(--color-solved)' : '1px solid var(--color-border)',
      }}>
        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          {category && (
            <span style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: 'rgba(59,130,246,0.12)', color: 'var(--color-primary)',
            }}>
              {category}
            </span>
          )}
          {post.isSolved && (
            <span style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: 'rgba(16,185,129,0.12)', color: 'var(--color-solved)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <svg style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Terjawab
            </span>
          )}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 24, lineHeight: 1.35 }}>{post.title}</h1>

        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 18, fontWeight: 700, flexShrink: 0,
          }}>
            {author[0]?.toUpperCase()}
          </div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', display: 'block', lineHeight: 1.3 }}>{author}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-text-muted)', marginTop: 3 }}>
              <span>{formatDate(post.createdAt)}</span>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {post.viewCount} views
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{
          fontSize: 15, color: 'var(--color-text-primary)', lineHeight: 1.8,
          whiteSpace: 'pre-wrap', marginBottom: 28, padding: '24px 28px',
          background: 'var(--color-bg-hover)', borderRadius: 14,
          border: '1px solid var(--color-border)',
        }}>{post.body}</div>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {post.tags.map(tag => (
              <span key={tag._id} style={{
                padding: '5px 10px', background: 'var(--color-bg-hover)',
                borderRadius: 8, fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500,
              }}>
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          paddingTop: 20, borderTop: '1px solid var(--color-border)',
        }}>
          {/* Upvote */}
          <button
            onClick={handleUpvote}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 12, fontSize: 14, fontWeight: 600,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: upvoted ? 'rgba(59,130,246,0.12)' : 'var(--color-bg-hover)',
              color: upvoted ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              border: upvoted ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--color-border)',
              transition: 'all 0.15s',
            }}
          >
            <svg style={{ width: 16, height: 16 }} fill={upvoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            {upvoteCount} Upvote
          </button>

          {/* Jawaban count */}
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500,
            background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}>
            <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {topLevel.length} Jawaban
          </span>

          {/* Delete button */}
          {isLoggedIn && user?.id && (isOwner || (isAdmin && !isOwner)) && (
            <button
              onClick={confirmDeletePost}
              style={{
                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            >
              <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Hapus
            </button>
          )}
        </div>
      </article>

      {/* Answers Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {topLevel.length > 0 ? `${topLevel.length} Jawaban` : 'Belum ada jawaban'}
        </h2>
        {topLevel.length > 0 && (
          <span style={{
            padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)',
          }}>
            {topLevel.length}
          </span>
        )}
      </div>

      {/* Comments */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
        {sorted.length === 0 ? (
          <div style={{
            background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
            borderRadius: 16, padding: '48px 24px', textAlign: 'center',
          }}>
            <svg style={{ width: 44, height: 44, color: 'var(--color-text-muted)', marginBottom: 14, display: 'inline-block' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Jadilah yang pertama menjawab</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Pertanyaan ini belum memiliki jawaban</p>
          </div>
        ) : (
          sorted.map(c => (
            <CommentCard
              key={c._id}
              comment={c}
              allComments={comments}
              postAuthorId={post.authorId?._id || post.authorId}
              onAccept={handleAccept}
              currentUserId={user?.id}
              isLoggedIn={isLoggedIn}
              isAdmin={isAdmin}
            />
          ))
        )}
      </div>

      {/* Answer form */}
      {isLoggedIn ? (
        <div style={{
          background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
          borderRadius: 20, padding: 28,
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0,
            }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{user?.username}</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Tulis jawaban Anda</p>
            </div>
          </div>
          <form onSubmit={handleSubmitAnswer}>
            <textarea
              value={answerText}
              onChange={e => setAnswerText(e.target.value)}
              placeholder="Tulis jawaban Anda di sini..."
              rows={5}
              style={{
                width: '100%', padding: '14px 16px', marginBottom: 16,
                background: 'var(--color-bg-hover)', border: '1.5px solid var(--color-border)',
                borderRadius: 14, fontSize: 14, outline: 'none', fontFamily: 'inherit',
                color: 'var(--color-text-primary)', lineHeight: 1.6, resize: 'vertical',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={submitting || !answerText.trim()}
                style={{
                  padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: 'var(--color-primary)', color: '#fff',
                  opacity: submitting || !answerText.trim() ? 0.5 : 1,
                  transition: 'all 0.15s',
                  boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
                }}
              >
                {submitting ? 'Mengirim...' : 'Kirim Jawaban'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{
          background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
          borderRadius: 20, padding: '40px 28px', textAlign: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        }}>
          <svg style={{ width: 48, height: 48, color: 'var(--color-text-muted)', marginBottom: 16, display: 'inline-block' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0b8 8m-8-8l4 4m0 0l4-4m-4 4V8" />
          </svg>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Ingin ikut berdiskusi?</p>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>Masuk untuk menjawab pertanyaan ini</p>
          <Link to="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600,
            textDecoration: 'none', background: 'var(--color-primary)', color: '#fff',
            boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
          }}>
            Masuk untuk Menjawab
          </Link>
        </div>
      )}
    </div>
  );
}