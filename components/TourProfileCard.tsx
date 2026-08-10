'use client';
import { useState } from 'react';
import type { MemberTourProfile, TourProfileCategory } from '@/lib/types';

const HALF_LABELS: Record<string, string> = {
  upper: 'Upper half',
  lower: 'Lower half',
  left: 'Left half',
  right: 'Right half',
};

const ARM_LABELS: Record<string, string> = {
  ARM_TL: 'Top-left arm',
  ARM_TR: 'Top-right arm',
  ARM_BL: 'Bottom-left arm',
  ARM_BR: 'Bottom-right arm',
};

const EDGE_LABELS: Record<string, string> = {
  EDGE_N: 'Top edge',
  EDGE_E: 'Right edge',
  EDGE_S: 'Bottom edge',
  EDGE_W: 'Left edge',
};

const ITEM_LABELS: Record<string, string> = { ...HALF_LABELS, ...ARM_LABELS, ...EDGE_LABELS };

const CATEGORY_HEADERS: Record<TourProfileCategory, string> = {
  half: 'Which side of the arena',
  arm: 'Which arm',
  edge: 'Which edge',
};

const CATEGORY_ORDER: TourProfileCategory[] = ['half', 'arm', 'edge'];

function initials(name: string): string {
  return name
    .split(/[\s-]+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

type Props = {
  profiles: MemberTourProfile[];
  members: string[];
};

export default function TourProfileCard({ profiles, members }: Props) {
  const [selectedMember, setSelectedMember] = useState(members[0] ?? '');

  if (members.length === 0 || profiles.length === 0) {
    return (
      <div
        style={{
          padding: '32px',
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontSize: 13,
          background: 'var(--surface)',
          borderRadius: 12,
          border: '1px solid var(--line)',
        }}
      >
        Member tour profiles coming soon.
      </div>
    );
  }

  const memberProfile = profiles.filter((p) => p.member === selectedMember);
  const showsAnalyzed = memberProfile[0]?.shows_analyzed ?? 0;

  return (
    <div>
      {/* Member pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {members.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMember(m)}
            style={{
              minHeight: 40,
              padding: '8px 18px',
              borderRadius: 999,
              border: `1px solid ${selectedMember === m ? 'var(--accent)' : 'var(--line)'}`,
              background: selectedMember === m ? 'var(--accent)' : 'var(--surface)',
              color: selectedMember === m ? '#fff' : 'var(--text)',
              fontSize: 14,
              fontWeight: selectedMember === m ? 700 : 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Card */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--accent)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {initials(selectedMember)}
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontWeight: 700,
                fontSize: 18,
                color: 'var(--text)',
              }}
            >
              {selectedMember}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Based on {showsAnalyzed} show{showsAnalyzed !== 1 ? 's' : ''} this tour
            </div>
          </div>
        </div>

        {/* Category sections */}
        {CATEGORY_ORDER.map((category) => (
          <CategorySection
            key={category}
            title={CATEGORY_HEADERS[category]}
            items={memberProfile
              .filter((p) => p.category === category)
              .sort((a, b) => a.item_rank - b.item_rank)}
          />
        ))}

        <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, marginBottom: 0, fontStyle: 'italic' }}>
          Based on tour patterns so far. Every night is different.
        </p>
      </div>
    </div>
  );
}

function CategorySection({ title, items }: { title: string; items: MemberTourProfile[] }) {
  const topRank = items[0]?.item_rank ?? 1;

  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((it) => {
          const isTop = it.item_rank === topRank;
          return (
            <div
              key={it.item}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: isTop ? 'color-mix(in srgb, var(--accent) 12%, var(--bg))' : 'var(--bg)',
                border: `1px solid ${isTop ? 'var(--accent)' : 'var(--line)'}`,
                borderRadius: 8,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-space-grotesk), sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-dim)',
                    width: 14,
                    flexShrink: 0,
                  }}
                >
                  {it.item_rank}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isTop ? 700 : 400,
                    color: isTop ? 'var(--text)' : 'var(--text-dim)',
                  }}
                >
                  {isTop && '★ '}
                  {ITEM_LABELS[it.item] ?? it.item}
                </span>
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  fontSize: 13,
                  fontWeight: isTop ? 700 : 500,
                  color: isTop ? 'var(--accent)' : 'var(--text-dim)',
                }}
              >
                {it.pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
