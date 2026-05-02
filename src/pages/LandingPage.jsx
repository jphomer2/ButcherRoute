import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/AuthContext';

function Nav() {
  const navigate = useNavigate();
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(18,18,22,0.85)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--mid)',
      padding: '0 2rem', height: '60px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
          <rect width="30" height="30" rx="8" fill="var(--rust)" />
          <path d="M6 20h3.5l1.5-7h9l1.5 7H24M10 15h10M8 20a2 2 0 1 0 4 0M18 20a2 2 0 1 0 4 0"
            stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.1rem', color: 'var(--cream)' }}>
          Butcher<span style={{ color: 'var(--rust)' }}>Route</span>
        </span>
      </div>
      <button
        onClick={() => navigate('/app')}
        style={{
          background: 'var(--rust)', border: 'none', borderRadius: '8px',
          color: 'white', fontFamily: 'DM Mono', fontSize: '0.7rem',
          letterSpacing: '1px', padding: '8px 20px', cursor: 'pointer',
        }}
      >
        SIGN IN
      </button>
    </nav>
  );
}

function Feature({ icon, title, body }) {
  return (
    <div style={{
      background: 'var(--charcoal)', border: '1px solid var(--mid)',
      borderRadius: '12px', padding: '1.75rem',
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '10px',
        background: 'rgba(194,81,42,0.12)', border: '1px solid rgba(194,81,42,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--rust)',
      }}>
        {icon}
      </div>
      <div style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '1rem', color: 'var(--cream)' }}>
        {title}
      </div>
      <div style={{ fontFamily: 'DM Sans', fontSize: '0.88rem', color: 'var(--light-mid)', lineHeight: 1.6 }}>
        {body}
      </div>
    </div>
  );
}

