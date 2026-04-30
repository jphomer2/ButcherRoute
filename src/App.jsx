import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RouteCard from './components/RouteCard';
import DateBar from './components/DateBar';
import { api } from './api';

const TODAY = new Date().toISOString().split('T')[0];

export default function App() {
  const [date,       setDate]       = useState(TODAY);
  const [stops,      setStops]      = useState([]);
  const [messages,   setMessages]   = useState([]);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [runStatus,  setRunStatus]  = useState('building');
  const [runId,      setRunId]      = useState(null);
  const [runMiles,   setRunMiles]   = useState(null);
  const [runMinutes, setRunMinutes] = useState(null);
  const [optimising, setOptimising] = useState(false);
  const [error,      setError]      = useState(null);

  // Load run + stops whenever date changes
  useEffect(() => {
    setStops([]);
    setRunId(null);
    setRunStatus('building');
    setRunMiles(null);
    setRunMinutes(null);
    api.getRuns(date)
      .then(runs => {
        if (runs?.length) {
          const run = runs[0];
          setRunId(run.id);
          setRunStatus(run.status);
          setRunMiles(run.total_miles);
          setRunMinutes(run.est_drive_minutes);
          return api.getStops(run.id);
        }
      })
      .then(s => { if (s) setStops(s); })
      .catch(() => {});
  }, [date]);

  const handleParsed = useCallback(async (result) => {
    if (!result.stops.length) {
      // No new stops — but if the UI state is empty, load existing stops from DB
      if (result.run_id && !runId) {
        setRunId(result.run_id);
        try {
          const [s, runs] = await Promise.all([
            api.getStops(result.run_id),
            api.getRuns(date),
          ]);
          if (s?.length) setStops(s);
          if (runs?.length) {
            const run = runs[0];
            setRunStatus(run.status);
            setRunMiles(run.total_miles);
            setRunMinutes(run.est_drive_minutes);
          }
        } catch {}
      }
      return;
    }

    setStops(prev => {
      const existingIds = new Set(prev.map(s => s.id));
      return [...prev, ...result.stops.filter(s => !existingIds.has(s.id))];
    });

    setMessages(prev => {
      if (prev.find(m => m.id === result.message_id)) return prev;
      return [{
        id: result.message_id,
        body: `${result.stops.length} stop${result.stops.length !== 1 ? 's' : ''} parsed`,
        status: 'parsed',
        received_at: new Date().toISOString(),
        from_number: 'WhatsApp',
      }, ...prev];
    });

    if (result.run_id && !runId) {
      setRunId(result.run_id);
      setRunStatus('building');
    }
  }, [runId, date]);

  const handleOptimise = useCallback(async () => {
    setOptimising(true);
    setError(null);
    try {
      const result = await api.optimise(date);

      // Ensure we have a runId — fetch from API if not in state
      let currentRunId = runId;
      if (!currentRunId) {
        const runs = await api.getRuns(date);
        if (runs?.length) {
          currentRunId = runs[0].id;
          setRunId(currentRunId);
        }
      }

      if (currentRunId) {
        const updated = await api.getStops(currentRunId);
        setStops(updated);
        await api.updateRun(currentRunId, { route_url: result.maps_url, status: 'ready' });
      }

      setRunMiles(result.total_miles);
      setRunMinutes(result.est_drive_minutes);
      setRunStatus('ready');
    } catch (e) {
      setError(e.message);
    } finally {
      setOptimising(false);
    }
  }, [date, runId]);

  const handleDeleteStop = useCallback((id) => {
    setStops(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleUpdateStop = useCallback((updated) => {
    setStops(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
  }, []);

  const handleClear = useCallback(async () => {
    if (!window.confirm('Clear all stops for this date?')) return;
    try {
      let id = runId;
      if (!id) {
        const runs = await api.getRuns(date);
        if (runs?.length) id = runs[0].id;
      }
      if (id) await api.deleteRun(id);
    } catch {}

    setStops([]);
    setMessages([]);
    setRunId(null);
    setRunStatus('building');
    setRunMiles(null);
    setRunMinutes(null);
    setError(null);
  }, [runId, date]);

  const handleDispatch = useCallback(async () => {
    if (!runId) return;
    if (!window.confirm('Commit and dispatch this run? Stops will become read-only.')) return;
    try {
      await api.dispatchRun(runId);
      setRunStatus('dispatched');
    } catch (e) {
      setError(e.message);
    }
  }, [runId]);

  const handleUnlock = useCallback(async () => {
    if (!runId) return;
    if (!window.confirm('Unlock this run? Stops will become editable again.')) return;
    try {
      await api.updateRun(runId, { status: 'ready' });
      setRunStatus('ready');
    } catch (e) {
      setError(e.message);
    }
  }, [runId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />

      <DateBar
        date={date}
        onChange={setDate}
        onOptimise={handleOptimise}
        onClear={handleClear}
        optimising={optimising}
        runStatus={runStatus}
        stopCount={stops.length}
      />

      {error && (
        <div style={{
          background: 'rgba(220,38,38,0.06)', borderBottom: '1px solid rgba(220,38,38,0.2)',
          padding: '0.5rem 1.5rem', fontFamily: 'DM Mono', fontSize: '0.75rem', color: '#DC2626',
          display: 'flex', alignItems: 'center', gap: '1rem',
        }}>
          <span>✗ {error}</span>
          <button onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          messages={messages}
          selectedMsg={selectedMsg}
          onSelectMsg={setSelectedMsg}
          onParsed={handleParsed}
          deliveryDate={date}
        />
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <RouteCard
            stops={stops}
            runDate={date}
            runStatus={runStatus}
            runMiles={runMiles}
            runMinutes={runMinutes}
            onDispatch={handleDispatch}
            onUnlock={handleUnlock}
            onDeleteStop={handleDeleteStop}
            onUpdateStop={handleUpdateStop}
          />
        </main>
      </div>
    </div>
  );
}
