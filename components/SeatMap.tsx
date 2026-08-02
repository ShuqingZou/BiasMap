'use client';
import { useState, useRef } from 'react';
import SectorCompass from './SectorCompass';
import type { Section, Fact, MemberSectionHeat, StageTemplate } from '@/lib/types';

type Props = {
  sections: Section[];
  viewBox: string;
  stageCenter: { x: number; y: number } | null;
  stageTemplate: StageTemplate | null;
  facts: Fact[];
  members: string[];
  memberHeat: MemberSectionHeat[];
  northAngleDeg: number;
};

const SIDE_NAME: Record<string, string> = {
  N: 'north', NE: 'northeast', E: 'east', SE: 'southeast',
  S: 'south', SW: 'southwest', W: 'west', NW: 'northwest',
};

// heat_bucket 1 = hottest (top quintile) -> darkest; 5 = coldest -> lightest.
const BUCKET_FILL_PCT: Record<number, number> = { 1: 90, 2: 65, 3: 42, 4: 24, 5: 10 };

function stars(heatBucket: number): string {
  const filled = Math.max(0, Math.min(5, 6 - heatBucket));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

function sectionPath(polygon: [number, number][]): string {
  if (!polygon || polygon.length < 3) return '';
  return `M ${polygon[0][0]} ${polygon[0][1]} ${polygon
    .slice(1)
    .map(([x, y]) => `L ${x} ${y}`)
    .join(' ')} Z`;
}

const GROUND_PADDING = 0.03;

function groundRect(sections: Section[]): { x: number; y: number; width: number; height: number; rx: number } | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const sec of sections) {
    for (const [x, y] of sec.polygon) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (minX === Infinity) return null;

  const width = maxX - minX;
  const height = maxY - minY;
  const padX = width * GROUND_PADDING;
  const padY = height * GROUND_PADDING;

  return {
    x: minX - padX,
    y: minY - padY,
    width: width + padX * 2,
    height: height + padY * 2,
    rx: Math.min(width, height) * GROUND_PADDING,
  };
}

const TIER_LABEL: Record<string, string> = {
  floor: 'Floor', lower: 'Lower', club: 'Club', upper: 'Upper',
};

