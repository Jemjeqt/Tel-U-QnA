import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

export default function AuthPage() {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : { username: form.username, email: form.email, password: form.password };
      const res = await api.post(endpoint, payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/forum');
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, var(--color-bg-page) 50%, rgba(59,130,246,0.12) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }} className="animate-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: 'var(--color-primary)', borderRadius: 18, boxShadow: '0 8px 24px rgba(59,130,246,0.3)', marginBottom: 16 }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 28 }}>K</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            Kampus<span style={{ color: 'var(--color-primary)' }}>Ask</span>
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 8, fontSize: 14 }}>Forum Diskusi & Tanya Jawab Mahasiswa</p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--color-bg-card)', borderRadius: 20, border: '1px solid var(--color-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', padding: 36 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 28, textAlign: 'center' }}>
            {isLogin ? 'Masuk ke Akun' : 'Buat Akun Baru'}
          </h2>

          {error && (
            <div style={{ marginBottom: 20, padding: 14, background: 'var(--color-danger-light)', color: 'var(--color-danger)', fontSize: 14, borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)', fontWeight: 500 }} className="animate-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {!isLogin && (
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>Username</label>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Masukkan username" required className="ka-input" />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nama@mahasiswa.ac.id" required className="ka-input" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Masukkan password" required minLength={6} className="ka-input" />
            </div>

            <button type="submit" disabled={loading} className="ka-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: 15, marginTop: 4, opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 28 }}>
            {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
              style={{ color: 'var(--color-primary)', fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, textDecoration: 'underline', textUnderlineOffset: 2 }}>
              {isLogin ? 'Daftar sekarang' : 'Masuk di sini'}
            </button>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 28 }}>
          Tel-U QnA — Forum Diskusi Mahasiswa
        </p>
      </div>
    </div>
  );
}
