import { useState } from 'react';
import { api } from '../api';

function Tag({ children, color }) {
  const colors = {
    red:   { bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.25)',  text: '#DC2626' },
    amber: { bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.25)',  text: 'var(--amber)' },
    green: { bg: 'rgba(5,150,105,0.08)',  border: 'rgba(5,150,105,0.25)',  text: 'var(--green)' },
    bone:  { bg: 'var(--blood)',           border: 'var(--mid)',            text: 'var(--light-mid)' },
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

function StopRow({ stop, index, onDelete, onUpdate, locked }) {
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
    try {
      await api.deleteStop(stop.id);
      onDelete(stop.id);
    } catch (e) {
      alert('Failed to remove stop: ' + e.message);
    }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered && !locked ? 'var(--blood)' : 'var(--charcoal)',
        borderRadius: '6px', padding: '0.75rem',
        marginBottom: '0.5rem', border: '1px solid var(--mid)',
        display: 'grid', gridTemplateColumns: '2rem 1fr auto', gap: '0.75rem', alignItems: 'start',
        transition: 'background 0.15s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      {/* Sequence number */}
      <div style={{
        width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600,
        background: index === 0 ? 'var(--rust)' : 'var(--blood)',
        border: index === 0 ? 'none' : '1px solid var(--mid)',
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
          {stop.notes && <span style={{ marginLeft: '0.5rem', color: 'var(--light-mid)' }}>{stop.notes}</span>}
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
        <div style={{ textAlign: 'right', fontFamily: 'DM Mono' }}>
          {editingQty && !locked ? (
            <input
              autoFocus
              type="number"
              value={qtyVal}
              onChange={e => setQtyVal(e.target.value)}
              onBlur={commitQty}
              onKeyDown={e => { if (e.key === 'Enter') commitQty(); if (e.key === 'Escape') setEditingQty(false); }}
              style={{
                width: '4rem', background: 'var(--blood)', border: '1px solid var(--amber)',
                borderRadius: '4px', color: 'var(--cream)', fontFamily: 'DM Mono',
                fontSize: '0.9rem', padding: '2px 4px', textAlign: 'right', outline: 'none',
              }}
            />
          ) : (
            <div
              onClick={() => !locked && setEditingQty(true)}
              title={locked ? undefined : 'Click to edit quantity'}
              style={{
                fontSize: '0.9rem', color: saving ? 'var(--light-mid)' : 'var(--cream)',
                fontWeight: 500, cursor: locked ? 'default' : 'text',
                borderBottom: hovered && !locked ? '1px dashed var(--light-mid)' : '1px dashed transparent',
              }}
            >
              {stop.quantity ?? '—'}
            </div>
          )}
          <div style={{ fontSize: '0.65rem', color: 'var(--light-mid)' }}>{stop.unit || 'cases'}</div>
        </div>

        {/* Action buttons — hidden when locked */}
        {!locked && (
          <div className="stop-actions" style={{ display: 'flex', gap: '0.3rem', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
            <button
              onClick={toggleTbc}
              title={stop.tbc ? 'Mark confirmed' : 'Mark TBC'}
              className="stop-action-btn"
              style={{
                background: stop.tbc ? 'rgba(220,38,38,0.08)' : 'var(--blood)',
                border: `1px solid ${stop.tbc ? 'rgba(220,38,38,0.25)' : 'var(--mid)'}`,
                borderRadius: '4px', color: stop.tbc ? '#DC2626' : 'var(--light-mid)',
                fontFamily: 'DM Mono', fontSize: '0.6rem', padding: '2px 6px', cursor: 'pointer',
              }}
            >
              {stop.tbc ? 'TBC ✓' : 'TBC?'}
            </button>
            <button
              onClick={handleDelete}
              title="Remove stop"
              className="stop-action-btn"
              style={{
                background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
                borderRadius: '4px', color: '#DC2626', fontFamily: 'DM Mono',
                fontSize: '0.7rem', padding: '2px 8px', cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StopList({ stops, onDelete, onUpdate, locked }) {
  if (!stops.length) {
    return (
      <div style={{ color: 'var(--light-mid)', fontFamily: 'DM Mono', fontSize: '0.8rem', textAlign: 'center', padding: '3rem 0' }}>
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
            <StopRow key={s.id} stop={s} index={i} onDelete={onDelete} onUpdate={onUpdate} locked={locked} />
          ))}
          <div style={{ borderTop: '1px solid var(--mid)', margin: '0.75rem 0' }} />
        </>
      )}
      {normal.map((s, i) => (
        <StopRow key={s.id} stop={s} index={early.length + i} onDelete={onDelete} onUpdate={onUpdate} locked={locked} />
      ))}
    </div>
  );
}
