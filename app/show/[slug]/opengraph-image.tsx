import { ImageResponse } from 'next/og';
import { getSupabaseClient } from '@/lib/supabase';
import type { Show, Venue, Tour } from '@/lib/types';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type ShowWithRelations = Show & { venues: Venue; tours: Tour & { artists: { name: string } } };

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabaseClient();

  const { data: show } = await supabase
    .from('shows')
    .select('*, venues(*), tours(*, artists(*))')
    .eq('slug', slug)
    .single<ShowWithRelations>();

  const venue = show?.venues.name ?? 'Show';
  const city = show?.venues.city ?? 'Show';
  const dateStr = show
    ? new Date(show.date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : '';
  const monthDayStr = show
    ? new Date(show.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';
  const artist = show?.tours.artists.name ?? 'BTS';
  const tour = show?.tours.name ?? 'ARIRANG World Tour';

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0E0D12',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px 72px',
          fontFamily: 'sans-serif',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: 16,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#9B97A8',
              marginBottom: 16,
            }}
          >
            {artist} · {tour}
          </span>
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: '#F2F0F7',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            {monthDayStr} · {city}
          </span>
          <span style={{ fontSize: 28, color: '#9B97A8', marginTop: 16 }}>
            {venue}{dateStr ? ` · ${dateStr}` : ''}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <span
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#A78BFA',
              letterSpacing: '-0.02em',
            }}
          >
            BiasMap
          </span>
          <span style={{ fontSize: 16, color: '#9B97A8' }}>
            Know your seat before the lights go down.
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
