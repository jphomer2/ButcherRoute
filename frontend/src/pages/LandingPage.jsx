import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useIsMobile } from '../hooks/useIsMobile';

// ── Palette ──────────────────────────────────────────────────────────────────
const T = {
  teal:      '#0F766E',
  tealHover: '#0D9488',
  tealLight: '#F0FDFA',
  tealBorder:'#99F6E4',
  black:     '#0F172A',
  body:      '#334155',
  muted:     '#64748B',
  border:    '#E2E8F0',
  white:     '#FFFFFF',
  offWhite:  '#F8FAFC',
  lightGray: '#F1F5F9',
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const mono = { fontFamily: 'DM Mono' };
const sans = { fontFamily: 'DM Sans' };
const label = { ...mono, fontSize: '0.6rem', letterSpacing: '2.5px', color: T.teal, textTransform: 'uppercase' };

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ onCta, isMobile }) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${T.border}`,
      height: '56px', padding: isMobile ? '0 1.25rem' : '0 2.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
          <rect width="30" height="30" rx="8" fill={T.teal} />
          <path d="M6 20h3.5l1.5-7h9l1.5 7H24M10 15h10M8 20a2 2 0 1 0 4 0M18 20a2 2 0 1 0 4 0"
            stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ ...sans, fontWeight: 700, fontSize: '1.05rem', color: T.black, letterSpacing: '0.5px' }}>
          Butcher<span style={{ color: T.teal }}>Route</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        {!isMobile && (
          <span style={{ ...mono, fontSize: '0.6rem', letterSpacing: '1.5px', color: T.muted }}>
            FOR UK MEAT WHOLESALERS
          </span>
        )}
        {!isMobile && (
          <button
            onClick={onCta}
            style={{
              ...mono, background: 'transparent', border: `1px solid ${T.border}`,
              borderRadius: '7px', color: T.muted, fontSize: '0.65rem',
              letterSpacing: '1px', padding: '7px 16px', cursor: 'pointer',
            }}
          >
            SIGN IN
          </button>
        )}
        <button
          onClick={() => document.getElementById('demo-form').scrollIntoView({ behavior: 'smooth' })}
          style={{
            ...mono, background: T.teal, border: 'none',
            borderRadius: '7px', color: 'white', fontSize: '0.65rem',
            letterSpacing: '1px', padding: '8px 16px', cursor: 'pointer',
          }}
        >
          REQUEST DEMO
        </button>
        {isMobile && (
          <button
            onClick={onCta}
            style={{
              ...mono, background: 'transparent', border: `1px solid ${T.border}`,
              borderRadius: '7px', color: T.muted, fontSize: '0.65rem',
              letterSpacing: '1px', padding: '7px 14px', cursor: 'pointer',
            }}
          >
            SIGN IN
          </button>
        )}
      </div>
    </nav>
  );
}

// ── Step card ─────────────────────────────────────────────────────────────────
function Step({ number, title, what, control, last }) {
  return (
    <div style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
      {!last && (
        <div style={{
          position: 'absolute', left: '19px', top: '44px',
          width: '2px', height: 'calc(100% + 2rem)',
          background: T.border,
        }} />
      )}
      <div style={{ flexShrink: 0, zIndex: 1 }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: T.teal, color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...mono, fontWeight: 700, fontSize: '0.85rem',
        }}>
          {number}
        </div>
      </div>
      <div style={{ paddingBottom: last ? 0 : '2.5rem', flex: 1 }}>
        <div style={{ ...sans, fontWeight: 700, fontSize: '1.05rem', color: T.black, marginBottom: '0.5rem' }}>
          {title}
        </div>
        <div style={{ ...sans, fontSize: '0.9rem', color: T.body, lineHeight: 1.7, marginBottom: '0.85rem' }}>
          {what}
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          background: T.tealLight, border: `1px solid ${T.tealBorder}`,
          borderRadius: '6px', padding: '6px 12px',
          ...mono, fontSize: '0.65rem', color: T.teal, letterSpacing: '0.3px',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {control}
        </div>
      </div>
    </div>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────
function Feature({ icon, title, body }) {
  return (
    <div style={{
      background: T.white, border: `1px solid ${T.border}`,
      borderRadius: '10px', padding: '1.6rem',
      display: 'flex', flexDirection: 'column', gap: '0.7rem',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '9px',
        background: T.tealLight, color: T.teal,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ ...sans, fontWeight: 600, fontSize: '0.95rem', color: T.black }}>
        {title}
      </div>
      <div style={{ ...sans, fontSize: '0.86rem', color: T.muted, lineHeight: 1.65 }}>
        {body}
      </div>
    </div>
  );
}

// ── Demo form ─────────────────────────────────────────────────────────────────
function DemoForm({ isMobile }) {
  const [form,    setForm]    = useState({ name: '', depot_name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('demo_requests').insert(form);
    if (error) { setError('Something went wrong — please try calling us directly.'); }
    else { setDone(true); }
    setLoading(false);
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: T.white, border: `1px solid ${T.border}`,
    borderRadius: '8px', color: T.black,
    ...mono, fontSize: '0.82rem', padding: '0.7rem 0.9rem',
    outline: 'none',
  };

  return (
    <section id="demo-form" style={{
      background: T.white, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: isMobile ? '56px 1.25rem' : '80px 2rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ ...label, marginBottom: '0.75rem' }}>REQUEST A DEMO</div>
          <h2 style={{ ...sans, fontWeight: 700, fontSize: isMobile ? '1.5rem' : '1.85rem', color: T.black, marginBottom: '0.75rem', lineHeight: 1.2 }}>
            See it running on your routes
          </h2>
          <p style={{ ...sans, fontSize: '0.9rem', color: T.muted, lineHeight: 1.65 }}>
            Leave your details and we will be in touch to walk you through ButcherRoute using your own customers and orders.
          </p>
        </div>

        {done ? (
          <div style={{
            background: T.tealLight, border: `1px solid ${T.tealBorder}`,
            borderRadius: '10px', padding: '1.5rem 1.75rem',
          }}>
            <div style={{ ...sans, fontWeight: 600, color: T.teal, fontSize: '1rem', marginBottom: '0.4rem' }}>
              Request received
            </div>
            <div style={{ ...sans, fontSize: '0.88rem', color: T.body, lineHeight: 1.6 }}>
              We will be in touch shortly to arrange a demonstration.
            </div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ ...mono, fontSize: '0.58rem', letterSpacing: '1.5px', color: T.muted, display: 'block', marginBottom: '0.4rem' }}>
                YOUR NAME
              </label>
              <input
                required value={form.name} onChange={set('name')}
                placeholder="John Smith"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.teal}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
            <div>
              <label style={{ ...mono, fontSize: '0.58rem', letterSpacing: '1.5px', color: T.muted, display: 'block', marginBottom: '0.4rem' }}>
                DEPOT / BUSINESS NAME
              </label>
              <input
                required value={form.depot_name} onChange={set('depot_name')}
                placeholder="ButcherRoutes Ltd"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.teal}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
            <div>
              <label style={{ ...mono, fontSize: '0.58rem', letterSpacing: '1.5px', color: T.muted, display: 'block', marginBottom: '0.4rem' }}>
                PHONE NUMBER
              </label>
              <input
                required value={form.phone} onChange={set('phone')}
                placeholder="07700 900000"
                type="tel"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.teal}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>

            {error && (
              <div style={{ ...mono, fontSize: '0.72rem', color: '#DC2626' }}>{error}</div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                ...sans, fontWeight: 600, fontSize: '0.95rem',
                background: loading ? T.muted : T.teal,
                border: 'none', borderRadius: '8px', color: 'white',
                padding: '0.8rem', cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '0.5rem', letterSpacing: '0.3px',
              }}
            >
              {loading ? 'Sending…' : 'Request a Demo'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const session  = useSession();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (session) navigate('/app');
  }, [session, navigate]);

  const goToApp = () => navigate('/app');

  return (
    <div style={{ background: T.offWhite, minHeight: '100vh', color: T.black }}>
      <Nav onCta={goToApp} isMobile={isMobile} />

      {/* ── Hero ── */}
      <section style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div style={{
          maxWidth: '860px', margin: '0 auto',
          padding: isMobile ? '90px 1.25rem 60px' : '140px 2rem 90px',
          textAlign: 'center',
        }}>
          <div style={{
            ...mono, fontSize: '0.6rem', letterSpacing: '2.5px', color: T.teal,
            background: T.tealLight, border: `1px solid ${T.tealBorder}`,
            display: 'inline-block', padding: '5px 14px', borderRadius: '20px', marginBottom: '1.5rem',
          }}>
            UK MEAT WHOLESALE · ORDER & DISPATCH
          </div>

          <h1 style={{
            ...sans, fontWeight: 800, color: T.black, lineHeight: 1.15,
            fontSize: isMobile ? '1.9rem' : 'clamp(2.1rem, 4.5vw, 3.4rem)',
            marginBottom: '1.25rem', letterSpacing: '-0.5px',
          }}>
            Order management and dispatch software built for UK meat wholesalers.
          </h1>

          <p style={{
            ...sans, fontSize: isMobile ? '0.95rem' : '1.05rem', color: T.body,
            lineHeight: 1.75, maxWidth: '560px', margin: '0 auto 2rem',
          }}>
            From the first WhatsApp message to the driver leaving the depot — ButcherRoute handles the routing, the sequencing, and the dispatch. Every step is visible. Every decision is yours.
          </p>

          <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => document.getElementById('demo-form').scrollIntoView({ behavior: 'smooth' })}
              style={{
                ...sans, fontWeight: 600, fontSize: '0.95rem',
                background: T.teal, border: 'none', borderRadius: '9px',
                color: 'white', padding: '13px 28px', cursor: 'pointer',
                boxShadow: `0 2px 12px ${T.teal}35`,
                width: isMobile ? '100%' : 'auto',
              }}
            >
              Request a Demo
            </button>
            <button
              onClick={goToApp}
              style={{
                ...sans, fontWeight: 500, fontSize: '0.95rem',
                background: T.white, border: `1px solid ${T.border}`, borderRadius: '9px',
                color: T.muted, padding: '13px 28px', cursor: 'pointer',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              Sign In →
            </button>
          </div>
        </div>
      </section>

      {/* ── What it does ── */}
      <div style={{ borderBottom: `1px solid ${T.border}`, background: T.offWhite }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          padding: isMobile ? '0' : '0',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: '0',
          textAlign: 'center',
        }}>
          {[
            { value: 'Orders',   body: 'Parsed from WhatsApp automatically' },
            { value: 'Routes',   body: 'Optimised by Google Maps, stop by stop' },
            { value: 'Dispatch', body: 'Sent directly to the driver\'s phone' },
            { value: 'History',  body: 'Every run logged and searchable' },
          ].map((s, i) => (
            <div key={s.value} style={{
              padding: '1.5rem 1rem',
              borderRight: isMobile
                ? (i % 2 === 0 ? `1px solid ${T.border}` : 'none')
                : (i < 3 ? `1px solid ${T.border}` : 'none'),
              borderBottom: isMobile && i < 2 ? `1px solid ${T.border}` : 'none',
            }}>
              <div style={{ ...sans, fontWeight: 700, fontSize: '1.05rem', color: T.teal, marginBottom: '0.35rem' }}>
                {s.value}
              </div>
              <div style={{ ...sans, fontSize: '0.8rem', color: T.muted, lineHeight: 1.5 }}>
                {s.body}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: isMobile ? '56px 1.25rem' : '80px 2rem' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ ...label, marginBottom: '0.75rem' }}>HOW IT WORKS</div>
            <h2 style={{ ...sans, fontWeight: 700, fontSize: isMobile ? '1.5rem' : '1.85rem', color: T.black, lineHeight: 1.2, marginBottom: '0.75rem' }}>
              Exactly what happens to every order
            </h2>
            <p style={{ ...sans, fontSize: '0.9rem', color: T.muted, lineHeight: 1.65, maxWidth: '480px' }}>
              No black boxes. Here is every step the system takes — and every point where you stay in control.
            </p>
          </div>

          <div>
            <Step number="1"
              title="You paste the order message"
              what="Copy a WhatsApp order message and paste it into ButcherRoute. The system reads the text and extracts every customer name, quantity, and any delivery instructions mentioned."
              control="You see the extracted list before anything is saved or confirmed."
            />
            <Step number="2"
              title="Customers are matched to your database"
              what="Each name is matched against your saved customer list. Matched stops pull in the saved address, postcode, and any standing delivery notes. Names that cannot be matched are flagged clearly in amber — nothing is assumed or invented."
              control="You review every stop. Unmatched customers are visible and can be resolved before proceeding."
            />
            <Step number="3"
              title="You optimise the route"
              what="When you are ready, click Optimise. Google Maps calculates the most efficient driving order across all stops, accounting for real road distances. Estimated mileage and drive time are displayed."
              control="You review the route on Google Maps before anything is sent."
            />
            <Step number="4"
              title="The driver receives the run"
              what="Click Dispatch. Your driver receives a message containing every stop in order, the Google Maps route link, and any early collection flags. The run is locked and recorded in your history."
              control="Nothing leaves until you press Dispatch. The run is only sent when you are ready."
              last
            />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ background: T.offWhite, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: isMobile ? '56px 1.25rem' : '80px 2rem' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ ...label, marginBottom: '0.75rem' }}>BUILT FOR DEPOTS</div>
            <h2 style={{ ...sans, fontWeight: 700, fontSize: isMobile ? '1.5rem' : '1.85rem', color: T.black }}>
              Everything in one place
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <Feature
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
              title="WhatsApp Order Intake"
              body="Orders arrive the same way they always have. Paste the message in and every stop is extracted in seconds — no reformatting, no templates."
            />
            <Feature
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>}
              title="Google Maps Optimisation"
              body="Routes are calculated using the same Google Maps data your drivers already use. Fastest sequence, live road conditions, accurate mileage."
            />
            <Feature
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              title="Customer Database"
              body="Every customer stored with their address, postcode, delivery notes, and name variants. New customers are geocoded automatically when added."
            />
            <Feature
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>}
              title="Driver Management"
              body="Maintain your driver list with vehicle registrations and contact details. Assign drivers to runs and dispatch directly to their phone."
            />
            <Feature
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
              title="Depot Analytics"
              body="Every run logged automatically. Review miles driven, stops delivered, early collections, and route history across any time period."
            />
            <Feature
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              title="Secure Access"
              body="Each depot operates behind authenticated logins. Your customer data, order history, and routes are entirely private to your business."
            />
          </div>
        </div>
      </section>

      {/* ── Demo form ── */}
      <DemoForm isMobile={isMobile} />

      {/* ── Footer ── */}
      <footer style={{
        background: T.white, borderTop: `1px solid ${T.border}`,
        padding: isMobile ? '1.25rem' : '1.75rem 2.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <span style={{ ...sans, fontWeight: 700, fontSize: '0.95rem', color: T.black }}>
          Butcher<span style={{ color: T.teal }}>Route</span>
        </span>
        <span style={{ ...mono, fontSize: '0.58rem', color: T.muted, letterSpacing: '1px' }}>
          © 2026 BUTCHERROUTE · ALL RIGHTS RESERVED
        </span>
      </footer>
    </div>
  );
}
