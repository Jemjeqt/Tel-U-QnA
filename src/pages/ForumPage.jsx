import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard';

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [activeSort, setActiveSort] = useState('terbaru');
  const [searchParams] = useSearchParams();

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
    api.get('/posts/trending').then(res => setTrending(res.data)).catch((err) => { console.error('Gagal mengambil data trending:', err); });
    api.get('/posts/stats').then(res => setStats(res.data)).catch((err) => { console.error('Gagal mengambil data statistik:', err); });
  }, []);

  const sorts = [
    { key: 'terbaru', label: 'Terbaru' },
    { key: 'trending', label: 'Trending' },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 32px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 290px', gap: 28 }}>
        {/* Sidebar */}
        <div style={{ position: 'sticky', top: 92, alignSelf: 'start' }}>
          <Sidebar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            activeStatus={activeStatus}
            onStatusChange={setActiveStatus}
          />
        </div>

        {/* Feed */}
        <div style={{ minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {searchParams.get('search')
                ? `Hasil: "${searchParams.get('search')}"`
                : activeStatus === 'solved' ? 'Sudah Terjawab'
                  : activeStatus === 'unsolved' ? 'Belum Terjawab'
                    : 'Semua Pertanyaan'
              }
            </h1>
            <div style={{ display: 'flex', background: 'var(--color-bg-card)', borderRadius: 12, border: '1px solid var(--color-border)', padding: 4, gap: 4 }}>
              {sorts.map(s => (
                <button key={s.key} onClick={() => setActiveSort(s.key)} style={{
                  padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: activeSort === s.key ? 'var(--color-primary)' : 'transparent',
                  color: activeSort === s.key ? '#fff' : 'var(--color-text-muted)',
                  transition: 'all 0.15s',
                  boxShadow: activeSort === s.key ? '0 2px 8px rgba(59,130,246,0.25)' : 'none',
                }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Posts */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', marginBottom: 12 }} />
              <p style={{ fontSize: 14 }}>Memuat pertanyaan...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="ka-card" style={{ textAlign: 'center', padding: '64px 24px' }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}></p>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Belum ada pertanyaan</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div style={{ position: 'sticky', top: 92, alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Trending */}
          <div className="ka-card" style={{ padding: 24 }}>
            <div className="ka-section-label">Trending</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {trending.map((t, i) => (
                <a key={t._id} href={`/forum/${t._id}`} style={{ display: 'flex', gap: 12, textDecoration: 'none', color: 'inherit' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(156,163,175,0.3)', width: 22, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.4, marginBottom: 4 }}>{t.title}</p>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{t.upvoteCount} votes</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="ka-card" style={{ padding: 24 }}>
            <div className="ka-section-label">Statistik Forum</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="ka-stat">
                <div className="num" style={{ color: 'var(--color-primary)' }}>{stats.totalPosts || 0}</div>
                <div className="lbl">Pertanyaan</div>
              </div>
              <div className="ka-stat">
                <div className="num" style={{ color: 'var(--color-primary)' }}>{stats.totalComments || 0}</div>
                <div className="lbl">Jawaban</div>
              </div>
              <div className="ka-stat">
                <div className="num" style={{ color: 'var(--color-solved)' }}>{stats.totalSolved || 0}</div>
                <div className="lbl">Terjawab</div>
              </div>
              <div className="ka-stat">
                <div className="num" style={{ color: 'var(--color-primary)' }}>{stats.totalUsers || 0}</div>
                <div className="lbl">Mahasiswa</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
