'use client';
import { useState } from 'react';
import type { SetlistEntry } from '@/lib/types';

const STAGE_ZONE_LABEL: Record<string, string> = {
  main: 'Main', b_stage: 'B-Stage', full_ring: 'Full Ring',
};

export type HistoryRow = {
  slug: string;
  date: string;
  city: string;
  songs: string[];
};

export type ExpectedSetlist = {
  entries: SetlistEntry[];
};

type Props = {
  isUpcoming: boolean;
  isFutureShow: boolean;
  setlist: SetlistEntry[];
  historyRows: HistoryRow[];
  expected: ExpectedSetlist | null;
};

function formatShortDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

export default function SetlistSection({ isUpcoming, isFutureShow, setlist, historyRows, expected }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  if (isUpcoming) {
    if (historyRows.length === 0 && !expected) {
      return <EmptyState>Setlist for this show is not yet available.</EmptyState>;
    }
    const placeholderSlots = expected ? expected.entries.filter((e) => e.is_surprise_slot) : [];

    return (
      <div>
        {placeholderSlots.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {placeholderSlots.map((entry) => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                <span style={posStyle}>{entry.position}</span>
                <span style={{ ...bigSongStyle, fontStyle: 'italic' }}>Surprise pick — TBD</span>
              </div>
            ))}
          </div>
        )}

        {historyRows.length > 0 && (
          <BoxedToggle
            expanded={historyExpanded}
            onClick={() => setHistoryExpanded((e) => !e)}
            openLabel="View surprise songs history"
            closeLabel="Hide history"
            topMargin={placeholderSlots.length > 0}
          />
        )}
        {historyExpanded && historyRows.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>City</th>
                    <th style={thStyle}>Songs</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((row) => (
                    <tr key={row.slug} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={tdStyle}>{formatShortDate(row.date)}</td>
                      <td style={{ ...tdStyle, color: 'var(--text-dim)' }}>{row.city}</td>
                      <td style={tdStyle}>{row.songs.join(' / ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 8 }}>
              Surprise songs · the DJ Spin That segment
            </p>
          </div>
        )}

        {expected && (
          <>
            <MinimalToggle
              expanded={expanded}
              onClick={() => setExpanded((e) => !e)}
              openLabel="View whole setlist"
              closeLabel="Hide setlist"
              topMargin={historyRows.length > 0}
            />
            {expanded && (
              <div style={{ marginTop: 12 }}>
                <SongList entries={expected.entries} maskSurprise={isFutureShow} />
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Completed show
  if (setlist.length === 0) {
    return <EmptyState>Setlist for this show is not yet available.</EmptyState>;
  }

  const surpriseSongs = setlist.filter((e) => e.is_surprise_slot);

  return (
    <div>
      {surpriseSongs.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {surpriseSongs.map((entry) => (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
              <span style={posStyle}>{entry.position}</span>
              <span style={bigSongStyle}>{entry.song}</span>
              <span style={surpriseTagStyle}>✦ Surprise</span>
            </div>
          ))}
        </div>
      )}

      <MinimalToggle
        expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
        openLabel="View whole setlist"
        closeLabel="Hide setlist"
        topMargin={surpriseSongs.length > 0}
      />

      {expanded && (
        <div style={{ marginTop: 12 }}>
          <SongList entries={setlist} />
        </div>
      )}
    </div>
  );
}

function SongList({ entries, maskSurprise = false }: { entries: SetlistEntry[]; maskSurprise?: boolean }) {
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {entries.map((entry) => {
        const isMasked = maskSurprise && entry.is_surprise_slot;
        return (
          <li
            key={entry.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 0',
              borderBottom: '1px solid var(--line)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-dim)',
                width: 22,
                flexShrink: 0,
                textAlign: 'right',
              }}
            >
              {entry.position}
            </span>
            <span
              style={{
                flex: 1,
                fontSize: 14,
                fontStyle: isMasked ? 'italic' : 'normal',
                fontWeight: entry.is_surprise_slot ? 700 : 400,
                color: entry.is_surprise_slot ? 'var(--accent)' : 'var(--text)',
              }}
            >
              {isMasked ? 'Surprise pick — TBD' : entry.song}
              {entry.is_surprise_slot && !isMasked && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'var(--accent)',
                    textTransform: 'uppercase',
                  }}
                >
                  ✦ Surprise
                </span>
              )}
            </span>
            {entry.stage_zone && !isMasked && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--text-dim)',
                  padding: '2px 7px',
                  borderRadius: 999,
                  border: '1px solid var(--line)',
                  whiteSpace: 'nowrap',
                }}
              >
                {STAGE_ZONE_LABEL[entry.stage_zone] ?? entry.stage_zone}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

type ToggleProps = {
  expanded: boolean;
  onClick: () => void;
  openLabel: string;
  closeLabel: string;
  topMargin: boolean;
};

function BoxedToggle({ expanded, onClick, openLabel, closeLabel, topMargin }: ToggleProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: 44,
        marginTop: topMargin ? 16 : 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '10px 16px',
        borderRadius: 10,
        border: '1px solid var(--line)',
        background: 'var(--surface)',
        color: 'var(--text-dim)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}
      >
        <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {expanded ? closeLabel : openLabel}
    </button>
  );
}

function MinimalToggle({ expanded, onClick, openLabel, closeLabel, topMargin }: ToggleProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginTop: topMargin ? 16 : 0,
        background: 'none',
        border: 'none',
        padding: 0,
        color: 'var(--text-dim)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}
      >
        <path d="M4 5L8 8.5L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 9.5L8 13L12 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {expanded ? closeLabel : openLabel}
    </button>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13, color: 'var(--text-dim)', fontStyle: 'italic', margin: 0 }}>
      {children}
    </p>
  );
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-dim)',
};

const tdStyle: React.CSSProperties = {
  padding: '9px 10px',
  color: 'var(--text)',
};

const posStyle: React.CSSProperties = {
  fontFamily: 'var(--font-space-grotesk), sans-serif',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--text-dim)',
  width: 22,
  textAlign: 'right',
  flexShrink: 0,
};

const bigSongStyle: React.CSSProperties = {
  fontFamily: 'var(--font-space-grotesk), sans-serif',
  fontSize: 24,
  fontWeight: 700,
  color: 'var(--accent)',
  letterSpacing: '-0.02em',
  lineHeight: 1.15,
};

const surpriseTagStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--accent)',
  border: '1px solid var(--accent)',
  borderRadius: 999,
  padding: '2px 7px',
  flexShrink: 0,
};
