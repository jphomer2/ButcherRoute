import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RouteCard from './components/RouteCard';
import { api } from './api';

const TODAY = new Date().toISOString().split('T')[0];

export default function App() {
  const [stops,      setStops]      = useState([]);
  const [messages,   setMessages]   = useState([]);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [runStatus,  setRunStatus]  = useState('building');
  const [runId,      setRunId]      = useState(null);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    api.getRuns(TODAY)
      .then(runs => {
        if (runs?.length) {
          const run = runs[0];
          setRunId(run.id);
          setRunStatus(run.status);
          return api.getStops(run.id);
        }
      })
      .then(s => { if (s) setStops(s); })
      .catch(() => {});
  }, []);

  const handleParsed = useCallback(async (result) => {
    setStops(prev => {
      const existingIds = new Set(prev.map(s => s.id));
      const newStops = result.stops.filter(s => !existingIds.has(s.id));
      return [...prev, ...newStops];
    });

    setMessages(prev => {
      if (prev.find(m => m.id === result.message_id)) return prev;
      return [{
        id: result.message_id,
        body: `${result.stops.length} stops parsed`,
        status: 'parsed',
        received_at: new Date().toISOString(),
        from_number: 'WhatsApp',
      }, ...prev];
    });

    if (!runId) {
      try {
        const run = await api.createRun({ delivery_date: TODAY });
        setRunId(run.id);
        setRunStatus(run.status);
      } catch {}
    }
  }, [runId]);

  const handleDispatch = useCallback(async () => {
    if (!runId) return;
    try {
      await api.updateRun(runId, { status: 'dispatched' });
      setRunStatus('dispatched');
    } catch (e) {
      setError(e.message);
    }
  }, [runId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header runDate={TODAY} />

      {error && (
        <div style={{
          background: 'rgba(139,26,26,0.4)', borderBottom: '1px solid rgba(192,57,43,0.5)',
          padding: '0.5rem 1.5rem', fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', color: '#e88',
          display: 'flex', alignItems: 'center', gap: '1rem',
        }}>
          <span>✗ {error}</span>
          <button onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: '#e88', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          messages={messages}
          selectedMsg={selectedMsg}
          onSelectMsg={setSelectedMsg}
          onParsed={handleParsed}
          deliveryDate={TODAY}
        />
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <RouteCard
            stops={stops}
            runDate={TODAY}
            runStatus={runStatus}
            onDispatch={handleDispatch}
          />
        </main>
      </div>
    </div>
  );
}
