'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Show } from '@/lib/types';

type VenueGroup = {
  venueId: string;
  venueName: string;
  city: string;
  region: string;
  date: string;
  firstSlug: string;
  nightLabel: string;
  status: Show['status'];
};

const CAP = 6;

export default function PastShowsExpander({ groups }: { groups: VenueGroup[] }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const visible = expanded ? groups : groups.slice(0, CAP);
  const hasMore = groups.length > CAP;

  return (
    <div style={{ opacity: 0.85 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
          paddingBottom: 8,
          borderBottom: '1px solid var(--line)',
          marginBottom: 0,
        }}
      >
        Past shows
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: '10px 0 0' }}>
        Went to one of these? Your 60-second report updates the seat maps for fans at the next stops.
      </p>

      {visible.map((g) => {
        const d = new Date(g.date + 'T00:00:00');
        const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const day = String(d.getDate()).padStart(2, '0');

        return (
          <div
            key={g.firstSlug}
            role="link"
            tabIndex={0}
            onClick={() => router.push(`/show/${g.firstSlug}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                router.push(`/show/${g.firstSlug}`);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 0',
              borderBottom: '1px solid var(--line)',
              cursor: 'pointer',
            }}
          >
            <div style={{ width: 48, flexShrink: 0, textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  fontSize: 30,
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  color: 'var(--text-dim)',
                }}
              >
                {day}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  fontSize: 10,
                  color: 'var(--text-dim)',
                  letterSpacing: '0.08em',
                  marginTop: 2,
                }}
              >
                {month}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--text-dim)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {g.city}, {g.region}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-dim)',
                  marginTop: 2,
                  opacity: 0.7,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {g.venueName}
                {g.nightLabel && <span style={{ marginLeft: 6 }}>· {g.nightLabel}</span>}
              </div>
            </div>

            <Link
              href={`/report/${g.firstSlug}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                flexShrink: 0,
                display: 'inline-block',
                padding: '5px 12px',
                borderRadius: 999,
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.02em',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Add your report
            </Link>

            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ flexShrink: 0, color: 'var(--text-dim)' }}
            >
              <path
                d="M6 3.5L10.5 8L6 12.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      })}

      {hasMore && (
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            marginTop: 12,
            background: 'none',
            border: '1px solid var(--line)',
            borderRadius: 999,
            color: 'var(--text-dim)',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.04em',
            padding: '6px 16px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          {expanded ? 'Show less' : `Show all ${groups.length} past shows`}
        </button>
      )}
    </div>
  );
}
