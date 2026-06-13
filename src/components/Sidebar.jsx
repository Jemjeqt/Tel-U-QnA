import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Sidebar({ activeCategory, onCategoryChange, activeStatus, onStatusChange }) {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data)).catch(() => { });
    api.get('/tags').then(res => setTags(res.data)).catch(() => { });
  }, []);

  const menuItems = [
    { label: 'Semua Pertanyaan', status: '' },
    { label: 'Belum Terjawab', status: 'unsolved' },
    { label: 'Sudah Terjawab', status: 'solved' },
  ];

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Menu */}
      <div className="ka-card" style={{ padding: 20 }}>
        <div className="ka-section-label">Menu</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {menuItems.map((item) => (
            <button
              key={item.status}
              onClick={() => onStatusChange(item.status)}
              className={`ka-sidebar-item ${activeStatus === item.status ? 'active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="ka-card" style={{ padding: 20 }}>
        <div className="ka-section-label">Kategori</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            onClick={() => onCategoryChange('')}
            className={`ka-sidebar-item ${!activeCategory ? 'active' : ''}`}
          >
            Semua Kategori
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => onCategoryChange(cat._id)}
              className={`ka-sidebar-item ${activeCategory === cat._id ? 'active' : ''}`}
            >
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
              <span className="count">{cat.postCount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="ka-card" style={{ padding: 20 }}>
        <div className="ka-section-label">Tag Populer</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tags.map((tag) => (
            <span key={tag._id} className="ka-tag">
              {tag.name}
              <span style={{ opacity: 0.6 }}>({tag.postCount})</span>
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
