import { useState } from 'react';
import { api } from '../api';
import { useIsMobile } from '../hooks/useIsMobile';

const EXAMPLE_ORDER = `Morning all, orders for tomorrow:
Magpie - 20 cases
Funky Monk - 15 cases
The Black Horse - 12 cases
Garnon & Bushes - 18 cases`;

export default function ParsePanel({ onParsed, deliveryDate }) {
  const isMobile = useIsMobile();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  function handleChange(e) {
    const val = e.target.value;
    setNotice(null);
    if (val.trim() === '/example') {
      setNotice('Hit Parse Orders to load 4 real demo stops instantly — no AI needed.');
    }
    setText(val);
  }

  async function handleParse() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      // /example bypasses Claude and directly loads real Suffolk Farms customers
      const result = trimmed === '/example'
        ? await api.loadExample(deliveryDate)
        : await api.parseMessage({ message: trimmed, delivery_date: deliveryDate });
      onParsed(result);
      if (!result.stops?.length) {
        setNotice('All stops in this message are already in today\'s run — loaded below.');
      } else {
        setText('');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'var(--charcoal)', borderBottom: '1px solid var(--mid)', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <div style={{ fontFamily: 'DM Mono', fontSize: '0.6rem', letterSpacing: '2px', color: 'var(--light-mid)' }}>
          PASTE WHATSAPP ORDERS
        </div>
        <div style={{ fontFamily: 'DM Mono', fontSize: '0.58rem', color: 'var(--light-mid)', opacity: 0.6 }}>
          type /example to load a test order
        </div>
      </div>

      <textarea
        value={text}
        onChange={handleChange}
        placeholder={"Morning all — orders for tomorrow:\nBlack Horse - 30 cases EARLY 06:00\nMagpie - 20 cases\nMilling Barn - tbc"}
        rows={isMobile ? 3 : 5}
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

      {notice && (
        <div style={{ color: 'var(--amber)', fontFamily: 'DM Mono', fontSize: '0.7rem', marginTop: '0.4rem' }}>
          ⚠ {notice}
        </div>
      )}

      <button
        onClick={handleParse}
        disabled={loading || !text.trim()}
        className="parse-btn"
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
