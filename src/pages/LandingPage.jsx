import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/AuthContext';

const TEAL   = '#0F766E';
const TEAL_L = '#CCFBF1';
const SLATE  = '#0F172A';
const MUTED  = '#64748B';
const BORDER = '#E2E8F0';
const WHITE  = '#FFFFFF';
const LIGHT  = '#F8FAFC';
const CARD   = '#F1F5F9';

function Nav({ onSignIn }) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${BORDER}`,
      padding: '0 2rem', height: '60px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
          <rect width="30" height="30" rx="8" fill={TEAL} />
          <path d="M6 20h3.5l1.5-7h9l1.5 7H24M10 15h10M8 20a2 2 0 1 0 4 0M18 20a2 2 0 1 0 4 0"
            stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.1rem', color: SLATE }}>
          Butcher<span style={{ color: TEAL }}>Route</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <span style={{ fontFamily: 'DM Mono', fontSize: '0.62rem', color: MUTED, letterSpacing: '1px' }}>
          FOR UK MEAT WHOLESALERS
        </span>
        <button onClick={onSignIn} style={{
          background: TEAL, border: 'none', borderRadius: '8px',
          color: 'white', fontFamily: 'DM Mono', fontSize: '0.68rem',
          letterSpacing: '1px', padding: '8px 20px', cursor: 'pointer',
        }}>
          SIGN IN
        </button>
      </div>
    </nav>
  );
}

function Feature({ icon, title, body }) {
  return (
    <div style={{
      background: WHITE, border: `1px solid ${BORDER}`,
      borderRadius: '12px', padding: '1.75rem',
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: '42px', height: '42px', borderRadius: '10px',
        background: TEAL_L, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: TEAL,
      }}>
        {icon}
      </div>
      <div style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.97rem', color: SLATE }}>
        {title}
      </div>
      <div style={{ fontFamily: 'DM Sans', fontSize: '0.86rem', color: MUTED, lineHeight: 1.65 }}>
        {body}
      </div>
    </div>
  );
}

function Step({ number, title, body }) {
  return (
    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
        background: TEAL, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'DM Mono', fontWeight: 700, fontSize: '0.85rem',
      }}>
        {number}
      </div>
      <div style={{ paddingTop: '4px' }}>
        <div style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.97rem', color: SLATE, marginBottom: '0.3rem' }}>
          {title}
        </div>
        <div style={{ fontFamily: 'DM Sans', fontSize: '0.86rem', color: MUTED, lineHeight: 1.65 }}>
          {body}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const session  = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate('/app');
  }, [session, navigate]);

  const goToApp = () => navigate('/app');

  return (
    <div style={{ background: LIGHT, minHeight: '100vh', color: SLATE }}>
      <Nav onSignIn={goToApp} />

      {/* Hero */}
      <section style={{ paddingTop: '120px', paddingBottom: '80px', textAlign: 'center', padding: '120px 2rem 80px' }}>
        <div style={{
          display: 'inline-block', fontFamily: 'DM Mono', fontSize: '0.62rem',
          letterSpacing: '2px', color: TEAL,
          background: TEAL_L, border: `1px solid ${TEAL}30`,
          padding: '5px 14px', borderRadius: '20px', marginBottom: '1.5rem',
        }}>
          BUILT FOR UK MEAT WHOLESALERS
        </div>

        <h1 style={{
          fontFamily: 'DM Sans', fontWeight: 800,
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          lineHeight: 1.15, color: SLATE, marginBottom: '1.25rem',
          maxWidth: '700px', margin: '0 auto 1.25rem',
        }}>
          From WhatsApp order to<br />optimised route —{' '}
          <span style={{ color: TEAL }}>in seconds.</span>
        </h1>

        <p style={{
          fontFamily: 'DM Sans', fontSize: '1.05rem', color: MUTED,
          lineHeight: 1.7, maxWidth: '520px', margin: '0 auto 2.5rem',
        }}>
          ButcherRoute turns your morning order messages into a live, AI-optimised delivery plan with one click. No spreadsheets. No manual routing.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={goToApp} style={{
            background: TEAL, border: 'none', borderRadius: '10px',
            color: 'white', fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.95rem',
            padding: '13px 30px', cursor: 'pointer',
            boxShadow: `0 4px 14px ${TEAL}40`,
          }}>
            Request a Demo
          </button>
          <button onClick={goToApp} style={{
            background: WHITE, border: `1px solid ${BORDER}`, borderRadius: '10px',
            color: MUTED, fontFamily: 'DM Sans', fontWeight: 500, fontSize: '0.95rem',
            padding: '13px 30px', cursor: 'pointer',
          }}>
            Sign In →
          </button>
        </div>
      </section>

      {/* Stats bar */}
      <div style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, background: WHITE }}>
        <div style={{
          maxWidth: '860px', margin: '0 auto', padding: '2rem',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '2rem', textAlign: 'center',
        }}>
          {[
            { value: '< 10s',  label: 'To parse any order' },
            { value: '30%',    label: 'Average miles saved' },
            { value: '1-click',label: 'Driver dispatch' },
            { value: '100%',   label: 'UK-focused' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.7rem', color: TEAL }}>
                {s.value}
              </div>
              <div style={{ fontFamily: 'DM Mono', fontSize: '0.6rem', letterSpacing: '1px', color: MUTED, marginTop: '4px' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '72px 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontFamily: 'DM Mono', fontSize: '0.6rem', letterSpacing: '2px', color: TEAL, marginBottom: '0.6rem' }}>FEATURES</div>
          <h2 style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.85rem', color: SLATE }}>
            Everything your depot needs
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.1rem' }}>
          <Feature
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
            title="AI Order Parsing"
            body="Paste any WhatsApp message and AI extracts every customer, quantity, and delivery note instantly — no reformatting needed."
          />
          <Feature
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>}
            title="Route Optimisation"
            body="Google Maps calculates the most efficient driving order across all stops, with real-time traffic awareness built in."
          />
          <Feature
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>}
            title="Driver Dispatch"
            body="Send the complete route directly to your driver's phone in one tap. They get the map, stops, and timings instantly."
          />
          <Feature
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            title="Customer Management"
            body="Keep your full customer list with addresses, delivery notes, and name aliases. New customers are geocoded automatically."
          />
          <Feature
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
            title="Depot Analytics"
            body="Track runs, miles, stops, and early collections over time. Filter by week, month, or quarter."
          />
          <Feature
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
            title="Secure by Design"
            body="Each depot's data is completely isolated behind authenticated logins. Staff only see what they need to."
          />
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: WHITE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '72px 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontFamily: 'DM Mono', fontSize: '0.6rem', letterSpacing: '2px', color: TEAL, marginBottom: '0.6rem' }}>HOW IT WORKS</div>
            <h2 style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.85rem', color: SLATE }}>
              Ready to dispatch in 3 steps
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <Step number="1" title="Orders arrive on WhatsApp"
              body="Customers send their orders as they always have. No change to their workflow — ButcherRoute handles the rest." />
            <Step number="2" title="AI parses every stop in seconds"
              body="Paste the message in. Claude AI reads the text, matches each name to your customer database, and builds the stop list automatically." />
            <Step number="3" title="Optimise and dispatch"
              body="One click orders the route via Google Maps. Another sends the full run — stops, route link, and timings — straight to your driver's phone." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '80px 2rem', background: LIGHT }}>
        <h2 style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.85rem', color: SLATE, marginBottom: '0.85rem' }}>
          Ready to modernise your depot?
        </h2>
        <p style={{ fontFamily: 'DM Sans', fontSize: '0.97rem', color: MUTED, marginBottom: '2rem', maxWidth: '420px', margin: '0 auto 2rem' }}>
          ButcherRoute is already running live deliveries for UK meat wholesalers.
        </p>
        <button onClick={goToApp} style={{
          background: TEAL, border: 'none', borderRadius: '10px',
          color: 'white', fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.95rem',
          padding: '13px 36px', cursor: 'pointer',
          boxShadow: `0 4px 14px ${TEAL}40`,
        }}>
          Request a Demo
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${BORDER}`, padding: '1.5rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem', background: WHITE,
      }}>
        <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '0.95rem', color: SLATE }}>
          Butcher<span style={{ color: TEAL }}>Route</span>
        </span>
        <span style={{ fontFamily: 'DM Mono', fontSize: '0.6rem', color: MUTED, letterSpacing: '1px' }}>
          © 2026 SUFFOLK FARMS LTD
        </span>
      </footer>
    </div>
  );
}
