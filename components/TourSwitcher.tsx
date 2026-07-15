type Tour = { artistName: string; tourName: string };

export default function TourSwitcher({ tours, current }: { tours: Tour[]; current: string }) {
  if (tours.length <= 1) {
    const t = tours[0];
    return (
      <div style={{ marginBottom: 20 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 999,
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-dim)',
            letterSpacing: '0.04em',
          }}
        >
          {t?.artistName} · {t?.tourName}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
      {tours.map((t) => (
        <span
          key={t.tourName}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: 999,
            border: `1px solid ${t.tourName === current ? 'var(--accent)' : 'var(--line)'}`,
            background: t.tourName === current ? 'var(--accent)' : 'var(--surface)',
            fontSize: 12,
            fontWeight: 600,
            color: t.tourName === current ? '#fff' : 'var(--text-dim)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {t.artistName} · {t.tourName}
        </span>
      ))}
    </div>
  );
}
