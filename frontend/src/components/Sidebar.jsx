import { useState } from 'react';
import ParsePanel from './ParsePanel';
import CustomersPanel from './CustomersPanel';

function MessageCard({ msg, selected, onClick }) {
  const parsed = msg.status === 'parsed';
  return (
    <div onClick={onClick} style={{
      background: selected ? 'rgba(15,118,110,0.06)' : 'var(--charcoal)',
      border: `1px solid ${selected ? 'rgba(15,118,110,0.3)' : 'var(--mid)'}`,
      borderRadius: '8px', padding: '0.85rem', marginBottom: '0.5rem',
      cursor: 'pointer', transition: 'all 0.15s',
      borderLeft: `3px solid ${parsed ? 'var(--green)' : 'var(--amber)'}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div className="flex items-start justify-between gap-2">
        <div style={{ fontFamily: 'DM Mono', fontSize: '0.7rem', color: 'var(--light-mid)', fontWeight: 500 }}>
          {msg.from_number || 'WhatsApp'}
        </div>
        <span style={{
          fontSize: '0.6rem', letterSpacing: '0.5px', padding: '2px 8px', borderRadius: '20px',
          background: parsed ? 'rgba(5,150,105,0.1)' : 'rgba(217,119,6,0.1)',
          color: parsed ? 'var(--green)' : 'var(--amber)',
          fontFamily: 'DM Mono', whiteSpace: 'nowrap',
          border: `1px solid ${parsed ? 'rgba(5,150,105,0.25)' : 'rgba(217,119,6,0.25)'}`,
        }}>
          {parsed ? '✓ Parsed' : '⏳ Pending'}
        </span>
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--bone)', marginTop: '0.4rem', lineHeight: 1.4 }}>
        {msg.body?.slice(0, 80)}{msg.body?.length > 80 ? '…' : ''}
      </div>
      <div style={{ fontFamily: 'DM Mono', fontSize: '0.62rem', color: 'var(--light-mid)', marginTop: '0.4rem' }}>
        {msg.received_at ? new Date(msg.received_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
      </div>
    </div>
  );
}

const TAB_BTN = (active) => ({
  flex: 1, padding: '0.55rem 0', border: 'none', cursor: 'pointer', background: 'transparent',
  borderBottom: `2px solid ${active ? 'var(--rust)' : 'transparent'}`,
  fontFamily: 'DM Mono', fontSize: '0.62rem', letterSpacing: '1.5px',
  color: active ? 'var(--rust)' : 'var(--light-mid)',
  transition: 'all 0.15s',
  minHeight: '44px',
});

export default function Sidebar({ messages, selectedMsg, onSelectMsg, onParsed, deliveryDate, panelResetKey }) {
  const [tab, setTab] = useState('orders');

  return (
    <aside style={{
      background: 'var(--blood)', borderRight: '1px solid var(--mid)',
      width: '100%', maxWidth: '360px', flexShrink: 0, display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--mid)', background: 'var(--charcoal)', flexShrink: 0 }}>
        <button style={TAB_BTN(tab === 'orders')}    onClick={() => setTab('orders')}>ORDERS</button>
        <button style={TAB_BTN(tab === 'customers')} onClick={() => setTab('customers')}>CUSTOMERS</button>
      </div>

      {tab === 'orders' ? (
        <>
          <ParsePanel key={panelResetKey} onParsed={onParsed} deliveryDate={deliveryDate} />

          <div style={{ padding: '0.9rem 1rem 0.5rem', borderBottom: '1px solid var(--mid)', flexShrink: 0 }}>
            <div style={{ fontFamily: 'DM Mono', fontSize: '0.6rem', letterSpacing: '2px', color: 'var(--light-mid)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>WHATSAPP INBOX</span>
              <span style={{ background: '#25D366', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.58rem' }}>WA</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}>
            {messages.length === 0 ? (
              <div style={{ color: 'var(--light-mid)', fontFamily: 'DM Mono', fontSize: '0.72rem', textAlign: 'center', marginTop: '2rem', lineHeight: 1.8 }}>
                No messages yet.<br />Paste orders above to get started.
              </div>
            ) : (
              messages.map(msg => (
                <MessageCard key={msg.id} msg={msg} selected={selectedMsg?.id === msg.id} onClick={() => onSelectMsg(msg)} />
              ))
            )}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <CustomersPanel />
        </div>
      )}
    </aside>
  );
}
