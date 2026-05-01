import { useState, useEffect } from 'react';
import { api } from '../api';

const inputStyle = {
  width: '100%', background: 'var(--blood)', border: '1px solid var(--mid)',
  borderRadius: '6px', color: 'var(--cream)', fontFamily: 'DM Mono',
  fontSize: '0.78rem', padding: '0.5rem 0.65rem', outline: 'none',
};
const labelStyle = {
  fontFamily: 'DM Mono', fontSize: '0.6rem', letterSpacing: '1.5px',
  color: 'var(--light-mid)', display: 'block', marginBottom: '4px',
};

function DriverDrawer({ driver, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:            driver?.name            || '',
    phone:           driver?.phone           || '',
    whatsapp_number: driver?.whatsapp_number || '',
    vehicle_reg:     driver?.vehicle_reg     || driver?.van_plate || '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        name:            form.name.trim()            || null,
        phone:           form.phone.trim()           || null,
        whatsapp_number: form.whatsapp_number.trim() || null,
        vehicle_reg:     form.vehicle_reg.trim()     || null,
      };
      if (driver?.id) await api.updateDriver(driver.id, payload);
      else            await api.createDriver(payload);
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 310 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '320px',
        background: 'var(--charcoal)', borderLeft: '1px solid var(--mid)',
        zIndex: 311, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--mid)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'DM Mono', fontSize: '0.68rem', letterSpacing: '2px', color: 'var(--light-mid)' }}>
            {driver?.id ? 'EDIT DRIVER' : 'ADD DRIVER'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--light-mid)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { k: 'name',            label: 'FULL NAME *' },
            { k: 'phone',           label: 'PHONE' },
            { k: 'whatsapp_number', label: 'WHATSAPP NUMBER' },
            { k: 'vehicle_reg',     label: 'VEHICLE REG' },
          ].map(({ k, label }) => (
            <div key={k}>
              <label style={labelStyle}>{label}</label>
              <input value={form[k]} onChange={e => update(k, e.target.value)} style={inputStyle} />
            </div>
          ))}
          {error && <div style={{ color: '#DC2626', fontFamily: 'DM Mono', fontSize: '0.7rem' }}>✗ {error}</div>}
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--mid)' }}>
          <button onClick={save} disabled={saving} style={{
            width: '100%', padding: '0.65rem', border: 'none', borderRadius: '8px',
            background: saving ? '#94A3B8' : 'var(--rust)', color: 'white',
            fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.82rem',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Saving…' : driver?.id ? 'Save Changes' : 'Add Driver'}
          </button>
        </div>
      </div>
    </>
  );
}

function DriverRow({ driver, onEdit, onRemove }) {
  const [hovered, setHovered] = useState(false);
  const initials = driver.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.65rem 0.75rem', borderRadius: '8px',
        background: hovered ? 'var(--blood)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        background: 'var(--blood)', border: '2px solid var(--rust)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'DM Mono', fontSize: '0.75rem', color: 'var(--cream)', fontWeight: 600,
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cream)' }}>{driver.name}</div>
        <div style={{ fontSize: '0.68rem', color: 'var(--light-mid)', fontFamily: 'DM Mono', marginTop: '1px' }}>
          {[driver.vehicle_reg || driver.van_plate, driver.phone].filter(Boolean).join(' · ') || '—'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.3rem', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
        <button onClick={() => onEdit(driver)} title="Edit" style={{
          background: 'var(--blood)', border: '1px solid var(--mid)', borderRadius: '4px',
          color: 'var(--light-mid)', padding: '3px 8px', cursor: 'pointer', fontSize: '0.75rem',
        }}>✎</button>
        <button onClick={() => onRemove(driver)} title="Remove" style={{
          background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
          borderRadius: '4px', color: '#DC2626', padding: '3px 7px', cursor: 'pointer', fontSize: '0.7rem',
        }}>✕</button>
      </div>
    </div>
  );
}

export default function DriversModal({ open, onClose }) {
  const [drivers,  setDrivers]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [drawer,   setDrawer]   = useState(false);
  const [editing,  setEditing]  = useState(null);

  useEffect(() => {
    if (open) load();
  }, [open]);

  async function load() {
    setLoading(true);
    try { setDrivers((await api.drivers()) || []); }
    catch {}
    finally { setLoading(false); }
  }

  function openAdd()   { setEditing(null); setDrawer(true); }
  function openEdit(d) { setEditing(d);    setDrawer(true); }
  function closeDrawer() { setDrawer(false); setEditing(null); }

  async function handleRemove(d) {
    if (!window.confirm(`Remove ${d.name}?`)) return;
    try {
      await api.removeDriver(d.id);
      setDrivers(prev => prev.filter(x => x.id !== d.id));
    } catch (e) { alert('Remove failed: ' + e.message); }
  }

  async function handleSaved() { closeDrawer(); await load(); }

  if (!open) return null;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div style={{
        background: 'var(--charcoal)', border: '1px solid var(--mid)',
        borderRadius: '12px', width: '100%', maxWidth: '480px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--mid)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'DM Mono', fontSize: '0.65rem', letterSpacing: '3px', color: 'var(--light-mid)' }}>DRIVERS</div>
            <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.1rem', color: 'var(--cream)', marginTop: '2px' }}>Manage Drivers</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={openAdd} style={{
              background: 'var(--rust)', border: 'none', borderRadius: '6px', color: 'white',
              fontFamily: 'DM Mono', fontSize: '0.65rem', letterSpacing: '1px',
              padding: '6px 14px', cursor: 'pointer',
            }}>+ ADD</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--light-mid)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px' }}>✕</button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.5rem' }}>
          {loading ? (
            <div style={{ color: 'var(--light-mid)', fontFamily: 'DM Mono', fontSize: '0.75rem', textAlign: 'center', padding: '2rem 0' }}>Loading…</div>
          ) : drivers.length === 0 ? (
            <div style={{ color: 'var(--light-mid)', fontFamily: 'DM Mono', fontSize: '0.75rem', textAlign: 'center', padding: '2rem 0' }}>
              No drivers yet — add your first driver above.
            </div>
          ) : (
            drivers.map(d => <DriverRow key={d.id} driver={d} onEdit={openEdit} onRemove={handleRemove} />)
          )}
        </div>
      </div>

      {drawer && <DriverDrawer driver={editing} onClose={closeDrawer} onSaved={handleSaved} />}
    </div>
  );
}
