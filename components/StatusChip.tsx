type Status = 'upcoming' | 'guide_ready' | 'completed' | 'report_in' | 'guide_soon';

const CONFIG: Record<Status, { label: string; color: string }> = {
  guide_ready:  { label: 'Guide Ready',   color: 'var(--go)' },
  report_in:    { label: 'Night Report',  color: 'var(--go)' },
  completed:    { label: 'Night Report',  color: 'var(--go)' },
  upcoming:     { label: 'Guide Soon',    color: 'var(--warn)' },
  guide_soon:   { label: 'Guide Soon',    color: 'var(--warn)' },
};

export default function StatusChip({ status }: { status: Status }) {
  const { label, color } = CONFIG[status] ?? { label: status, color: 'var(--text-dim)' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 8px',
        borderRadius: 999,
        border: '1px solid var(--line)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
