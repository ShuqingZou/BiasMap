import type { Confidence } from '@/lib/types';

type Props = {
  confidence: Confidence;
  fancamCount?: number;
  showsAnalyzed?: number;
  reportCount?: number;
};

const confidenceColor: Record<Confidence, string> = {
  high: 'var(--go)',
  medium: 'var(--warn)',
  low: 'var(--text-dim)',
};

const confidenceLabel: Record<Confidence, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};

export default function ConfidencePill({ confidence, fancamCount, showsAnalyzed, reportCount }: Props) {
  const parts: string[] = [];
  if (fancamCount != null) parts.push(`${fancamCount} fancam${fancamCount !== 1 ? 's' : ''}`);
  if (showsAnalyzed != null) parts.push(`${showsAnalyzed} show${showsAnalyzed !== 1 ? 's' : ''}`);
  if (reportCount != null && reportCount > 1) parts.push(`${reportCount} reports`);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 999,
        border: '1px solid var(--line)',
        fontSize: 11,
        fontFamily: 'var(--font-inter), sans-serif',
        color: 'var(--text-dim)',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: confidenceColor[confidence],
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {parts.length > 0 ? `Based on ${parts.join(' · ')}` : confidenceLabel[confidence]}
    </span>
  );
}
