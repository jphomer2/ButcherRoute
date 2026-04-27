import ParsePanel from './ParsePanel';

function MessageCard({ msg, selected, onClick }) {
  const parsed = msg.status === 'parsed';
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? 'var(--blood)' : 'var(--dark)',
        border: `1px solid ${selected ? 'var(--amber)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '8px', padding: '0.9rem', marginBottom: '0.6rem',
        cursor: 'pointer', transition: 'all 0.15s',
        borderLeft: `3px solid ${parsed ? 'var(--green)' : 'var(--amber)'}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', color: 'var(--light-mid)' }}>
          {msg.from_number || 'WhatsApp'}
        </div>
        <span style={{
          fontSize: '0.6rem', letterSpacing: '1px', padding: '2px 6px', borderRadius: '4px',
          background: parsed ? 'rgba(46,204,113,0.15)' : 'rgba(230,126,34,0.15)',
          color: parsed ? 'var(--green)' : 'var(--amber)',
          fontFamily: 'IBM Plex Mono', whiteSpace: 'nowrap',
        }}>
          {parsed ? '✓ PARSED' : '⏳ PENDING'}
        </span>
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--bone)', marginTop: '0.4rem', lineHeight: 1.4 }}>
        {msg.body?.slice(0, 80)}{msg.body?.length > 80 ? '…' : ''}
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', color: 'var(--mid)', marginTop: '0.4rem' }}>
        {msg.received_at ? new Date(msg.received_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
      </div>
    </div>
  );
}

export default function Sidebar({ messages, selectedMsg, onSelectMsg, onParsed, deliveryDate }) {
  return (
    <aside style={{
      background: 'var(--charcoal)', borderRight: '1px solid rgba(255,255,255,0.08)',
      width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      <ParsePanel onParsed={onParsed} deliveryDate={deliveryDate} />

      <div style={{ padding: '1rem 1.25rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.62rem', letterSpacing: '3px', color: 'var(--light-mid)' }}
          className="uppercase flex justify-between items-center">
          <span>WhatsApp Inbox</span>
          <span style={{ background: '#25D366', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.6rem' }}>
            WA
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        {messages.length === 0 ? (
          <div style={{ color: 'var(--mid)', fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', textAlign: 'center', marginTop: '2rem' }}>
            No messages yet.<br />Paste orders above to get started.
          </div>
        ) : (
          messages.map(msg => (
            <MessageCard
              key={msg.id}
              msg={msg}
              selected={selectedMsg?.id === msg.id}
              onClick={() => onSelectMsg(msg)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
