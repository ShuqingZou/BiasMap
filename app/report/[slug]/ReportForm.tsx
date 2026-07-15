'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const MEMBERS = ['RM', 'Jin', 'Suga', 'J-Hope', 'Jimin', 'V', 'Jungkook'];
const THROTTLE_KEY = 'biasmap_last_report';
const THROTTLE_MS = 60_000;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type Props = {
  slug: string;
  showId: string;
  showName: string;
  sectionCodes: string[];
};

export default function ReportForm({ slug, showId, showName, sectionCodes }: Props) {
  const [sectionCode, setSectionCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [membersClose, setMembersClose] = useState<string[]>([]);
  const [whenClose, setWhenClose] = useState('');
  const [obstruction, setObstruction] = useState('');
  const [viewRating, setViewRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Honeypot ref (must stay empty; bots fill it)
  const honeypotRef = useRef<HTMLInputElement>(null);

  function toggleMember(m: string) {
    setMembersClose((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Honeypot check
    if (honeypotRef.current?.value) return;

    // Rate limit
    const lastSubmit = Number(localStorage.getItem(THROTTLE_KEY) ?? 0);
    if (Date.now() - lastSubmit < THROTTLE_MS) {
      setError('Please wait a moment before submitting again.');
      return;
    }

    if (!sectionCode.trim()) return;

    setSubmitting(true);
    setError(null);

    const supabase = getSupabase();
    const { error: insertError } = await supabase.from('reports').insert({
      show_id: showId,
      section_code: sectionCode.trim().toUpperCase(),
      nickname: nickname.trim() || null,
      members_close: membersClose,
      when_close: whenClose.trim().slice(0, 200) || null,
      obstruction: obstruction.trim().slice(0, 200) || null,
      view_rating: viewRating,
    });

    if (insertError) {
      setError('Something went wrong. Please try again.');
    } else {
      localStorage.setItem(THROTTLE_KEY, String(Date.now()));
      setSubmitted(true);
    }
    setSubmitting(false);
  }

  if (submitted) {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/show/${slug}` : `/show/${slug}`;
    return (
      <div
        style={{
          paddingTop: 64,
          paddingBottom: 64,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontSize: 36,
            color: 'var(--go)',
          }}
        >
          ✦
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text)',
            margin: 0,
          }}
        >
          Logged — thank you.
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-dim)', margin: 0, maxWidth: 280 }}>
          Your report feeds the bias map and section warnings for upcoming shows.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
          <Link
            href={`/show/${slug}`}
            style={{
              padding: '10px 20px',
              borderRadius: 999,
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              fontFamily: 'var(--font-space-grotesk), sans-serif',
            }}
          >
            Back to show guide
          </Link>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'BiasMap', url: shareUrl });
              } else {
                navigator.clipboard.writeText(shareUrl);
              }
            }}
            style={{
              padding: '10px 20px',
              borderRadius: 999,
              border: '1px solid var(--line)',
              background: 'var(--surface)',
              color: 'var(--text-dim)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Share guide
          </button>
        </div>
      </div>
    );
  }

  const label: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-dim)',
    marginBottom: 8,
  };

  const input: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 8,
    padding: '10px 12px',
    color: 'var(--text)',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const field: React.CSSProperties = { marginBottom: 24 };

  return (
    <div style={{ paddingTop: 24, paddingBottom: 64 }}>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>
        <Link href={`/show/${slug}`} style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>
          ← Show Guide
        </Link>
      </p>

      <h1
        style={{
          fontFamily: 'var(--font-space-grotesk), sans-serif',
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          margin: '0 0 4px',
        }}
      >
        Section Report
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: '0 0 32px' }}>{showName}</p>

      <form onSubmit={handleSubmit}>
        {/* Honeypot (hidden from real users) */}
        <input
          ref={honeypotRef}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
        />

        {/* Section code */}
        <div style={field}>
          <label style={label}>
            Which section were you in?{' '}
            <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <input
            list="section-codes"
            style={input}
            placeholder="e.g. 113, FLOOR-C"
            value={sectionCode}
            onChange={(e) => setSectionCode(e.target.value)}
            required
            maxLength={20}
            autoComplete="off"
          />
          {sectionCodes.length > 0 && (
            <datalist id="section-codes">
              {sectionCodes.map((code) => (
                <option key={code} value={code} />
              ))}
            </datalist>
          )}
        </div>

        {/* Members close */}
        <div style={field}>
          <label style={label}>Did any members come close to your section?</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MEMBERS.map((m) => {
              const sel = membersClose.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMember(m)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: `1px solid ${sel ? 'var(--accent)' : 'var(--line)'}`,
                    background: sel ? 'var(--accent)' : 'var(--surface)',
                    color: sel ? '#fff' : 'var(--text-dim)',
                    fontSize: 13,
                    fontWeight: sel ? 700 : 400,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* When close */}
        <div style={field}>
          <label style={label}>When? (song or moment)</label>
          <input
            style={input}
            placeholder="e.g. During encore, Jimin on the N rim"
            value={whenClose}
            onChange={(e) => setWhenClose(e.target.value.slice(0, 200))}
            maxLength={200}
          />
          <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginTop: 4 }}>
            {200 - whenClose.length} chars remaining
          </span>
        </div>

        {/* Obstruction */}
        <div style={field}>
          <label style={label}>Anything blocking your view?</label>
          <input
            style={input}
            placeholder="e.g. Pillar partially blocks right side, row 10+"
            value={obstruction}
            onChange={(e) => setObstruction(e.target.value.slice(0, 200))}
            maxLength={200}
          />
          <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginTop: 4 }}>
            {200 - obstruction.length} chars remaining
          </span>
        </div>

        {/* View rating */}
        <div style={field}>
          <label style={label}>Rate your view</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setViewRating(viewRating === n ? null : n)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  border: `1px solid ${viewRating === n ? 'var(--accent)' : 'var(--line)'}`,
                  background: viewRating === n ? 'var(--accent)' : 'var(--surface)',
                  color: viewRating === n ? '#fff' : 'var(--text-dim)',
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginTop: 6 }}>
            1 = obstructed · 5 = perfect
          </span>
        </div>

        {/* Nickname */}
        <div style={field}>
          <label style={label}>Nickname (optional)</label>
          <input
            style={input}
            placeholder="ARMY anon"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={40}
          />
        </div>

        {error && (
          <p style={{ color: 'var(--warn)', fontSize: 13, marginBottom: 16 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !sectionCode.trim()}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 999,
            background: submitting || !sectionCode.trim() ? 'var(--line)' : 'var(--accent)',
            color: '#fff',
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontWeight: 700,
            fontSize: 15,
            border: 'none',
            cursor: submitting || !sectionCode.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
            letterSpacing: '-0.01em',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
