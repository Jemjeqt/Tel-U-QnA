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
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/forum?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Hide navbar on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <nav className="ka-navbar">
      <div className="ka-navbar-inner">
        {/* Logo */}
        <Link to="/forum" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, background: 'var(--color-primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px var(--color-primary-light)' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>T</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
            Tel-U <span style={{ color: 'var(--color-text-primary)' }}>QnA</span>
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 480 }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari pertanyaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: 42, paddingRight: 16, paddingTop: 10, paddingBottom: 10, background: 'var(--color-bg-hover)', border: '1.5px solid transparent', borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit', color: 'var(--color-text-primary)' }}
            />
          </div>
        </form>

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
