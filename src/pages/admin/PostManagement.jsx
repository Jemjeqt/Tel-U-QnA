import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatDate } from '../../utils/formatDate';

export default function PostManagement() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', deleted: '' });
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPosts = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.search) params.search = filters.search;
      if (filters.deleted) params.deleted = filters.deleted;

      const res = await api.get('/admin/posts', { params });
      setPosts(res.data.posts);
      setPagination({ page: res.data.page, totalPages: res.data.totalPages });
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [filters]);

  const handleDelete = async (postId) => {
    if (!confirm('Yakin ingin menghapus post ini?')) return;
    setActionLoading(postId);
    try {
      await api.delete(`/admin/posts/${postId}`);
      fetchPosts(pagination.page);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus post');
    }
    setActionLoading(null);
  };

  const handleRestore = async (postId) => {
    setActionLoading(postId);
    try {
      await api.post(`/admin/posts/${postId}/restore`);
      fetchPosts(pagination.page);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memulihkan post');
    }
    setActionLoading(null);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Manajemen Post</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>Kelola semua pertanyaan di platform</p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Cari judul atau isi..."
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
          style={{ flex: 1, padding: '10px 16px', background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 12, fontSize: 14, outline: 'none', color: 'var(--color-text-primary)' }}
        />
        <select
          value={filters.deleted}
          onChange={e => setFilters({ ...filters, deleted: e.target.value })}
          style={{ padding: '10px 16px', background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 12, fontSize: 14, outline: 'none', color: 'var(--color-text-primary)' }}
        >
          <option value="">Semua Post</option>
          <option value="false">Aktif</option>
          <option value="true">Dihapus</option>
        </select>
      </div>

      {/* Posts List */}
      <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
          </div>
        ) : (
          <>
            {posts.length === 0 ? (
              <p style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>Tidak ada post ditemukan</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {posts.map(post => (
                  <div key={post._id} style={{
                    padding: 16, borderBottom: '1px solid var(--color-border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    opacity: post.isDeleted ? 0.6 : 1
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {post.isDeleted && (
                          <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)' }}>
                            Dihapus
                          </span>
                        )}
                        {post.isSolved && (
                          <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: 'var(--color-solved)' }}>
                            Terjawab
                          </span>
                        )}
                      </div>
                      <Link to={`/forum/${post._id}`} style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                        {post.title}
                      </Link>
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                        oleh {post.authorId?.username || 'Unknown'} - {formatDate(post.createdAt)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                      {post.isDeleted ? (
                        <button onClick={() => handleRestore(post._id)} disabled={actionLoading === post._id}
                          style={{ padding: '6px 12px', fontSize: 12, background: 'rgba(16,185,129,0.1)', color: 'var(--color-solved)', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                          Pulihkan
                        </button>
                      ) : (
                        <button onClick={() => handleDelete(post._id)} disabled={actionLoading === post._id}
                          style={{ padding: '6px 12px', fontSize: 12, background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ padding: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
                <button onClick={() => fetchPosts(pagination.page - 1)} disabled={pagination.page === 1}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer' }}>
                  Previous
                </button>
                <span style={{ padding: '8px 16px', color: 'var(--color-text-secondary)' }}>
                  Halaman {pagination.page} dari {pagination.totalPages}
                </span>
                <button onClick={() => fetchPosts(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer' }}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}