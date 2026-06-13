import { useState } from 'react';

export default function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const val = input.trim().toLowerCase();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput('');
  };

  const removeTag = (tag) => {
    onChange(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div>
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {tags.map(tag => (
            <span key={tag} className="ka-tag" style={{ gap: 6 }}>
              {tag}
              <button onClick={() => removeTag(tag)} style={{
                background: 'transparent', border: 'none', color: 'var(--color-primary)',
                cursor: 'pointer', fontWeight: 700, fontSize: 14, padding: 0,
                lineHeight: 1, opacity: 0.6
              }}>×</button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ketik tag lalu tekan Enter..."
        className="ka-input"
      />
    </div>
  );
}
