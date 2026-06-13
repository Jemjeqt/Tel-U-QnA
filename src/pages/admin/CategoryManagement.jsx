import { useState, useEffect } from 'react';
import api from '../../services/api';
import { swal } from '../../utils/swal';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('categories');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [tagName, setTagName] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, tagRes] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/tags'),
      ]);
      setCategories(catRes.data);
      setTags(tagRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/categories', formData);
      swal.success('Berhasil', 'Kategori berhasil ditambahkan');
      setShowAddModal(false);
      setFormData({ name: '', description: '' });
      fetchData();
    } catch (err) {
      swal.error('Gagal', err.response?.data?.error || 'Gagal menambahkan kategori');
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/categories/${editingItem._id}`, formData);
      swal.success('Berhasil', 'Kategori berhasil diperbarui');
      setEditingItem(null);
      setFormData({ name: '', description: '' });
      fetchData();
    } catch (err) {
      swal.error('Gagal', err.response?.data?.error || 'Gagal memperbarui kategori');
    }
  };

  const handleDeleteCategory = async (id) => {
    const result = await swal.confirm('Hapus Kategori', 'Apakah Anda yakin ingin menghapus kategori ini?', 'Hapus', 'Batal');
    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/categories/${id}`);
        swal.success('Berhasil', 'Kategori berhasil dihapus');
        fetchData();
      } catch (err) {
        swal.error('Gagal', err.response?.data?.error || 'Gagal menghapus kategori');
      }
    }
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    try {
      await api.post('/admin/tags', { name: tagName.trim() });
      swal.success('Berhasil', 'Tag berhasil ditambahkan');
      setTagName('');
      fetchData();
    } catch (err) {
      swal.error('Gagal', err.response?.data?.error || 'Gagal menambahkan tag');
    }
  };

  const handleDeleteTag = async (id, name) => {
    const result = await swal.confirm('Hapus Tag', `Apakah Anda yakin ingin menghapus tag "${name}"?`, 'Hapus', 'Batal');
    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/tags/${id}`);
        swal.success('Berhasil', 'Tag berhasil dihapus');
        fetchData();
      } catch (err) {
        swal.error('Gagal', err.response?.data?.error || 'Gagal menghapus tag');
      }
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name, description: item.description || '' });
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 32px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Manajemen Kategori & Tag</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>Kelola kategori dan tag forum</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 600,
            background: activeTab === 'categories' ? 'var(--color-primary)' : 'var(--color-bg-card)',
            color: activeTab === 'categories' ? '#fff' : 'var(--color-text-muted)',
          }}
        >
          Kategori
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 600,
            background: activeTab === 'tags' ? 'var(--color-primary)' : 'var(--color-bg-card)',
            color: activeTab === 'tags' ? '#fff' : 'var(--color-text-muted)',
          }}
        >
          Tags
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
        </div>
      ) : activeTab === 'categories' ? (
        <>
          {/* Add Button */}
          <button
            onClick={() => { setShowAddModal(true); setEditingItem(null); setFormData({ name: '', description: '' }); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginBottom: 16,
            }}
          >
            <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Kategori
          </button>

          {/* Categories List */}
          <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' }}>
            {categories.length === 0 ? (
              <p style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>Belum ada kategori</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-hover)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Nama</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Deskripsi</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Post</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat._id} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>{cat.name}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)', fontSize: 14 }}>
                        {cat.description || '-'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background: 'rgba(59,130,246,0.1)',
                          color: 'var(--color-primary)',
                        }}>
                          {cat.postCount}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEditModal(cat)}
                            style={{ padding: '6px 12px', fontSize: 12, background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat._id)}
                            style={{ padding: '6px 12px', fontSize: 12, background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Add Tag Form */}
          <form onSubmit={handleAddTag} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <input
              type="text"
              value={tagName}
              onChange={e => setTagName(e.target.value)}
              placeholder="Nama tag baru..."
              style={{
                flex: 1,
                padding: '10px 16px',
                background: 'var(--color-bg-card)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 12,
                fontSize: 14,
                outline: 'none',
                color: 'var(--color-text-primary)',
              }}
            />
            <button type="submit" className="ka-btn-primary" style={{ padding: '10px 20px' }}>
              Tambah Tag
            </button>
          </form>

          {/* Tags List */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {tags.length === 0 ? (
              <p style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)', width: '100%' }}>Belum ada tag</p>
            ) : (
              tags.map(tag => (
                <div
                  key={tag._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 14px',
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{tag.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>({tag.postCount})</span>
                  <button
                    onClick={() => handleDeleteTag(tag._id, tag.name)}
                    style={{ padding: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                  >
                    <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingItem) && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--color-bg-card)',
            borderRadius: 16,
            padding: 28,
            width: '100%',
            maxWidth: 420,
            border: '1px solid var(--color-border)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              {editingItem ? 'Edit Kategori' : 'Tambah Kategori'}
            </h2>
            <form onSubmit={editingItem ? handleEditCategory : handleAddCategory}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Nama Kategori</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Pemrograman Web"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--color-bg-hover)',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 10,
                    fontSize: 14,
                    outline: 'none',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi kategori (opsional)"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--color-bg-hover)',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 10,
                    fontSize: 14,
                    outline: 'none',
                    color: 'var(--color-text-primary)',
                    resize: 'vertical',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingItem(null); }}
                  className="ka-btn-outline"
                >
                  Batal
                </button>
                <button type="submit" className="ka-btn-primary">
                  {editingItem ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}