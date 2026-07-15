import { useEffect, useRef } from 'react';

interface AiModalProps {
  isOpen: boolean;
  title: string;
  content: string;
  isLoading: boolean;
  error?: string;
  onClose: () => void;
}

export const AiModal = ({ isOpen, title, content, isLoading, error, onClose }: AiModalProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', h);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        background: 'rgba(17,16,8,0.55)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div ref={ref} style={{
        width: '100%', maxWidth: '520px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-dark)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>

        {/* Header — styled like the template's section headers */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-dark)',
          background: 'var(--bg-dark)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '16px', color: '#f5ede6' }}>✦</span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontWeight: 700, fontSize: '18px', color: '#f5ede6', margin: 0 }}>
              {title}
            </h2>
            <span className="label-micro" style={{ background: 'rgba(245,237,230,0.12)', border: '1px solid rgba(245,237,230,0.2)', color: 'rgba(245,237,230,0.6)', borderRadius: '2px', padding: '2px 8px' }}>
              MintSense
            </span>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(245,237,230,0.5)', cursor: 'pointer', fontSize: '14px', padding: '4px', lineHeight: 1, transition: 'color 150ms ease' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f5ede6')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,237,230,0.5)')}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 24px', minHeight: '120px', display: 'flex', alignItems: isLoading ? 'center' : 'flex-start', justifyContent: isLoading ? 'center' : 'flex-start' }}>
          {isLoading && (
            <div style={{ textAlign: 'center', width: '100%' }}>
              <span className="spinner" style={{ display: 'block', fontSize: '28px', color: 'var(--text-mid)', marginBottom: '12px' }}>✦</span>
              <p style={{ fontFamily: 'Inter, sans-serif', color: 'var(--text-mid)', fontSize: '14px', margin: 0 }}>Thinking…</p>
            </div>
          )}
          {!isLoading && error && (
            <div style={{ width: '100%', background: 'rgba(201,64,64,0.06)', border: '1px solid rgba(201,64,64,0.18)', borderRadius: '3px', padding: '14px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', color: 'var(--accent-red)', fontSize: '14px', margin: 0 }}>⚠ {error}</p>
            </div>
          )}
          {!isLoading && !error && content && (
            <div style={{ borderLeft: '2px solid var(--border-dark)', paddingLeft: '16px', width: '100%' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', color: 'var(--text)', fontSize: '14px', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
                {content}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-outline" style={{ height: '36px', padding: '0 16px', fontSize: '13px', justifyContent: 'center' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