function Step({ number, title, body }) {
  return (
    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        background: 'var(--rust)', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'DM Mono', fontWeight: 700, fontSize: '0.9rem',
      }}>
        {number}
      </div>
      <div>
        <div style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '1rem', color: 'var(--cream)', marginBottom: '0.3rem' }}>
          {title}
        </div>
        <div style={{ fontFamily: 'DM Sans', fontSize: '0.88rem', color: 'var(--light-mid)', lineHeight: 1.6 }}>
          {body}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate('/app');
  }, [session, navigate]);

  return (
    <div style={{ background: 'var(--blood)', minHeight: '100vh', color: 'var(--cream)' }}>
      <Nav />

      {/* Hero */}
      <section style={{
        paddingTop: '140px', paddingBottom: '100px',
        textAlign: 'center', maxWidth: '780px', margin: '0 auto', padding: '140px 2rem 100px',
      }}>
        <div style={{
          display: 'inline-block', fontFamily: 'DM Mono', fontSize: '0.65rem',
          letterSpacing: '2.5px', color: 'var(--rust)',
          background: 'rgba(194,81,42,0.1)', border: '1px solid rgba(194,81,42,0.25)',
          padding: '5px 14px', borderRadius: '20px', marginBottom: '1.5rem',
        }}>
          BUILT FOR UK MEAT WHOLESALERS
        </div>

        <h1 style={{
          fontFamily: 'DM Sans', fontWeight: 800, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
          lineHeight: 1.15, color: 'var(--cream)', marginBottom: '1.25rem',
        }}>
          From WhatsApp order<br />to optimised route<br />
          <span style={{ color: 'var(--rust)' }}>in seconds.</span>
        </h1>

        <p style={{
          fontFamily: 'DM Sans', fontSize: '1.1rem', color: 'var(--light-mid)',
          lineHeight: 1.7, maxWidth: '560px', margin: '0 auto 2.5rem',
        }}>
          ButcherRoute turns your morning order messages into a live, AI-optimised delivery plan — with one click. No spreadsheets, no manual routing.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/app')}
            style={{
              background: 'var(--rust)', border: 'none', borderRadius: '10px',
              color: 'white', fontFamily: 'DM Sans', fontWeight: 600, fontSize: '1rem',
              padding: '14px 32px', cursor: 'pointer',
            }}
          >
            Request a Demo
          </button>
          <button
            onClick={() => navigate('/app')}
            style={{
              background: 'transparent', border: '1px solid var(--mid)', borderRadius: '10px',
              color: 'var(--light-mid)', fontFamily: 'DM Sans', fontWeight: 500, fontSize: '1rem',
              padding: '14px 32px', cursor: 'pointer',
            }}
          >
            Sign In →
          </button>
        </div>
      </section>

      {/* Stats bar */}
      <div style={{
        borderTop: '1px solid var(--mid)', borderBottom: '1px solid var(--mid)',
        background: 'var(--charcoal)',
      }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto', padding: '2rem',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '2rem', textAlign: 'center',
        }}>
          {[
            { value: '< 10s', label: 'To parse any order' },
            { value: '30%', label: 'Average miles saved' },
            { value: '1-click', label: 'Driver dispatch' },
            { value: '100%', label: 'UK-focused' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.8rem', color: 'var(--rust)' }}>
                {s.value}
              </div>
              <div style={{ fontFamily: 'DM Mono', fontSize: '0.62rem', letterSpacing: '1px', color: 'var(--light-mid)', marginTop: '4px' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontFamily: 'DM Mono', fontSize: '0.62rem', letterSpacing: '2px', color: 'var(--rust)', marginBottom: '0.75rem' }}>
            FEATURES
          </div>
          <h2 style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '2rem', color: 'var(--cream)' }}>
            Everything your depot needs
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <Feature
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
            title="AI Order Parsing"
            body="Paste any WhatsApp message and AI extracts every customer, quantity, and delivery note instantly — no reformatting needed."
          />
          <Feature
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>}
            title="Route Optimisation"
            body="Google Maps calculates the most efficient driving order across all stops, with real-time traffic awareness."
          />
          <Feature
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>}
            title="Driver Dispatch"
            body="Send the complete route directly to your driver's phone via WhatsApp or SMS — one tap, they're ready to go."
          />
          <Feature
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            title="Customer Management"
            body="Maintain your full customer database with addresses, delivery notes, and name aliases for automatic matching."
          />
          <Feature
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
            title="Depot Analytics"
            body="Track runs, miles driven, stops delivered, and early collections over time. Data your operation can act on."
          />
          <Feature
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
            title="Secure & Private"
            body="Each depot's data is completely isolated. Role-based access means staff only see what they need to."
          />
        </div>
      </section>

      {/* How it works */}
      <section style={{
        background: 'var(--charcoal)', borderTop: '1px solid var(--mid)', borderBottom: '1px solid var(--mid)',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '80px 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontFamily: 'DM Mono', fontSize: '0.62rem', letterSpacing: '2px', color: 'var(--rust)', marginBottom: '0.75rem' }}>
              HOW IT WORKS
            </div>
            <h2 style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '2rem', color: 'var(--cream)' }}>
              Ready to dispatch in 3 steps
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <Step
              number="1"
              title="Orders come in on WhatsApp"
              body="Customers send their orders as they always have. No change to their workflow — ButcherRoute handles the rest."
            />
            <Step
              number="2"
              title="AI parses every stop in seconds"
              body="Paste the messages into ButcherRoute. Claude AI reads the text, matches each customer to your database, and builds the stop list automatically."
            />
            <Step
              number="3"
              title="Optimise and dispatch"
              body="One click optimises the route via Google Maps. Another sends the full run — stops, route link, timings — straight to your driver's phone."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '80px 2rem' }}>
        <h2 style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '2rem', color: 'var(--cream)', marginBottom: '1rem' }}>
          Ready to modernise your depot?
        </h2>
        <p style={{ fontFamily: 'DM Sans', fontSize: '1rem', color: 'var(--light-mid)', marginBottom: '2rem' }}>
          ButcherRoute is already running live deliveries for UK meat wholesalers.
        </p>
        <button
          onClick={() => navigate('/app')}
          style={{
            background: 'var(--rust)', border: 'none', borderRadius: '10px',
            color: 'white', fontFamily: 'DM Sans', fontWeight: 600, fontSize: '1rem',
            padding: '14px 36px', cursor: 'pointer',
          }}
        >
          Request a Demo
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--mid)', padding: '1.5rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
      }}>
        <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '0.95rem', color: 'var(--cream)' }}>
          Butcher<span style={{ color: 'var(--rust)' }}>Route</span>
        </span>
        <span style={{ fontFamily: 'DM Mono', fontSize: '0.62rem', color: 'var(--light-mid)', letterSpacing: '1px' }}>
          © 2026 SUFFOLK FARMS LTD · ALL RIGHTS RESERVED
        </span>
      </footer>
    </div>
  );
}
