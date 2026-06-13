import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDate } from '../../utils/formatDate';

export default function CommentManagement() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', deleted: '' });
  const [actionLoading, setActionLoading] = useState(null);

  const fetchComments = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.search) params.search = filters.search;
      if (filters.deleted) params.deleted = filters.deleted;

      const res = await api.get('/admin/comments', { params });
      setComments(res.data.comments);
      setPagination({ page: res.data.page, totalPages: res.data.totalPages });
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [filters]);

  const handleDelete = async (commentId) => {
    if (!confirm('Yakin ingin menghapus komentar ini?')) return;
    setActionLoading(commentId);
    try {
      await api.delete(`/admin/comments/${commentId}`);
      fetchComments(pagination.page);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus komentar');
    }
    setActionLoading(null);
  };

  const handleRestore = async (commentId) => {
    setActionLoading(commentId);
    try {
      await api.post(`/admin/comments/${commentId}/restore`);
      fetchComments(pagination.page);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memulihkan komentar');
    }
    setActionLoading(null);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Manajemen Komentar</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>Kelola semua komentar di platform</p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Cari isi komentar..."
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
          style={{ flex: 1, padding: '10px 16px', background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 12, fontSize: 14, outline: 'none', color: 'var(--color-text-primary)' }}
        />
        <select
          value={filters.deleted}
          onChange={e => setFilters({ ...filters, deleted: e.target.value })}
          style={{ padding: '10px 16px', background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 12, fontSize: 14, outline: 'none', color: 'var(--color-text-primary)' }}
        >
          <option value="">Semua Komentar</option>
          <option value="false">Aktif</option>
          <option value="true">Dihapus</option>
        </select>
      </div>

      {/* Comments List */}
      <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
          </div>
        ) : (
          <>
            {comments.length === 0 ? (
              <p style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>Tidak ada komentar ditemukan</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {comments.map(comment => (
                  <div key={comment._id} style={{
                    padding: 16, borderBottom: '1px solid var(--color-border)',
                    opacity: comment.isDeleted ? 0.6 : 1
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          {comment.isDeleted && (
                            <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)' }}>
                              Dihapus
                            </span>
                          )}
                          {comment.isAccepted && (
                            <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: 'var(--color-solved)' }}>
                              Jawaban Terbaik
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 4 }}>{comment.body}</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                          oleh {comment.authorId?.username || 'Unknown'} di post "{comment.postId?.title || 'Unknown'}" - {formatDate(comment.createdAt)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                        {comment.isDeleted ? (
                          <button onClick={() => handleRestore(comment._id)} disabled={actionLoading === comment._id}
                            style={{ padding: '6px 12px', fontSize: 12, background: 'rgba(16,185,129,0.1)', color: 'var(--color-solved)', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                            Pulihkan
                          </button>
                        ) : (
                          <button onClick={() => handleDelete(comment._id)} disabled={actionLoading === comment._id}
                            style={{ padding: '6px 12px', fontSize: 12, background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ padding: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
                <button onClick={() => fetchComments(pagination.page - 1)} disabled={pagination.page === 1}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer' }}>
                  Previous
                </button>
                <span style={{ padding: '8px 16px', color: 'var(--color-text-secondary)' }}>
                  Halaman {pagination.page} dari {pagination.totalPages}
                </span>
                <button onClick={() => fetchComments(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
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