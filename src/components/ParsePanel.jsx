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
    <div style={{ background: 'var(--charcoal)', borderBottom: '1px solid var(--mid)', padding: '1rem' }}>
      <div style={{ fontFamily: 'DM Mono', fontSize: '0.6rem', letterSpacing: '2px', color: 'var(--light-mid)', marginBottom: '0.6rem' }}>
        PASTE WHATSAPP ORDERS
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={"Morning all — orders for tomorrow:\nBlack Horse - 30 cases EARLY 06:00\nMagpie - 20 cases\nMilling Barn - tbc"}
        rows={5}
        style={{
          width: '100%', background: 'var(--blood)', border: '1px solid var(--mid)',
          borderRadius: '8px', color: 'var(--cream)', fontFamily: 'DM Mono',
          fontSize: '0.76rem', padding: '0.75rem', resize: 'vertical', outline: 'none',
          lineHeight: 1.6, transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--rust)'}
        onBlur={e => e.target.style.borderColor = 'var(--mid)'}
        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleParse(); }}
      />

      {error && (
        <div style={{ color: '#DC2626', fontFamily: 'DM Mono', fontSize: '0.7rem', marginTop: '0.4rem' }}>
          ✗ {error}
        </div>
      )}

      <button
        onClick={handleParse}
        disabled={loading || !text.trim()}
        style={{
          marginTop: '0.6rem', width: '100%', padding: '0.6rem',
          background: loading || !text.trim() ? '#94A3B8' : 'var(--rust)',
          border: 'none', borderRadius: '8px', color: 'white',
          fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.82rem',
          cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {loading ? 'Parsing with AI…' : 'Parse Orders'}
      </button>
    </div>
  );
}
