import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About — BiasMap',
  description: 'What BiasMap is, who made it, and how the data is sourced.',
};

export default function AboutPage() {
  return (
    <div style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 560 }}>
      <Link
        href="/"
        style={{ fontSize: 12, color: 'var(--text-dim)', textDecoration: 'none', display: 'block', marginBottom: 24 }}
      >
        ← Back
      </Link>

      <h1
        style={{
          fontFamily: 'var(--font-space-grotesk), sans-serif',
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          margin: '0 0 8px',
        }}
      >
        About BiasMap
      </h1>
      <p
        style={{
          fontSize: 14,
          color: 'var(--text-dim)',
          marginTop: 0,
          marginBottom: 36,
          fontStyle: 'italic',
        }}
      >
        Know your seat before the lights go down.
      </p>

      <Section title="What this is">
        <p>
          BiasMap aggregates tour intel — setlists, stage layouts, member position patterns, and fan
          section reports — and surfaces it per show, per venue, per seat section. The goal is simple:
          help you pick or understand your seat <em>before</em> the concert.
        </p>
        <p>
          Launch content covers the BTS ARIRANG World Tour, North American leg. The architecture supports
          multiple artists and tours; more will follow.
        </p>
      </Section>

      <Section title="Data sources">
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>Fancam archives analyzed for member position and stage zone timing</li>
          <li>Community setlist logs cross-referenced across multiple nights</li>
          <li>Venue maps and section coordinates from official ticketing layouts</li>
          <li>Fan reports submitted through this site after each completed show</li>
        </ul>
        <p>
          All claims are paraphrased — never verbatim quotes. Confidence levels (high / medium / low)
          reflect corroboration count and source quality. Intel labeled &ldquo;low confidence&rdquo; is
          based on limited data and should be treated accordingly.
        </p>
      </Section>

      <Section title="Fan reports">
        <p>
          After each completed show, attendees can submit a section report: view rating, who was close
          and when, any obstructions. Reports feed an offline pipeline and eventually surface as
          corroborated intel on the show guide. Submitted reports are not publicly listed in v1.
        </p>
      </Section>

      <Section title="Disclaimer">
        <p>
          BiasMap is an independent fan project. It is not affiliated with, endorsed by, or connected
          to HYBE, BigHit Music, BTS, or any official tour operator. All artist names and tour names
          are used for informational identification only.
        </p>
        <p>
          Concert experiences vary. This site provides probabilistic intel based on historical
          patterns — it does not guarantee any member will be in a given sector during your show.
        </p>
      </Section>

      <div
        style={{
          marginTop: 40,
          paddingTop: 24,
          borderTop: '1px solid var(--line)',
          fontSize: 12,
          color: 'var(--text-dim)',
        }}
      >
        BiasMap v1 · Built for fans, by a fan.
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2
        style={{
          fontFamily: 'var(--font-space-grotesk), sans-serif',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
          margin: '0 0 12px',
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text)' }}>{children}</div>
    </div>
  );
}
