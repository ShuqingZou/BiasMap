import React from 'react';

const SECTOR_NAMES = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

function polarToXY(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function sectorPath(index: number, rInner: number, rOuter: number, cx: number, cy: number, gap = 3) {
  const startAngle = index * 45 - 22.5 + gap / 2;
  const endAngle = index * 45 + 22.5 - gap / 2;

  const [x1, y1] = polarToXY(startAngle, rOuter, cx, cy);
  const [x2, y2] = polarToXY(endAngle, rOuter, cx, cy);
  const [x3, y3] = polarToXY(endAngle, rInner, cx, cy);
  const [x4, y4] = polarToXY(startAngle, rInner, cx, cy);

  return `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${rOuter} ${rOuter} 0 0 1 ${x2.toFixed(3)} ${y2.toFixed(3)} L ${x3.toFixed(3)} ${y3.toFixed(3)} A ${rInner} ${rInner} 0 0 0 ${x4.toFixed(3)} ${y4.toFixed(3)} Z`;
}

type Props = {
  highlighted?: string;
  heatmap?: Record<string, number>;
  size?: number;
  className?: string;
};

export default function SectorCompass({ highlighted, heatmap, size = 20, className }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const rInner = size * 0.2;
  const rOuter = size * 0.46;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={highlighted ? `Sector compass: ${highlighted}` : 'Sector compass'}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {SECTOR_NAMES.map((name, i) => {
        const isHighlighted = highlighted === name;
        const heat = heatmap?.[name] ?? 0;
        const fill = isHighlighted
          ? 'var(--accent)'
          : heatmap
          ? `color-mix(in srgb, var(--accent) ${Math.round(heat * 70 + 10)}%, var(--surface))`
          : 'var(--line)';

        return (
          <path
            key={name}
            d={sectorPath(i, rInner, rOuter, cx, cy)}
            fill={fill}
          />
        );
      })}
    </svg>
  );
}
