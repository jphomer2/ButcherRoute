import { useState } from 'react';
import { api } from '../api';

export default function ParsePanel({ onParsed, deliveryDate }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.parseMessage({ message: text.trim(), delivery_date: deliveryDate });
      onParsed(result);
      setText('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'var(--charcoal)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      className="p-4">
      <div style={{ fontFamily: 'DM Mono', fontSize: '0.62rem', letterSpacing: '3px', color: 'var(--light-mid)' }}
        className="uppercase mb-2">Paste WhatsApp Orders</div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={"Morning all — orders for tomorrow:\nWilliam White - 145 cases EARLY 06:00\nThe Black Horse - 12 cases\nMilling Barn - tbc"}
        rows={5}
        style={{
          width: '100%', background: 'var(--dark)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '6px', color: 'var(--cream)', fontFamily: 'DM Mono',
          fontSize: '0.78rem', padding: '0.75rem', resize: 'vertical', outline: 'none',
        }}
        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleParse(); }}
      />

      {error && (
        <div style={{ color: '#e88', fontFamily: 'DM Mono', fontSize: '0.72rem', marginTop: '0.4rem' }}>
          ✗ {error}
        </div>
      )}

      <button
        onClick={handleParse}
        disabled={loading || !text.trim()}
        style={{
          marginTop: '0.6rem', width: '100%', padding: '0.6rem',
          background: loading ? 'var(--mid)' : 'var(--rust)',
          border: 'none', borderRadius: '6px', color: 'var(--cream)',
          fontFamily: 'DM Mono', fontSize: '0.78rem', letterSpacing: '1px',
          cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
        }}
      >
        {loading ? 'PARSING WITH AI...' : 'PARSE ORDERS  ⌘↵'}
      </button>
    </div>
  );
}
