import { Link } from 'react-router-dom';
import { formatDate, truncate } from '../utils/formatDate';

export default function PostCard({ post }) {
  const isSolved = post.isSolved;
  const author = post.authorId?.username || 'Anonim';
  const category = post.categoryId?.name || '';
  const tags = post.tags || [];
  const upvoteCount = post.upvoteCount ?? post.upvotes?.length ?? 0;
  const commentCount = post.commentCount ?? 0;

  return (
    <Link to={`/forum/${post._id}`} className={`ka-post-card ${isSolved ? 'solved' : ''}`}>
      <div style={{ display: 'flex', gap: 24 }}>
        {/* Votes column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <div className="ka-vote-box" style={{
            color: upvoteCount > 0 ? 'var(--color-primary)' : undefined
          }}>
            <div className="num">{upvoteCount}</div>
            <div className="lbl">votes</div>
          </div>
          <div className="ka-vote-box" style={{
            color: isSolved ? 'var(--color-solved)' : undefined
          }}>
            <div className="num">{commentCount}</div>
            <div className="lbl">jawaban</div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {category && <span className="ka-badge ka-badge-category">{category}</span>}
            {isSolved && <span className="ka-badge ka-badge-solved">Terjawab</span>}
          </div>

          {/* Title */}
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8, lineHeight: 1.4 }}>
            {post.title}
          </h3>

          {/* Body preview */}
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
            {truncate(post.body, 150)}
          </p>

          {/* Footer: tags + meta */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tags.map((tag) => (
                <span key={tag._id} className="ka-tag" style={{ fontSize: 11 }}>{tag.name}</span>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--color-text-muted)', flexShrink: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  );
}
