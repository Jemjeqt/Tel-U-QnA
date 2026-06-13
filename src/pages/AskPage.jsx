import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TagInput from '../components/TagInput';

export default function AskPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !categoryId) {
      setError('Judul, detail, dan kategori wajib diisi');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/posts', { title, body, categoryId, tags });
      navigate('/forum');
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengirim pertanyaan');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 32px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 24 }}>Ajukan Pertanyaan</h1>

      <div className="ka-card animate-in" style={{ padding: 36 }}>
        {error && (
          <div style={{ marginBottom: 24, padding: 14, background: 'var(--color-danger-light)', color: 'var(--color-danger)', fontSize: 14, borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 10 }}>Judul Pertanyaan</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Tulis judul pertanyaan yang jelas dan spesifik" className="ka-input" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 10 }}>Detail Pertanyaan</label>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              placeholder="Jelaskan pertanyaan Anda secara detail..." rows={7} className="ka-input" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 10 }}>Kategori</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="ka-input">
              <option value="">Pilih kategori mata kuliah</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 10 }}>Tags</label>
            <TagInput tags={tags} onChange={setTags} />
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>Tekan Enter untuk menambah tag</p>
          </div>

          <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
            <button type="submit" disabled={loading} className="ka-btn-primary"
              style={{ padding: '14px 28px', fontSize: 15, opacity: loading ? 0.5 : 1 }}>
              {loading ? 'Mengirim...' : 'Kirim Pertanyaan'}
            </button>
            <button type="button" onClick={() => navigate('/forum')} className="ka-btn-outline"
              style={{ padding: '14px 28px', fontSize: 15 }}>
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
