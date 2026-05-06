import { useState, useEffect } from 'react';
import { api } from '../api';
import { useSession } from '../contexts/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';

const inputStyle = {
  width: '100%', background: 'var(--blood)', border: '1px solid var(--mid)',
  borderRadius: '6px', color: 'var(--cream)', fontFamily: 'DM Mono',
  fontSize: '0.78rem', padding: '0.5rem 0.65rem', outline: 'none',
};
const labelStyle = {
  fontFamily: 'DM Mono', fontSize: '0.6rem', letterSpacing: '1.5px',
  color: 'var(--light-mid)', display: 'block', marginBottom: '4px',
};

function CustomerDrawer({ customer, onClose, onSaved }) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({
    name:           customer?.name           || '',
    contact_name:   customer?.contact_name   || '',
    phone:          customer?.phone          || '',
    address:        customer?.address        || '',
    postcode:       customer?.postcode       || '',
    delivery_notes: customer?.delivery_notes || '',
    name_aliases:   Array.isArray(customer?.name_aliases)
                      ? customer.name_aliases.join(', ')
                      : (customer?.name_aliases || ''),
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.name.trim()) { setError('Shop name is required'); return; }
    setSaving(true); setError(null);
    try {
      const aliases = form.name_aliases.trim()
        ? form.name_aliases.split(',').map(s => s.trim()).filter(Boolean)
        : null;
      const payload = {
        name:           form.name.trim()          || null,
        contact_name:   form.contact_name.trim()  || null,
        phone:          form.phone.trim()          || null,
        address:        form.address.trim()        || null,
        postcode:       form.postcode.trim()       || null,
        delivery_notes: form.delivery_notes.trim() || null,
        name_aliases:   aliases,
      };
      let saved;
      if (customer?.id) saved = await api.updateCustomer(customer.id, payload);
      else              saved = await api.createCustomer(payload);
      await onSaved(saved);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const drawerStyle = isMobile ? {
    position: 'fixed', left: 0, right: 0, bottom: 0,
    background: 'var(--charcoal)', borderTop: '1px solid var(--mid)',
    borderRadius: '16px 16px 0 0',
    zIndex: 201, display: 'flex', flexDirection: 'column',
    maxHeight: '92vh',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.25)',
  } : {
    position: 'fixed', top: 0, right: 0, bottom: 0, width: '320px',
    background: 'var(--charcoal)', borderLeft: '1px solid var(--mid)',
    zIndex: 201, display: 'flex', flexDirection: 'column',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.25)',
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} />
      <div style={drawerStyle}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--mid)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'DM Mono', fontSize: '0.68rem', letterSpacing: '2px', color: 'var(--light-mid)' }}>
            {customer?.id ? 'EDIT CUSTOMER' : 'ADD CUSTOMER'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--light-mid)', cursor: 'pointer', fontSize: '1.1rem', minHeight: '44px', minWidth: '44px' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {error && (
            <div style={{
              color: '#DC2626', fontFamily: 'DM Mono', fontSize: '0.72rem',
              background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: '6px', padding: '0.5rem 0.75rem', lineHeight: 1.5,
            }}>✗ {error}</div>
          )}
          {[
            { k: 'name',         label: 'SHOP NAME *' },
            { k: 'contact_name', label: 'CONTACT NAME' },
            { k: 'phone',        label: 'PHONE' },
            { k: 'address',      label: 'ADDRESS' },
            { k: 'postcode',     label: 'POSTCODE' },
          ].map(({ k, label }) => (
            <div key={k}>
              <label style={labelStyle}>{label}</label>
              <input value={form[k]} onChange={e => update(k, e.target.value)} style={{ ...inputStyle, fontSize: '1rem' }} />
            </div>
          ))}

          <div>
            <label style={labelStyle}>DELIVERY NOTES</label>
            <textarea
              value={form.delivery_notes}
              onChange={e => update('delivery_notes', e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--mid)', paddingTop: '0.75rem' }}>
            <label style={labelStyle}>WHATSAPP ORDER NAME</label>
            <input
              value={form.name_aliases}
              onChange={e => update('name_aliases', e.target.value)}
              placeholder="e.g. Bob's Butchers, Bobby"
              style={{ ...inputStyle, fontSize: '1rem' }}
            />
            <div style={{ fontFamily: 'DM Mono', fontSize: '0.58rem', color: 'var(--light-mid)', marginTop: '5px', lineHeight: 1.5 }}>
              How this customer appears in order messages. Separate multiple names with commas.
            </div>
          </div>
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--mid)' }}>
          <button onClick={save} disabled={saving} style={{
            width: '100%', padding: isMobile ? '0.75rem' : '0.65rem',
            border: 'none', borderRadius: '8px',
            background: saving ? '#94A3B8' : 'var(--rust)', color: 'white',
            fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.82rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            marginBottom: isMobile ? '0.5rem' : 0,
          }}>
            {saving ? 'Saving…' : customer?.id ? 'Save Changes' : 'Add Customer'}
          </button>
        </div>
      </div>
    </>
  );
}

