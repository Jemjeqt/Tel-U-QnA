import { Link } from 'react-router-dom';
import { formatDate, truncate } from '../utils/formatDate';
import { swal } from '../utils/swal';

export default function PostCard({ post, onDelete, onRestore, isAdmin = false }) {
  const isSolved = post.isSolved;
  const isDeleted = post.isDeleted;
  const author = post.authorId?.username || 'Anonim';
  const category = post.categoryId?.name || '';
  const tags = post.tags || [];
  const upvoteCount = post.upvoteCount ?? post.upvotes?.length ?? 0;
  const commentCount = post.commentCount ?? 0;

  const handleAdminAction = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDeleted) {
      const result = await swal.confirm(
        'Pulihkan Post',
        `Apakah Anda yakin ingin memulihkan pertanyaan "${post.title}"?`,
        'Pulihkan',
        'Batal'
      );
      if (result.isConfirmed && onRestore) {
        onRestore(post._id);
      }
    } else {
      const result = await swal.confirm(
        'Hapus Post',
        `Apakah Anda yakin ingin menghapus pertanyaan "${post.title}"?`,
        'Hapus',
        'Batal'
      );
      if (result.isConfirmed && onDelete) {
        onDelete(post._id);
      }
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {isAdmin && (
        <button
          onClick={handleAdminAction}
          title={isDeleted ? 'Pulihkan' : 'Hapus'}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 10,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            background: isDeleted ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            color: isDeleted ? 'var(--color-solved)' : 'var(--color-danger)',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDeleted ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDeleted ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
          }}
        >
          {isDeleted ? 'Pulihkan' : 'Hapus'}
        </button>
      )}
      <Link
        to={isDeleted ? '#' : `/forum/${post._id}`}
        onClick={(e) => isDeleted && e.preventDefault()}
        style={{
          display: 'block',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          padding: 20,
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          opacity: isDeleted ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isDeleted) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
            e.currentTarget.style.borderColor = 'var(--color-border-hover)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
      >
        <div style={{ display: 'flex', gap: 20 }}>
          {/* Votes column */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            flexShrink: 0,
            padding: '4px 0',
          }}>
            <div style={{
              textAlign: 'center',
              padding: '10px 12px',
              background: upvoteCount > 0 ? 'rgba(59,130,246,0.1)' : 'var(--color-bg-hover)',
              borderRadius: 12,
              minWidth: 60,
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: upvoteCount > 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)', lineHeight: 1.2 }}>{upvoteCount}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 500 }}>votes</div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '10px 12px',
              background: isSolved ? 'rgba(16,185,129,0.1)' : 'var(--color-bg-hover)',
              borderRadius: 12,
              minWidth: 60,
              border: isSolved ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: isSolved ? 'var(--color-solved)' : 'var(--color-text-secondary)', lineHeight: 1.2 }}>{commentCount}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 500 }}>jawaban</div>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              {isDeleted && (
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'rgba(239,68,68,0.12)',
                  color: 'var(--color-danger)',
                }}>
                  Dihapus
                </span>
              )}
              {category && (
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'rgba(59,130,246,0.12)',
                  color: 'var(--color-primary)',
                }}>
                  {category}
                </span>
              )}
              {isSolved && (
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'rgba(16,185,129,0.12)',
                  color: 'var(--color-solved)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Terjawab
                </span>
              )}
            </div>

            {/* Title */}
            <h3 style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 8,
              lineHeight: 1.4,
            }}>
              {post.title}
            </h3>

            {/* Body preview */}
            <p style={{
              fontSize: 14,
              color: 'var(--color-text-secondary)',
              marginBottom: 14,
              lineHeight: 1.6,
            }}>
              {truncate(post.body, 140)}
            </p>

            {/* Footer: tags + meta */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tags.slice(0, 3).map((tag) => (
                  <span key={tag._id} style={{
                    padding: '4px 8px',
                    background: 'var(--color-bg-hover)',
                    borderRadius: 6,
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    fontWeight: 500,
                  }}>
                    #{tag.name}
                  </span>
                ))}
                {tags.length > 3 && (
                  <span style={{
                    padding: '4px 8px',
                    background: 'var(--color-bg-hover)',
                    borderRadius: 6,
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    fontWeight: 500,
                  }}>
                    +{tags.length - 3}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {post.viewCount}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{author}</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}