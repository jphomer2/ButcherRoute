import { useState } from 'react';
import { api } from '../api';

function Tag({ children, color }) {
  const colors = {
    red:   { bg: 'rgba(139,26,26,0.3)',  border: 'rgba(192,57,43,0.4)',  text: '#e88' },
    amber: { bg: 'rgba(230,126,34,0.15)', border: 'rgba(230,126,34,0.4)', text: 'var(--amber)' },
    green: { bg: 'rgba(46,204,113,0.15)', border: 'rgba(46,204,113,0.4)', text: 'var(--green)' },
    bone:  { bg: 'rgba(200,224,234,0.1)', border: 'rgba(200,224,234,0.2)', text: 'var(--bone)' },
  };
  const c = colors[color] || colors.bone;
  return (
    <span style={{
      fontSize: '0.6rem', background: c.bg, border: `1px solid ${c.border}`,
      color: c.text, padding: '1px 6px', borderRadius: '4px',
      fontFamily: 'DM Mono', letterSpacing: '0.5px',
    }}>
      {children}
    </span>
  );
}

function StopRow({ stop, index, onDelete, onUpdate }) {
  const [editingQty, setEditingQty] = useState(false);
  const [qtyVal, setQtyVal]         = useState(stop.quantity ?? '');
  const [saving, setSaving]         = useState(false);
  const [hovered, setHovered]       = useState(false);

  async function commitQty() {
    setEditingQty(false);
    const num = qtyVal === '' ? null : parseInt(qtyVal, 10);
    if (num === stop.quantity) return;
    setSaving(true);
    try {
      const updated = await api.updateStop(stop.id, { quantity: num });
      onUpdate(updated);
    } finally {
      setSaving(false);
    }
  }

  async function toggleTbc() {
    setSaving(true);
    try {
      const updated = await api.updateStop(stop.id, { tbc: !stop.tbc });
      onUpdate(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove ${stop.customers?.name || stop.customer_name_raw}?`)) return;
    await api.deleteStop(stop.id);
    onDelete(stop.id);
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.03)' : 'var(--dark)',
        borderRadius: '6px', padding: '0.75rem',
        marginBottom: '0.5rem', border: '1px solid rgba(255,255,255,0.06)',
        display: 'grid', gridTemplateColumns: '2rem 1fr auto', gap: '0.75rem', alignItems: 'start',
        transition: 'background 0.15s',
      }}
    >
      {/* Sequence number */}
      <div style={{
        width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600,
        background: index === 0 ? 'var(--rust)' : 'rgba(255,255,255,0.08)',
        border: index === 0 ? 'none' : '1px solid rgba(255,255,255,0.12)',
        color: index === 0 ? 'white' : 'var(--bone)', flexShrink: 0,
        fontFamily: 'DM Mono',
      }}>
        {index === 0 ? '⌂' : stop.route_sequence || index + 1}
      </div>

      {/* Customer info */}
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cream)' }}>
          {stop.customers?.name || stop.customer_name_raw}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--light-mid)', marginTop: '2px' }}>
          {stop.customers?.postcode || stop.delivery_postcode || '—'}
          {stop.notes && <span style={{ marginLeft: '0.5rem', color: 'var(--mid)' }}>{stop.notes}</span>}
        </div>
        <div className="flex gap-1 flex-wrap mt-1">
          {stop.early && <Tag color="amber">EARLY {stop.early_time?.slice(0,5)}</Tag>}
          {stop.tbc   && <Tag color="red">TBC</Tag>}
          {!stop.matched && <Tag color="bone">UNMATCHED</Tag>}
          {stop.quantity >= 150 && <Tag color="red">LARGE LOAD</Tag>}
        </div>
      </div>

      {/* Quantity + actions */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
        {/* Quantity — click to edit */}
        <div style={{ textAlign: 'right', fontFamily: 'DM Mono' }}>
          {editingQty ? (
            <input
              autoFocus
              type="number"
              value={qtyVal}
              onChange={e => setQtyVal(e.target.value)}
              onBlur={commitQty}
              onKeyDown={e => { if (e.key === 'Enter') commitQty(); if (e.key === 'Escape') setEditingQty(false); }}
              style={{
                width: '4rem', background: 'var(--charcoal)', border: '1px solid var(--amber)',
                borderRadius: '4px', color: 'var(--cream)', fontFamily: 'DM Mono',
                fontSize: '0.9rem', padding: '2px 4px', textAlign: 'right', outline: 'none',
              }}
            />
          ) : (
            <div
              onClick={() => setEditingQty(true)}
              title="Click to edit quantity"
              style={{
                fontSize: '0.9rem', color: saving ? 'var(--mid)' : 'var(--cream)',
                fontWeight: 500, cursor: 'text',
                borderBottom: hovered ? '1px dashed var(--light-mid)' : '1px dashed transparent',
              }}
            >
              {stop.quantity ?? '—'}
            </div>
          )}
          <div style={{ fontSize: '0.65rem', color: 'var(--light-mid)' }}>{stop.unit || 'cases'}</div>
        </div>

        {/* Action buttons — visible on hover */}
        <div style={{ display: 'flex', gap: '0.3rem', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
          <button
            onClick={toggleTbc}
            title={stop.tbc ? 'Mark confirmed' : 'Mark TBC'}
            style={{
              background: stop.tbc ? 'rgba(192,57,43,0.2)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${stop.tbc ? 'rgba(192,57,43,0.4)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '4px', color: stop.tbc ? '#e88' : 'var(--light-mid)',
              fontFamily: 'DM Mono', fontSize: '0.6rem', padding: '2px 6px', cursor: 'pointer',
            }}
          >
            {stop.tbc ? 'TBC ✓' : 'TBC?'}
          </button>
          <button
            onClick={handleDelete}
            title="Remove stop"
            style={{
              background: 'rgba(139,26,26,0.2)', border: '1px solid rgba(192,57,43,0.3)',
              borderRadius: '4px', color: '#e88', fontFamily: 'DM Mono',
              fontSize: '0.7rem', padding: '2px 8px', cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StopList({ stops, onDelete, onUpdate }) {
  if (!stops.length) {
    return (
      <div style={{ color: 'var(--mid)', fontFamily: 'DM Mono', fontSize: '0.8rem', textAlign: 'center', padding: '3rem 0' }}>
        No stops yet. Paste WhatsApp orders to build today's run.
      </div>
    );
  }

  const early  = stops.filter(s => s.early);
  const normal = stops.filter(s => !s.early);

  return (
    <div>
      {early.length > 0 && (
        <>
          <div style={{ fontFamily: 'DM Mono', fontSize: '0.62rem', letterSpacing: '3px', color: 'var(--amber)', marginBottom: '0.5rem' }}>
            ▲ PRIORITY — EARLY DROPS
          </div>
          {early.map((s, i) => (
            <StopRow key={s.id} stop={s} index={i} onDelete={onDelete} onUpdate={onUpdate} />
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0.75rem 0' }} />
        </>
      )}
      {normal.map((s, i) => (
        <StopRow key={s.id} stop={s} index={early.length + i} onDelete={onDelete} onUpdate={onUpdate} />
      ))}
    </div>
  );
}
