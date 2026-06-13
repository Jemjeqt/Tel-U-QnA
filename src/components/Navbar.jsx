import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');
  const isLoggedIn = !!(token && user);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isLoggedIn) {
      api.get('/notifications/unread-count')
        .then(res => setUnreadCount(res.data.count))
        .catch(() => {});
    }
  }, [location.pathname, isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Hide navbar on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <nav className="ka-navbar">
      <div className="ka-navbar-inner" style={{ justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link to="/forum" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, background: 'var(--color-primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px var(--color-primary-light)' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>T</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
            Tel-U <span style={{ color: 'var(--color-text-primary)' }}>QnA</span>
          </span>
        </Link>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isLoggedIn ? (
            <>
              {/* Ask button */}
              <Link to="/tanya" className="ka-btn-primary" style={{ padding: '9px 18px', fontSize: 13 }}>
                <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Tanya
              </Link>

              {/* Bell */}
              <Link to="/notifikasi" style={{ position: 'relative', padding: 10, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'background 0.15s' }}>
                <svg style={{ width: 22, height: 22, color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, background: 'var(--color-danger)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="pulse-dot">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Admin Dashboard Link */}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))',
                    border: '1px solid rgba(59,130,246,0.3)',
                    color: 'var(--color-primary)',
                    fontSize: 12,
                    fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                  title="Admin Dashboard"
                >
                  <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin
                </Link>
              )}

              {/* User */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 4 }}>
                <div className="ka-avatar ka-avatar-sm" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{user.username}</span>
                <button onClick={handleLogout} style={{ padding: 8, color: 'var(--color-text-muted)', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex' }} title="Logout">
                  <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Guest: Ask redirects to login */}
              <Link to="/login" className="ka-btn-primary" style={{ padding: '9px 18px', fontSize: 13 }}>
                <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Tanya
              </Link>

              {/* Login / Register buttons */}
              <Link to="/login" style={{
                padding: '9px 20px', fontSize: 13, fontWeight: 600, color: 'var(--color-primary)',
                border: '1.5px solid var(--color-primary)', borderRadius: 12, textDecoration: 'none',
                fontFamily: 'inherit', transition: 'all 0.15s'
              }}>
                Masuk
              </Link>
              <Link to="/register" className="ka-btn-primary" style={{
                padding: '9px 20px', fontSize: 13, textDecoration: 'none'
              }}>
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
