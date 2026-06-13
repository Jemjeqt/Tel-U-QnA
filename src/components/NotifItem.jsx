import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/formatDate';

const typeConfig = {
  new_answer: { label: 'Jawaban Baru', color: 'var(--color-primary)' },
  answer_accepted: { label: 'Jawaban Diterima', color: 'var(--color-solved)' },
  new_reply: { label: 'Balasan Baru', color: 'var(--color-primary)' },
};

export default function NotifItem({ notification, onRead }) {
  const navigate = useNavigate();
  const config = typeConfig[notification.type] || { label: 'Notifikasi', color: 'var(--color-primary)' };
  const isUnread = !notification.isRead;

  const handleClick = async () => {
    // Mark as read first
    if (isUnread) {
      await onRead(notification._id);
    }
    // Navigate to the related post
    if (notification.postId) {
      navigate(`/forum/${notification.postId}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`ka-notif ${isUnread ? 'unread' : ''} animate-in`}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: config.color }}>{config.label}</span>
            {isUnread && (
              <span className="pulse-dot" style={{ width: 8, height: 8, background: 'var(--color-primary)', borderRadius: '50%' }} />
            )}
          </div>
          <p style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.5, marginBottom: 6 }}>{notification.message}</p>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDate(notification.createdAt)}</span>
        </div>
        {/* Arrow indicator */}
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 12, color: 'var(--color-border-hover)', flexShrink: 0 }}>
          <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
