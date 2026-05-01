import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RouteCard from './components/RouteCard';
import DateBar from './components/DateBar';
import DriversModal from './components/DriversModal';
import { api } from './api';
import { useIsMobile } from './hooks/useIsMobile';

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
  const [mobileTab,    setMobileTab]    = useState('orders');
  const [panelResetKey, setPanelResetKey] = useState(0);
  const [driversOpen,   setDriversOpen]   = useState(false);

  const isMobile = useIsMobile();

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
      // All stops already existed for this date — just sync run metadata if runId was unknown
      if (result.run_id && !runId) {
        setRunId(result.run_id);
        try {
          const runs = await api.getRuns(date);
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

    if (runStatus === 'ready' && runId) {
      setRunStatus('building');
      api.updateRun(runId, { status: 'building' }).catch(() => {});
    }

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

    // Switch to Route tab on mobile so stops are visible immediately
    setMobileTab('route');
  }, [runId, runStatus, date]);

  const handleOptimise = useCallback(async () => {
    setOptimising(true);
    setError(null);
    try {
      const result = await api.optimise(date);

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
        const updatedById = new Map(updated.map(s => [s.id, s]));
        setStops(prev => prev
          .filter(s => updatedById.has(s.id))
          .map(s => ({ ...s, route_sequence: updatedById.get(s.id).route_sequence }))
        );
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
    if (runStatus === 'ready' && runId) {
      setRunStatus('building');
      api.updateRun(runId, { status: 'building' }).catch(() => {});
    }
  }, [runStatus, runId]);

  const handleUpdateStop = useCallback((updated) => {
    setStops(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
  }, []);

  const handleClear = useCallback(async () => {
    if (!window.confirm('Clear all stops for this date?')) return;
    try {
      await api.clearDate(date);
    } catch (e) {
      setError('Clear failed — ' + e.message);
      return;
    }
    setStops([]);
    setMessages([]);
    setRunId(null);
    setRunStatus('building');
    setRunMiles(null);
    setRunMinutes(null);
    setError(null);
    setPanelResetKey(k => k + 1);
  }, [date]);

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

  const errorBanner = error && (
    <div style={{
      background: 'rgba(220,38,38,0.06)', borderBottom: '1px solid rgba(220,38,38,0.2)',
      padding: '0.5rem 1.5rem', fontFamily: 'DM Mono', fontSize: '0.75rem', color: '#DC2626',
      display: 'flex', alignItems: 'center', gap: '1rem',
    }}>
      <span>✗ {error}</span>
      <button onClick={() => setError(null)}
        style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}>✕</button>
    </div>
  );

  const routeCard = (
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
  );

  const sidebar = (
    <Sidebar
      messages={messages}
      selectedMsg={selectedMsg}
      onSelectMsg={setSelectedMsg}
      onParsed={handleParsed}
      deliveryDate={date}
      panelResetKey={panelResetKey}
    />
  );

  // ── Mobile layout ──
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <DriversModal open={driversOpen} onClose={() => setDriversOpen(false)} />
        <Header onDriversOpen={() => setDriversOpen(true)} />
        <DateBar
          date={date}
          onChange={setDate}
          onOptimise={handleOptimise}
          onClear={handleClear}
          optimising={optimising}
          runStatus={runStatus}
          stopCount={stops.length}
        />
        {errorBanner}

        {/* Tab content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {mobileTab === 'orders' ? (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {sidebar}
            </div>
          ) : (
            <main style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {routeCard}
            </main>
          )}
        </div>

        {/* Bottom tab bar */}
        <div style={{
          display: 'flex', borderTop: '1px solid var(--mid)',
          background: 'var(--charcoal)', flexShrink: 0,
        }}>
          <button
            onClick={() => setMobileTab('orders')}
            style={{
              flex: 1, padding: '0.75rem 0', border: 'none', cursor: 'pointer',
              background: mobileTab === 'orders' ? 'rgba(15,118,110,0.06)' : 'transparent',
              borderTop: `2px solid ${mobileTab === 'orders' ? 'var(--rust)' : 'transparent'}`,
              fontFamily: 'DM Mono', fontSize: '0.7rem', letterSpacing: '1px',
              color: mobileTab === 'orders' ? 'var(--rust)' : 'var(--light-mid)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            ORDERS
          </button>
          <button
            onClick={() => setMobileTab('route')}
            style={{
              flex: 1, padding: '0.75rem 0', border: 'none', cursor: 'pointer',
              background: mobileTab === 'route' ? 'rgba(15,118,110,0.06)' : 'transparent',
              borderTop: `2px solid ${mobileTab === 'route' ? 'var(--rust)' : 'transparent'}`,
              fontFamily: 'DM Mono', fontSize: '0.7rem', letterSpacing: '1px',
              color: mobileTab === 'route' ? 'var(--rust)' : 'var(--light-mid)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              position: 'relative',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
            ROUTE
            {stops.length > 0 && (
              <span style={{
                position: 'absolute', top: '6px', right: 'calc(50% - 18px)',
                background: 'var(--rust)', color: 'white', borderRadius: '10px',
                fontSize: '0.55rem', padding: '1px 5px', fontFamily: 'DM Mono',
              }}>
                {stops.length}
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Desktop layout ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <DriversModal open={driversOpen} onClose={() => setDriversOpen(false)} />
      <Header onDriversOpen={() => setDriversOpen(true)} />
      <DateBar
        date={date}
        onChange={setDate}
        onOptimise={handleOptimise}
        onClear={handleClear}
        optimising={optimising}
        runStatus={runStatus}
        stopCount={stops.length}
      />
      {errorBanner}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {sidebar}
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {routeCard}
        </main>
      </div>
    </div>
  );
}
