import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminDashboard() {
  const [data, setData] = useState({ stats: {}, recentPosts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(err => console.error('Failed to load dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
      </div>
    );
  }

  const { stats } = data;

  const menuItems = [
    {
      title: 'Manajemen User',
      desc: 'Kelola user, blokir, dan promote',
      icon: (
        <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: '#3b82f6',
      bgColor: 'rgba(59,130,246,0.1)',
      link: '/admin/users'
    },
    {
      title: 'Manajemen Post',
      desc: 'Lihat dan hapus post',
      icon: (
        <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: '#10b981',
      bgColor: 'rgba(16,185,129,0.1)',
      link: '/admin/posts'
    },
    {
      title: 'Manajemen Komentar',
      desc: 'Kelola semua komentar',
      icon: (
        <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: '#f59e0b',
      bgColor: 'rgba(245,158,11,0.1)',
      link: '/admin/comments'
    },
    {
      title: 'Kategori & Tag',
      desc: 'Atur kategori dan tag',
      icon: (
        <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      color: '#8b5cf6',
      bgColor: 'rgba(139,92,246,0.1)',
      link: '/admin/categories'
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
          <span style={{ background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Admin Dashboard
          </span>
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 15 }}>Selamat datang di panel administratif Tel-U QnA</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 16,
          padding: 20,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>{stats.totalPosts || 0}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Total Post</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 16,
          padding: 20,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--color-solved)', marginBottom: 4 }}>{stats.totalSolved || 0}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Terjawab</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 16,
          padding: 20,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>{stats.totalUsers || 0}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Total User</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 16,
          padding: 20,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--color-danger)', marginBottom: 4 }}>{stats.bannedUsers || 0}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Diblokir</div>
        </div>
      </div>

      {/* Menu Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
        {menuItems.map((item, idx) => (
          <Link
            key={idx}
            to={item.link}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 24,
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = item.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 24px ${item.bgColor}`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: item.bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: item.color,
            }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{item.desc}</div>
            </div>
            <svg style={{ width: 20, height: 20, color: 'var(--color-text-muted)', marginLeft: 'auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}