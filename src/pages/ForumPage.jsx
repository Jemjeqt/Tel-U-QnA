import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PostCard from '../components/PostCard';
import { swal } from '../utils/swal';

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [activeSort, setActiveSort] = useState('terbaru');
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeCategory) params.categoryId = activeCategory;
      if (activeStatus) params.status = activeStatus;
      if (activeSort === 'trending') params.sort = 'trending';
      const search = searchParams.get('search');
      if (search) params.search = search;
      const res = await api.get('/posts', { params });
      setPosts(res.data);
    } catch (err) {
      console.error('Gagal mengambil data pertanyaan:', err);
    }
    setLoading(false);
  }, [activeCategory, activeStatus, activeSort, searchParams]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    api.get('/posts/trending').then(res => setTrending(res.data)).catch(() => { });
    api.get('/categories').then(res => setCategories(res.data)).catch(() => { });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ search: searchInput.trim() });
    } else {
      setSearchParams({});
    }
  };

  // Admin handlers
  const handleAdminDelete = async (postId) => {
    try {
      await api.delete(`/admin/posts/${postId}`);
      swal.success('Berhasil', 'Post berhasil dihapus');
      fetchPosts();
    } catch (err) {
      swal.error('Gagal', err.response?.data?.error || 'Gagal menghapus post');
    }
  };

  const handleAdminRestore = async (postId) => {
    try {
      await api.post(`/admin/posts/${postId}/restore`);
      swal.success('Berhasil', 'Post berhasil dipulihkan');
      fetchPosts();
    } catch (err) {
      swal.error('Gagal', err.response?.data?.error || 'Gagal memulihkan post');
    }
  };

  const statusFilters = [
    { key: '', label: 'Semua' },
    { key: 'unsolved', label: 'Belum Terjawab' },
    { key: 'solved', label: 'Sudah Terjawab' },
  ];

  const sorts = [
    { key: 'terbaru', label: 'Terbaru' },
    { key: 'trending', label: 'Trending' },
  ];

  const getCategoryName = (id) => {
    const cat = categories.find(c => c._id === id);
    return cat ? cat.name : 'Semua Kategori';
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 20 }}>
          {searchParams.get('search')
            ? `Hasil: "${searchParams.get('search')}"`
            : activeStatus === 'solved' ? 'Sudah Terjawab'
              : activeStatus === 'unsolved' ? 'Belum Terjawab'
                : 'Forum Pertanyaan'
          }
        </h1>

        {/* Row 1: Search + Kategori */}
<div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ flex: 1 }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari pertanyaan..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: 44,
                  paddingRight: 16,
                  paddingTop: 12,
                  paddingBottom: 12,
                  background: 'var(--color-bg-card)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 14,
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'inherit',
                  color: 'var(--color-text-primary)',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>
          </form>

          {/* Category dropdown */}
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            style={{
              padding: '12px 16px',
              background: 'var(--color-bg-card)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 14,
              fontSize: 14,
              fontFamily: 'inherit',
              color: 'var(--color-text-primary)',
              outline: 'none',
              cursor: 'pointer',
              minWidth: 180,
            }}
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Row 2: Status pills + Sort */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Status pills */}
          <div style={{ display: 'flex', gap: 8 }}>
            {statusFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveStatus(f.key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: activeStatus === f.key ? 'var(--color-primary)' : 'var(--color-bg-card)',
                  color: activeStatus === f.key ? '#fff' : 'var(--color-text-secondary)',
                  border: activeStatus === f.key ? 'none' : '1.5px solid var(--color-border)',
                  transition: 'all 0.15s',
                  boxShadow: activeStatus === f.key ? '0 2px 8px rgba(59,130,246,0.25)' : 'none',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort toggle */}
          <div style={{ display: 'flex', gap: 6, background: 'var(--color-bg-card)', borderRadius: 10, padding: 4, border: '1px solid var(--color-border)' }}>
            {sorts.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSort(s.key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: activeSort === s.key ? 'var(--color-primary)' : 'transparent',
                  color: activeSort === s.key ? '#fff' : 'var(--color-text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content: 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
        {/* Feed */}
        <div style={{ minWidth: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', marginBottom: 12 }} />
              <p style={{ fontSize: 14 }}>Memuat pertanyaan...</p>
            </div>
          ) : posts.length === 0 ? (
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              padding: '64px 24px',
              textAlign: 'center',
            }}>
              <svg style={{ width: 48, height: 48, color: 'var(--color-text-muted)', marginBottom: 16, display: 'inline-block' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Belum ada pertanyaan</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Jadilah yang pertama bertanya!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  isAdmin={isAdmin}
                  onDelete={handleAdminDelete}
                  onRestore={handleAdminRestore}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Trending */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 16,
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <svg style={{ width: 18, height: 18, color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>Trending</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {trending.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0' }}>Belum ada trending</p>
              ) : (
                trending.map((t, i) => (
                  <Link
                    key={t._id}
                    to={`/forum/${t._id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 10,
                      textDecoration: 'none',
                      color: 'inherit',
                      background: 'rgba(59,130,246,0.05)',
                      border: '1px solid rgba(59,130,246,0.1)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                      e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(59,130,246,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(59,130,246,0.1)';
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', width: 18 }}>{i + 1}</span>
                    <p style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{t.title}</p>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', background: 'rgba(59,130,246,0.15)', padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>
                      {t.upvoteCount} votes
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