export default function SeatMap({ sections, viewBox, stageCenter, stageTemplate, facts, members, memberHeat, northAngleDeg }: Props) {
  const [zoom, setZoom] = useState(1);
  const [panCenter, setPanCenter] = useState<{ x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<Section | null>(null);
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; cx: number; cy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [vx, vy, vw, vh] = viewBox.split(' ').map(Number);
  const defaultCenter = stageCenter ?? { x: vx + vw / 2, y: vy + vh / 2 };
  const center = panCenter ?? defaultCenter;
  const zoomedW = vw / zoom;
  const zoomedH = vh / zoom;
  const currentViewBox = `${center.x - zoomedW / 2} ${center.y - zoomedH / 2} ${zoomedW} ${zoomedH}`;
  const stageRadius = vw * 0.06;
  const ground = groundRect(sections);

  const searchTrim = search.trim().toUpperCase();
  const searchMatch = searchTrim
    ? sections.find((s) => s.code.toUpperCase() === searchTrim) ?? null
    : null;

  const sectionByCode = new Map(sections.map((s) => [s.code, s]));
  const memberData = selectedMember ? memberHeat.filter((h) => h.member === selectedMember) : [];
  const showsAnalyzed = memberData[0]?.shows_analyzed ?? 0;
  const top3 = [...memberData].sort((a, b) => a.section_rank - b.section_rank).slice(0, 3);

  function getMemberFill(sec: Section): string {
    const heat = memberData.find((h) => h.section === sec.code);
    if (!heat) return 'var(--surface)';
    const pct = BUCKET_FILL_PCT[heat.heat_bucket] ?? 14;
    return `color-mix(in srgb, var(--warn) ${pct}%, var(--surface))`;
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (zoom <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, cx: center.x, cy: center.y };
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = zoomedW / rect.width;
    const scaleY = zoomedH / rect.height;
    setPanCenter({ x: dragRef.current.cx - dx * scaleX, y: dragRef.current.cy - dy * scaleY });
  }

  function handlePointerUp() {
    setIsDragging(false);
    dragRef.current = null;
  }

  function zoomIn() { setZoom((z) => Math.min(z + 1, 4)); }
  function zoomOut() {
    setZoom((z) => {
      const next = Math.max(z - 1, 1);
      if (next === 1) setPanCenter(null);
      return next;
    });
  }

  function handleSectionClick(sec: Section) {
    setSelected((cur) => (cur?.id === sec.id ? null : sec));
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchMatch) {
      setSelected(searchMatch);
      setPanCenter(searchMatch.centroid);
    }
  }

  const sectionFacts = selected
    ? facts.filter(
        (f) =>
          f.section_code === selected.code ||
          (f.sector && f.sector === selected.facing_sector)
      )
    : [];

  const selectedMemberHeat = selected
    ? memberData.find((h) => h.section === selected.code) ?? null
    : null;

  // One-liner insight, shown only when a member and a section are both selected.
  let insightLine: string | null = null;
  if (selectedMember && selected) {
    const parts: string[] = [];

    const sameSideTop = memberData
      .filter((h) => h.heat_bucket === 1 && sectionByCode.get(h.section)?.facing_sector === selected.facing_sector)
      .sort((a, b) => a.section_rank - b.section_rank)
      .map((h) => h.section);
    if (selected.facing_sector && sameSideTop.length >= 2 && sameSideTop.includes(selected.code)) {
      const side = SIDE_NAME[selected.facing_sector] ?? selected.facing_sector;
      parts.push(`${sameSideTop.join(', ')} are ${selectedMember}'s ${side} side this tour`);
    }

    const bestOverall = memberHeat.reduce<MemberSectionHeat | null>(
      (best, h) => (!best || h.weighted_minutes > best.weighted_minutes ? h : best),
      null
    );
    if (bestOverall && bestOverall.section === selected.code) {
      const tierLabel = (TIER_LABEL[bestOverall.tier] ?? bestOverall.tier).toLowerCase();
      parts.push(`${tierLabel} ${bestOverall.section} is the best any-member seat this tour`);
    }

    insightLine = parts.length > 0 ? parts.join(' — ') : null;
  }

  if (sections.length === 0) {
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
        Seat map coming soon.
      </div>
    );
  }

  return (
    <div>
      {/* Member pills */}
      {members.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <MemberPill
            label="Overview"
            selected={!selectedMember}
            onClick={() => setSelectedMember(null)}
          />
          {members.map((m) => (
            <MemberPill
              key={m}
              label={m}
              selected={selectedMember === m}
              onClick={() => setSelectedMember((cur) => (cur === m ? null : m))}
            />
          ))}
        </div>
      )}

      {/* Controls row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <form onSubmit={handleSearchSubmit} style={{ flex: 1 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find your section — e.g. 113"
            style={{
              width: '100%',
              background: 'var(--surface)',
              border: `1px solid ${searchMatch ? 'var(--accent)' : 'var(--line)'}`,
              borderRadius: 8,
              padding: '8px 12px',
              color: 'var(--text)',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </form>
        <ZoomBtn onClick={zoomOut} disabled={zoom <= 1}>−</ZoomBtn>
        <ZoomBtn onClick={zoomIn} disabled={zoom >= 4}>+</ZoomBtn>
      </div>

      {/* SVG */}
      <div
        style={{
          position: 'relative',
          borderRadius: 12,
          border: '1px solid var(--line)',
          overflow: 'hidden',
          background: 'var(--bg)',
          touchAction: 'none',
        }}
      >
        <svg
          ref={svgRef}
          viewBox={currentViewBox}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <rect
            x={vx}
            y={vy}
            width={vw}
            height={vh}
            fill="var(--bg)"
            onClick={() => setSelected(null)}
          />

          {/* Ground — venue floor beneath untraced gaps between sections */}
          {ground && (
            <rect
              x={ground.x}
              y={ground.y}
              width={ground.width}
              height={ground.height}
              rx={ground.rx}
              fill="var(--ground)"
              onClick={() => setSelected(null)}
            />
          )}

          {/* Stage template — guide layer, under the sections */}
          {stageTemplate && stageCenter && (
            <g transform={`translate(${stageCenter.x}, ${stageCenter.y})`}>
              {stageTemplate.paths.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke="var(--line)"
                  strokeWidth={1}
                />
              ))}
            </g>
          )}

          {sections.map((sec) => {
            const isSelected = selected?.id === sec.id;
            const isMatch = searchMatch?.id === sec.id;
            const fill = selectedMember
              ? getMemberFill(sec)
              : isSelected
              ? 'var(--accent)'
              : isMatch
              ? 'color-mix(in srgb, var(--accent) 35%, var(--surface))'
              : 'var(--surface)';
            return (
              <path
                key={sec.id}
                d={sectionPath(sec.polygon)}
                fill={fill}
                stroke={isSelected || isMatch ? 'var(--accent)' : 'var(--line)'}
                strokeWidth={isSelected ? 3 : 1.5}
                style={{ cursor: 'pointer' }}
                onClick={() => handleSectionClick(sec)}
              />
            );
          })}

          {/* Stage orientation overlay */}
          {stageCenter && (
            <g>
              {Array.from({ length: 8 }, (_, i) => {
                const angle = ((i * 45 - 90 + northAngleDeg) * Math.PI) / 180;
                const r1 = stageRadius;
                const r2 = stageRadius * 2.8;
                return (
                  <line
                    key={i}
                    x1={stageCenter.x + r1 * Math.cos(angle)}
                    y1={stageCenter.y + r1 * Math.sin(angle)}
                    x2={stageCenter.x + r2 * Math.cos(angle)}
                    y2={stageCenter.y + r2 * Math.sin(angle)}
                    stroke="var(--line)"
                    strokeWidth={0.8}
                    strokeDasharray="5 5"
                  />
                );
              })}
              {!stageTemplate && (
                <circle
                  cx={stageCenter.x}
                  cy={stageCenter.y}
                  r={stageRadius}
                  fill="var(--surface)"
                  stroke="var(--line)"
                  strokeWidth={2}
                  onClick={() => setSelected(null)}
                />
              )}
              <text
                x={stageCenter.x}
                y={stageCenter.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={stageRadius * 0.45}
                fill="var(--text-dim)"
                fontFamily="sans-serif"
                style={{ userSelect: 'none' }}
              >
                STAGE
              </text>
            </g>
          )}
        </svg>

        {stageCenter && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-dim)',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '2px 7px',
              userSelect: 'none',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: `rotate(${northAngleDeg}deg)`,
              }}
            >
              ↑
            </span>
            N
          </div>
        )}

        {zoom > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              fontSize: 11,
              color: 'var(--text-dim)',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '2px 6px',
            }}
          >
            {zoom}×
          </div>
        )}
      </div>

      {/* Legend — only when a member is selected */}
      {selectedMember && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {[1, 2, 3, 4, 5].map((bucket) => (
                <div
                  key={bucket}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: `color-mix(in srgb, var(--warn) ${BUCKET_FILL_PCT[bucket]}%, var(--surface))`,
                  }}
                />
              ))}
              <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 4 }}>
                Darker = more time near these seats
              </span>
            </div>
            {showsAnalyzed > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 999,
                  border: '1px solid var(--line)',
                  fontSize: 11,
                  color: 'var(--text-dim)',
                }}
              >
                Based on {showsAnalyzed} show{showsAnalyzed !== 1 ? 's' : ''} logged
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, fontStyle: 'italic' }}>
            Historical patterns, not promises — every night is different.
          </p>

          {top3.length > 0 && (
            <div style={{ marginTop: 12 }}>
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
                Top 3 for {selectedMember}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {top3.map((h) => (
                  <div
                    key={h.section}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>
                      <strong>{h.section}</strong>{' '}
                      <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                        {TIER_LABEL[h.tier] ?? h.tier}
                      </span>
                    </span>
                    <span style={{ color: 'var(--warn)', fontSize: 13, letterSpacing: 1 }}>
                      {stars(h.heat_bucket)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section sheet */}
      {selected && (
        <div
          style={{
            marginTop: 12,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  fontWeight: 700,
                  fontSize: 20,
                  color: 'var(--text)',
                }}
              >
                Section {selected.code}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--text-dim)',
                  padding: '2px 6px',
                  border: '1px solid var(--line)',
                  borderRadius: 999,
                }}
              >
                {TIER_LABEL[selected.tier] ?? selected.tier}
              </span>
            </div>
            <button
              onClick={() => setSelected(null)}
              style={{
                background: 'none',
                border: '1px solid var(--line)',
                borderRadius: 6,
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: '2px 8px',
                fontSize: 13,
              }}
            >
              ✕
            </button>
          </div>

          {insightLine && (
            <p
              style={{
                margin: '0 0 14px',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--text)',
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              {insightLine}
            </p>
          )}

          <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
            {selected.facing_sector && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SectorCompass highlighted={selected.facing_sector} size={28} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Faces</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    {selected.facing_sector} rim
                  </div>
                </div>
              </div>
            )}
            {selected.distance_m != null && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>To stage</div>
                <div
                  style={{
                    fontFamily: 'var(--font-space-grotesk), sans-serif',
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'var(--text)',
                  }}
                >
                  ~{Math.round(selected.distance_m)}m
                </div>
              </div>
            )}
            {selectedMember && selectedMemberHeat && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{selectedMember}&apos;s time here</div>
                <div
                  style={{
                    fontFamily: 'var(--font-space-grotesk), sans-serif',
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'var(--text)',
                  }}
                >
                  {Math.round(selectedMemberHeat.weighted_minutes)}m · {stars(selectedMemberHeat.heat_bucket)}
                </div>
              </div>
            )}
          </div>

          {sectionFacts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sectionFacts
                .sort((a, b) => {
                  if (a.kind === 'obstruction') return -1;
                  if (b.kind === 'obstruction') return 1;
                  return 0;
                })
                .map((f) => (
                  <div
                    key={f.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: `1px solid ${f.kind === 'obstruction' ? 'var(--warn)' : 'var(--line)'}`,
                      background: 'var(--bg)',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: f.kind === 'obstruction' ? 'var(--warn)' : 'var(--text)',
                        lineHeight: 1.5,
                      }}
                    >
                      {f.claim}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ZoomBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 36,
        height: 36,
        flexShrink: 0,
        borderRadius: 8,
        border: '1px solid var(--line)',
        background: 'var(--surface)',
        color: disabled ? 'var(--line)' : 'var(--text)',
        fontSize: 18,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}

function MemberPill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        minHeight: 40,
        padding: '8px 18px',
        borderRadius: 999,
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--line)'}`,
        background: selected ? 'var(--accent)' : 'var(--surface)',
        color: selected ? '#fff' : 'var(--text)',
        fontSize: 14,
        fontWeight: selected ? 700 : 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
}
