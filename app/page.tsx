import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import type { Show, Venue, Tour } from '@/lib/types';
import TourSwitcher from '@/components/TourSwitcher';
import StatusChip from '@/components/StatusChip';
import Countdown from '@/components/Countdown';
import PastShowsExpander from '@/components/PastShowsExpander';

export const revalidate = 60;

type ShowRow = Show & {
  venues: Venue;
  tours: Tour & { artists: { name: string } };
};

type VenueGroup = {
  venueId: string;
  venueName: string;
  venueSlug: string;
  city: string;
  region: string;
  date: string;
  firstSlug: string;
  nightLabel: string;
  status: Show['status'];
};

function formatNightRange(sorted: ShowRow[]): string {
  const nightCount = sorted.length;
  if (nightCount === 1) return '';
  const first = new Date(sorted[0].date + 'T00:00:00');
  const last = new Date(sorted[sorted.length - 1].date + 'T00:00:00');
  const firstMonth = first.toLocaleString('en-US', { month: 'short' });
  const lastMonth = last.toLocaleString('en-US', { month: 'short' });
  const range = firstMonth === lastMonth
    ? `${firstMonth} ${first.getDate()}–${last.getDate()}`
    : `${firstMonth} ${first.getDate()}–${lastMonth} ${last.getDate()}`;
  return `${nightCount} nights · ${range}`;
}

function groupByVenue(shows: ShowRow[]): VenueGroup[] {
  const map = new Map<string, ShowRow[]>();
  for (const s of shows) {
    const key = s.venue_id;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  const groups: VenueGroup[] = [];
  for (const [venueId, nights] of map) {
    const sorted = nights.sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0];
    groups.push({
      venueId,
      venueName: first.venues.name,
      venueSlug: first.venues.slug,
      city: first.venues.city,
      region: first.venues.region,
      date: first.date,
      firstSlug: first.slug,
      nightLabel: formatNightRange(sorted),
      status: first.status,
    });
  }
  return groups.sort((a, b) => a.date.localeCompare(b.date));
}

function groupByMonth(groups: VenueGroup[]): Map<string, VenueGroup[]> {
  const map = new Map<string, VenueGroup[]>();
  for (const g of groups) {
    const d = new Date(g.date + 'T00:00:00');
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(g);
  }
  return map;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    day: String(d.getDate()).padStart(2, '0'),
    weekday: d.toLocaleString('en-US', { weekday: 'long' }),
    full: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    monthDay: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase(),
  };
}

function ShowCard({ group }: { group: VenueGroup }) {
  const date = formatDate(group.date);
  return (
    <Link
      href={`/show/${group.firstSlug}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 0',
        borderBottom: '1px solid var(--line)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      {/* Date block */}
      <div style={{ width: 48, flexShrink: 0, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontSize: 30,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: 'var(--text)',
          }}
        >
          {date.day}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-dim)',
            letterSpacing: '0.08em',
            marginTop: 2,
          }}
        >
          {date.month}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {group.city}, {group.region}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-dim)',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {group.venueName}
          {group.nightLabel && <span style={{ marginLeft: 6 }}>· {group.nightLabel}</span>}
        </div>
      </div>

      <StatusChip status={group.status} />

      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        style={{ flexShrink: 0, color: 'var(--text-dim)' }}
      >
        <path
          d="M6 3.5L10.5 8L6 12.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

export default async function HomePage() {
  const supabase = getSupabaseClient();
  const { data: shows } = await supabase
    .from('shows')
    .select('*, venues(*), tours(*, artists(*))')
    .order('date', { ascending: true })
    .returns<ShowRow[]>();

  if (!shows || shows.length === 0) {
    return (
      <div style={{ paddingTop: 48, textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>
        Show dates coming soon.
      </div>
    );
  }

  const tour = shows[0].tours;
  const artist = shows[0].tours.artists;

  const upcoming = shows.filter((s) => s.status === 'upcoming' || s.status === 'guide_ready');
  const past = shows.filter((s) => s.status === 'report_in' || s.status === 'completed');
  const completedCount = past.length;

  const nextShow = upcoming[0] ?? null;
  const upcomingGroups = groupByVenue(upcoming);
  const byMonth = groupByMonth(upcomingGroups);
  const pastGroups = groupByVenue(past).reverse();

  return (
    <div style={{ paddingTop: 28, paddingBottom: 64 }}>
      {/* Tour context */}
      <TourSwitcher
        tours={[{ artistName: artist.name, tourName: tour.name }]}
        current={tour.name}
      />

      {/* Hero card */}
      {nextShow && (() => {
        const date = formatDate(nextShow.date);
        return (
          <Link
            href={`/show/${nextShow.slug}`}
            style={{
              display: 'block',
              textDecoration: 'none',
              color: 'inherit',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: '20px',
              marginBottom: 32,
            }}
          >
            {/* Eyebrow */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: 12,
              }}
            >
              Next show ·{' '}
              <Countdown targetDate={nextShow.date} localTime={nextShow.local_start} />
            </div>

            {/* Date + place */}
            <div
              style={{
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                color: 'var(--text)',
              }}
            >
              {date.monthDay} · {nextShow.venues.city}, {nextShow.venues.region}
            </div>

            <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>
              {date.weekday} · {nextShow.venues.name}
              {nextShow.night_number > 1 && `, Day ${nextShow.night_number}`}
            </div>

            {/* Status chips */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <StatusChip status={nextShow.status} />
              {completedCount > 0 && (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: 999,
                    border: '1px solid var(--line)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--text-dim)',
                  }}
                >
                  Intel from {completedCount} show{completedCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </Link>
        );
      })()}

      {/* Upcoming shows by month */}
      {Array.from(byMonth.entries()).map(([month, groups]) => (
        <div key={month} style={{ marginBottom: 32 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              marginBottom: 4,
              paddingBottom: 8,
              borderBottom: '1px solid var(--line)',
            }}
          >
            {month}
          </div>
          {groups.map((g) => (
            <ShowCard key={g.firstSlug} group={g} />
          ))}
        </div>
      ))}

      {/* Past shows */}
      {pastGroups.length > 0 && (
        <PastShowsExpander groups={pastGroups} />
      )}
    </div>
  );
}
