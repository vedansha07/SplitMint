import { useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({
  isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', isDestructive = true, onConfirm, onCancel,
}: ConfirmModalProps) => {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    if (isOpen) { window.addEventListener('keydown', h); document.body.style.overflow = 'hidden'; }
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = 'unset'; };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        background: 'rgba(17,16,8,0.5)',
        backdropFilter: 'blur(5px)',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-dark)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <p className="label-micro" style={{ marginBottom: '4px' }}>confirm action</p>
          <h2 style={{
            fontFamily: 'Playfair Display, serif', fontStyle: 'italic',
            fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text)',
          }}>{title}</h2>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', color: 'var(--text-mid)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
            {message}
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="btn btn-outline" style={{ height: '38px', padding: '0 16px', fontSize: '13px', justifyContent: 'center' }}>
            {cancelLabel}
          </button>
          <button
            onClick={() => { onConfirm(); onCancel(); }}
            className="btn"
            style={{
              height: '38px', padding: '0 18px', fontSize: '13px', justifyContent: 'center',
              background: isDestructive ? 'var(--accent-red)' : 'var(--text)',
              color: '#fff', border: 'none',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, borderRadius: '3px',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
