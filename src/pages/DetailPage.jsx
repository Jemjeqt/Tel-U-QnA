import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import CommentCard from '../components/CommentCard';
import { formatDate } from '../utils/formatDate';

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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');
  const isLoggedIn = !!(token && user);

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
    try {
      await api.delete(`/posts/${postId}`);
      navigate('/forum');
    } catch (err) {
      console.error('Gagal menghapus pertanyaan:', err);
    }
  };


  if (loading) return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', marginBottom: 12 }} />
      <p style={{ fontSize: 14 }}>Memuat...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );



  if (!post) return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
      <p style={{ fontSize: 36, marginBottom: 12 }}>😕</p>
      <p style={{ color: 'var(--color-text-secondary)' }}>Pertanyaan tidak ditemukan</p>
      <Link to="/forum" style={{ color: 'var(--color-primary)', fontSize: 14, marginTop: 12, display: 'inline-block', fontWeight: 500 }}>← Kembali ke forum</Link>
    </div>
  );

  const topLevel = comments.filter(c => !c.parentId);
  const accepted = topLevel.find(c => c.isAccepted);
  const others = topLevel.filter(c => !c.isAccepted);
  const sorted = accepted ? [accepted, ...others] : others;
  const author = post.authorId?.username || 'Anonim';
  const category = post.categoryId?.name || '';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 32px' }}>
      {/* Back */}
      <Link to="/forum" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 500, marginBottom: 20 }}>
        <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Forum
      </Link>

      {/* Post */}
      <article className="ka-card animate-in" style={{ padding: 32, marginBottom: 28, borderLeft: post.isSolved ? '4px solid var(--color-solved)' : undefined }}>
        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          {category && <span className="ka-badge ka-badge-category">{category}</span>}
          {post.isSolved && <span className="ka-badge ka-badge-solved">Terjawab</span>}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 20, lineHeight: 1.35 }}>{post.title}</h1>

        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div className="ka-avatar ka-avatar-md" style={{ background: 'var(--color-primary)', color: '#fff' }}>
            {author[0]?.toUpperCase()}
          </div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', display: 'block', lineHeight: 1.3 }}>{author}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
              <span>{formatDate(post.createdAt)}</span>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {post.viewCount} views
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ fontSize: 15, color: 'var(--color-text-primary)', lineHeight: 1.75, whiteSpace: 'pre-wrap', marginBottom: 28 }}>{post.body}</div>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            {post.tags.map(tag => <span key={tag._id} className="ka-tag">{tag.name}</span>)}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
          <button onClick={handleUpvote} className={`ka-upvote ${upvoted ? 'active' : ''}`}>
            ▲ {upvoteCount} Upvote
          </button>
          <span style={{ fontSize: 14, color: 'var(--color-text-muted)', fontWeight: 500 }}>{topLevel.length} Jawaban</span>

          {/* Tombol Hapus — hanya muncul untuk pemilik pertanyaan */}
          {isLoggedIn && user?.id && (post.authorId?._id?.toString() === user.id || post.authorId?.toString() === user.id) && (
            confirmDelete ? (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Yakin hapus?</span>
                <button
                  onClick={handleDeletePost}
                  style={{ fontSize: 13, color: '#fff', background: '#ef4444', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Ya, Hapus
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{ fontSize: 13, color: 'var(--color-text-muted)', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 8, padding: '6px 14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{ marginLeft: 'auto', fontSize: 13, color: '#ef4444', fontWeight: 600, cursor: 'pointer', border: 'none', background: 'transparent', fontFamily: 'inherit' }}
              >
                Hapus Pertanyaan
              </button>
            )
          )}
        </div>
      </article>


      {/* Comments header */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 20 }}>
        {topLevel.length > 0 ? `${topLevel.length} Jawaban` : 'Belum ada jawaban'}
      </h2>

      {/* Comments */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        {sorted.map(c => (
          <CommentCard key={c._id} comment={c} allComments={comments}
            postAuthorId={post.authorId?._id || post.authorId}
            onAccept={handleAccept} currentUserId={user?.id}
            isLoggedIn={isLoggedIn} />
        ))}
      </div>

      {/* Answer form — only for logged-in users */}
      {isLoggedIn ? (
        <div className="ka-card" style={{ padding: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16 }}>Tulis Jawaban</h3>
          <form onSubmit={handleSubmitAnswer}>
            <textarea value={answerText} onChange={e => setAnswerText(e.target.value)}
              placeholder="Tulis jawaban Anda di sini..."
              rows={5} className="ka-input" style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={submitting || !answerText.trim()} className="ka-btn-primary"
                style={{ opacity: submitting || !answerText.trim() ? 0.5 : 1 }}>
                {submitting ? 'Mengirim...' : 'Kirim Jawaban'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="ka-card" style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: 'var(--color-text-secondary)', marginBottom: 16 }}>Ingin ikut berdiskusi?</p>
          <Link to="/login" className="ka-btn-primary" style={{ textDecoration: 'none', padding: '10px 28px', fontSize: 14 }}>
            Masuk untuk Menjawab
          </Link>
        </div>
      )}
    </div>
  );
}
