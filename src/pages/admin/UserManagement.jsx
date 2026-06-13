import { useState, useEffect } from 'react';
import api from '../../services/api';
import { swal } from '../../utils/swal';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', banned: '' });
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.search) params.search = filters.search;
      if (filters.banned) params.banned = filters.banned;

      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users);
      setPagination({ page: res.data.page, totalPages: res.data.totalPages, total: res.data.total });
    } catch (err) {
      console.error('Failed to load users:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleBan = async (userId, username) => {
    const result = await swal.confirm(
      'Blokir User',
      `Apakah Anda yakin ingin memblokir "${username}"? User tidak bisa login setelah diblokir.`,
      'Blokir',
      'Batal'
    );
    if (result.isConfirmed) {
      setActionLoading(userId);
      try {
        await api.put(`/admin/users/${userId}/ban`);
        swal.success('Berhasil', 'User berhasil diblokir');
        fetchUsers(pagination.page);
      } catch (err) {
        swal.error('Gagal', err.response?.data?.error || 'Gagal memblokir user');
      }
      setActionLoading(null);
    }
  };

  const handleUnban = async (userId, username) => {
    setActionLoading(userId);
    try {
      await api.put(`/admin/users/${userId}/unban`);
      swal.success('Berhasil', `"${username}" berhasil diaktifkan kembali`);
      fetchUsers(pagination.page);
    } catch (err) {
      swal.error('Gagal', err.response?.data?.error || 'Gagal mengaktifkan user');
    }
    setActionLoading(null);
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 32px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Manajemen User</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>Blokir atau aktifkan user di platform</p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Cari username atau email..."
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
          style={{ flex: 1, minWidth: 200, padding: '10px 16px', background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 12, fontSize: 14, outline: 'none', color: 'var(--color-text-primary)' }}
        />
        <select
          value={filters.banned}
          onChange={e => setFilters({ ...filters, banned: e.target.value })}
          style={{ padding: '10px 16px', background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 12, fontSize: 14, outline: 'none', color: 'var(--color-text-primary)' }}
        >
          <option value="">Semua Status</option>
          <option value="false">Aktif</option>
          <option value="true">Diblokir</option>
        </select>
      </div>

      {/* Users Table */}
      <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-hover)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Username</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Email</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Role</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      Tidak ada user ditemukan
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user._id} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>{user.username}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)', fontSize: 14 }}>{user.email}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: user.role === 'admin' ? 'rgba(59,130,246,0.1)' : 'rgba(156,163,175,0.1)',
                          color: user.role === 'admin' ? 'var(--color-primary)' : 'var(--color-text-muted)'
                        }}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: user.isBanned ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          color: user.isBanned ? 'var(--color-danger)' : 'var(--color-solved)'
                        }}>
                          {user.isBanned ? 'Diblokir' : 'Aktif'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {user.isBanned ? (
                          <button onClick={() => handleUnban(user._id, user.username)} disabled={actionLoading === user._id}
                            style={{ padding: '6px 14px', fontSize: 12, background: 'rgba(16,185,129,0.1)', color: 'var(--color-solved)', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                            Aktifkan
                          </button>
                        ) : (
                          <button onClick={() => handleBan(user._id, user.username)} disabled={actionLoading === user._id}
                            style={{ padding: '6px 14px', fontSize: 12, background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                            Blokir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ padding: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
                <button onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page === 1}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', opacity: pagination.page === 1 ? 0.5 : 1 }}>
                  Previous
                </button>
                <span style={{ padding: '8px 16px', color: 'var(--color-text-secondary)' }}>
                  Halaman {pagination.page} dari {pagination.totalPages}
                </span>
                <button onClick={() => fetchUsers(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer', opacity: pagination.page === pagination.totalPages ? 0.5 : 1 }}>
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