function CustomerRow({ customer, onEdit, onRemove }) {
  const [hovered, setHovered] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: isMobile ? '0.65rem 0.5rem' : '0.55rem 0.5rem',
        borderRadius: '6px',
        background: hovered ? 'var(--blood)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {customer.name}
        </div>
        <div style={{ fontSize: '0.67rem', color: 'var(--light-mid)', fontFamily: 'DM Mono', marginTop: '1px' }}>
          {[customer.postcode, customer.phone].filter(Boolean).join(' · ') || '—'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.3rem', opacity: isMobile || hovered ? 1 : 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
        <button onClick={() => onEdit(customer)} title="Edit" style={{
          background: 'var(--blood)', border: '1px solid var(--mid)', borderRadius: '4px',
          color: 'var(--light-mid)',
          padding: isMobile ? '6px 10px' : '3px 8px',
          cursor: 'pointer', fontSize: '0.75rem',
          minHeight: isMobile ? '40px' : undefined,
        }}>✎</button>
        <button onClick={() => onRemove(customer)} title="Remove" style={{
          background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
          borderRadius: '4px', color: '#DC2626',
          padding: isMobile ? '6px 9px' : '3px 7px',
          cursor: 'pointer', fontSize: '0.7rem',
          minHeight: isMobile ? '40px' : undefined,
        }}>✕</button>
      </div>
    </div>
  );
}

export default function CustomersPanel() {
  const session = useSession();
  const [customers,  setCustomers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [drawer,     setDrawer]     = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [search,     setSearch]     = useState('');
  const [savedName,  setSavedName]  = useState(null);

  useEffect(() => { load(); }, [session?.user?.id]);

  async function load() {
    if (!session?.user?.id) { setLoading(false); return; }
    setLoading(true);
    try { setCustomers((await api.customers()) || []); }
    catch (e) { console.error('Failed to load customers:', e.message); }
    finally { setLoading(false); }
  }

  function openAdd()   { setEditing(null); setDrawer(true); }
  function openEdit(c) { setEditing(c);    setDrawer(true); }
  function closeDrawer() { setDrawer(false); setEditing(null); }

  async function handleRemove(c) {
    if (!window.confirm(`Remove ${c.name}?\n\nThey will be hidden from new routes but order history is preserved.`)) return;
    try {
      await api.removeCustomer(c.id);
      setCustomers(prev => prev.filter(x => x.id !== c.id));
    } catch (e) { alert('Remove failed: ' + e.message); }
  }

  async function handleSaved(savedCustomer) {
    closeDrawer();
    if (editing?.id) {
      setCustomers(prev => prev.map(c => c.id === savedCustomer.id ? savedCustomer : c));
    } else {
      setCustomers(prev => [...prev, savedCustomer].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setSavedName(savedCustomer.name);
    setTimeout(() => setSavedName(null), 4000);
  }

  const filtered = search.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.postcode || '').toLowerCase().includes(search.toLowerCase())
      )
    : customers;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--mid)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontFamily: 'DM Mono', fontSize: '0.6rem', letterSpacing: '2px', color: 'var(--light-mid)' }}>
          {customers.length} CUSTOMERS
        </span>
        <button onClick={openAdd} style={{
          background: 'var(--rust)', border: 'none', borderRadius: '6px', color: 'white',
          fontFamily: 'DM Mono', fontSize: '0.65rem', letterSpacing: '1px',
          padding: '5px 12px', cursor: 'pointer', minHeight: '36px',
        }}>+ ADD</button>
      </div>

      {savedName && (
        <div style={{
          padding: '0.55rem 1rem', flexShrink: 0,
          background: 'rgba(5,150,105,0.08)', borderBottom: '1px solid rgba(5,150,105,0.25)',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontFamily: 'DM Mono', fontSize: '0.68rem', color: 'var(--green)',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {savedName} saved successfully
        </div>
      )}

      <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--mid)', flexShrink: 0 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or postcode…"
          style={{ ...inputStyle, fontSize: '0.74rem' }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem 0.5rem' }}>
        {loading ? (
          <div style={{ color: 'var(--light-mid)', fontFamily: 'DM Mono', fontSize: '0.75rem', textAlign: 'center', padding: '2rem 0' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--light-mid)', fontFamily: 'DM Mono', fontSize: '0.75rem', textAlign: 'center', padding: '2rem 0' }}>
            {search ? 'No matches' : 'No customers yet'}
          </div>
        ) : (
          filtered.map(c => <CustomerRow key={c.id} customer={c} onEdit={openEdit} onRemove={handleRemove} />)
        )}
      </div>

      {drawer && <CustomerDrawer customer={editing} onClose={closeDrawer} onSaved={handleSaved} />}
    </div>
  );
}
