import { useState, useEffect } from 'react';
import api from '../services/api';
import NotifItem from '../components/NotifItem';

export default function NotifPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRead, setShowRead] = useState(false);

  useEffect(() => {
    api.get('/notifications')
      .then(res => setNotifications(res.data))
      .catch((err) => { console.error('Gagal mengambil daftar notifikasi:', err); })
      .finally(() => setLoading(false));
  }, []);

  const handleRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Gagal menandai notifikasi dibaca:', err);
    }
  };

  const handleReadAll = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Gagal menandai semua dibaca:', err);
    }
  };

  const unread = notifications.filter(n => !n.isRead);
  const read = notifications.filter(n => n.isRead);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)' }}>Notifikasi</h1>
          {unread.length > 0 && (
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 }}>{unread.length} belum dibaca</p>
          )}
        </div>
        {unread.length > 0 && (
          <button onClick={handleReadAll} style={{
            fontSize: 14, color: 'var(--color-primary)', fontWeight: 600, border: 'none', background: 'transparent',
            cursor: 'pointer', fontFamily: 'inherit', padding: '10px 16px', borderRadius: 12
          }}>
            Tandai semua dibaca
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', marginBottom: 12 }} />
          <p style={{ fontSize: 14 }}>Memuat notifikasi...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : notifications.length === 0 ? (
        <div className="ka-card" style={{ textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ marginBottom: 16 }}>
            <svg style={{ width: 48, height: 48, margin: '0 auto', color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Belum ada notifikasi</p>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Notifikasi akan muncul saat ada aktivitas terkait pertanyaan Anda</p>
        </div>
      ) : (
        <div>
          {/* Unread section */}
          {unread.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div className="ka-section-label" style={{ marginBottom: 14 }}>Belum Dibaca ({unread.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {unread.map(n => (
                  <NotifItem key={n._id} notification={n} onRead={handleRead} />
                ))}
              </div>
            </div>
          )}

          {/* Read section */}
          {read.length > 0 && (
            <div>
              <button
                onClick={() => setShowRead(!showRead)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '14px 0', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                  fontWeight: 600, color: 'var(--color-text-muted)'
                }}
              >
                <svg style={{ width: 16, height: 16, transition: 'transform 0.2s', transform: showRead ? 'rotate(90deg)' : 'rotate(0)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Sudah Dibaca ({read.length})
              </button>
              {showRead && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                  {read.map(n => (
                    <NotifItem key={n._id} notification={n} onRead={handleRead} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
