import Link from 'next/link';

type Tab = { slug: string; night_number: number; date: string };

export default function DaySwitcher({ tabs, currentSlug }: { tabs: Tab[]; currentSlug: string }) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        borderBottom: '1px solid var(--line)',
        marginBottom: 20,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.slug === currentSlug;
        const dateLabel = new Date(tab.date + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'short', day: 'numeric',
        });
        return (
          <Link
            key={tab.slug}
            href={`/show/${tab.slug}`}
            className="day-tab"
            style={{
              flex: 1,
              minHeight: 44,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '6px 4px',
              textDecoration: 'none',
              position: 'relative',
              color: isActive ? 'var(--text)' : 'color-mix(in srgb, var(--text) 70%, var(--text-dim) 30%)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                lineHeight: 1.2,
              }}
            >
              Day {tab.night_number}
            </span>
            <span style={{ fontSize: 11, lineHeight: 1.2, opacity: 0.85 }}>
              {dateLabel}
            </span>
            <span
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: -1,
                height: 2,
                background: isActive ? 'var(--accent)' : 'transparent',
              }}
            />
          </Link>
        );
      })}
    </div>
  );
}
