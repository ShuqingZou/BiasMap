import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getSupabaseClient } from '@/lib/supabase';
import type { Show, Venue, Tour, SetlistEntry, Fact, MemberSectionHeat, MemberTourProfile, Section } from '@/lib/types';
import Countdown from '@/components/Countdown';
import StatusChip from '@/components/StatusChip';
import SeatMap from '@/components/SeatMap';
import TourProfileCard from '@/components/TourProfileCard';
import DaySwitcher from '@/components/DaySwitcher';
import SetlistSection, { type HistoryRow, type ExpectedSetlist } from '@/components/SetlistSection';

export const revalidate = 60;

type ShowFull = Show & {
  venues: Venue & { sections: Section[] };
  tours: Tour & { artists: { name: string } };
};

type SiblingShow = { slug: string; night_number: number; date: string };

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('shows')
    .select('date, venues(name, city, region), tours(name, artists(name))')
    .eq('slug', slug)
    .single<Pick<ShowFull, 'date'> & { venues: Pick<Venue, 'name' | 'city' | 'region'>; tours: Pick<Tour, 'name'> & { artists: { name: string } } }>();
  if (!data) return { title: 'Show — BiasMap' };
  const monthDayStr = new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
  return {
    title: `${monthDayStr} · ${data.venues.city} — BiasMap`,
    description: `Seat intel for ${data.tours.artists.name} at ${data.venues.name}, ${data.venues.city}.`,
  };
}

// Supabase/PostgREST caps a single response at 1000 rows regardless of the
// requested range — member_section_heat can exceed that per venue, so page through it.
async function fetchAllMemberHeat(
  supabase: ReturnType<typeof getSupabaseClient>,
  venueId: string
): Promise<MemberSectionHeat[]> {
  const pageSize = 1000;
  const all: MemberSectionHeat[] = [];
  let offset = 0;
  for (;;) {
    const { data } = await supabase
      .from('member_section_heat')
      .select('*')
      .eq('venue_id', venueId)
      .range(offset, offset + pageSize - 1)
      .returns<MemberSectionHeat[]>();
    const page = data ?? [];
    all.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

export default async function ShowPage({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = getSupabaseClient();

  const [showRes, setlistRes, factsRes] = await Promise.all([
    supabase
      .from('shows')
      .select('*, venues(*, sections(*)), tours(*, artists(*))')
      .eq('slug', slug)
      .single<ShowFull>(),
    supabase
      .from('setlist_entries')
      .select('*')
      .order('position', { ascending: true })
      .returns<SetlistEntry[]>(),
    supabase
      .from('facts')
      .select('*')
      .returns<Fact[]>(),
  ]);

  const show = showRes.data;
  if (!show) return notFound();

  const showId = show.id;
  const tourId = show.tour_id;
  const venueId = show.venue_id;

  const setlist = (setlistRes.data ?? []).filter((e) => e.show_id === showId);
  const facts = (factsRes.data ?? []).filter(
    (f) =>
      f.show_id === showId ||
      (f.venue_id === venueId && !f.show_id) ||
      (!f.venue_id && !f.show_id && f.tour_id === tourId)
  );
  const sections = show.venues.sections ?? [];
  const members = show.tours.members ?? [];

  // Status-based, not date-based: a show's date can slip into the past before its
  // status/log catch up. Drives setlist masking (upcoming = masked, past = full)
  // independently of whether we have heatmap data for this venue yet.
  const isUpcoming = show.status === 'upcoming' || show.status === 'guide_ready';
  const isCompleted = show.status === 'completed' || show.status === 'report_in';

  // member_section_heat is hand-logged from VOD (see position_log). The view is
  // venue-aware (venue_id/section_rank/heat_bucket are all scoped per venue), so
  // filtering by this show's venue is enough — no per-venue hardcoding needed.
  // Only past shows can have a log, so skip the fetch entirely for upcoming ones.
  const memberHeat = isUpcoming ? [] : await fetchAllMemberHeat(supabase, venueId);

  // Three states: (1) past show with a logged heatmap for this venue -> Seat Map,
  // (2) past show whose venue hasn't been logged yet -> Profile Card (same as
  // upcoming), (3) upcoming show -> always Profile Card, even if this venue
  // happens to have heatmap data from other nights — we never predict a night
  // that hasn't happened.
  const showHeatmap = !isUpcoming && memberHeat.length > 0;

  // member_tour_profile is tour-wide (no venue/show dimension), so it's the same
  // data whenever it's needed, regardless of which show triggered the fetch.
  const memberProfiles = showHeatmap
    ? []
    : (await supabase.from('member_tour_profile').select('*').returns<MemberTourProfile[]>()).data ?? [];

  // Sibling shows (same venue + tour) for the day switcher
  const { data: siblings } = await supabase
    .from('shows')
    .select('slug, night_number, date')
    .eq('venue_id', venueId)
    .eq('tour_id', tourId)
    .order('night_number')
    .returns<SiblingShow[]>();

  // Completed shows across the tour, most recent first — backs the surprise-song
  // history table and the "expected setlist" reference for upcoming shows.
  type TourShowMeta = Pick<Show, 'id' | 'slug' | 'date' | 'status'> & { venues: { city: string } };
  const tourShows = (await supabase
    .from('shows')
    .select('id, slug, date, status, venues(city)')
    .eq('tour_id', tourId)
    .returns<TourShowMeta[]>()
  ).data ?? [];

  const completedTourShows = tourShows
    .filter((s) => s.status === 'completed' || s.status === 'report_in')
    .sort((a, b) => b.date.localeCompare(a.date));

  const surpriseRows = (await supabase
    .from('setlist_entries')
    .select('song, position, show_id')
    .eq('is_surprise_slot', true)
    .in('show_id', completedTourShows.map((s) => s.id))
    .returns<Pick<SetlistEntry, 'song' | 'position' | 'show_id'>[]>()
  ).data ?? [];

  const historyRows: HistoryRow[] = completedTourShows
    .map((s) => ({
      slug: s.slug,
      date: s.date,
      city: s.venues.city,
      songs: surpriseRows
        .filter((r) => r.show_id === s.id)
        .sort((a, b) => a.position - b.position)
        .map((r) => r.song),
    }))
    .filter((row) => row.songs.length > 0);

  // Most recent completed show that has full setlist entries logged —
  // used as the "expected setlist" reference for upcoming shows.
  const allEntries = setlistRes.data ?? [];
  let expected: ExpectedSetlist | null = null;
  for (const s of completedTourShows) {
    const entries = allEntries
      .filter((e) => e.show_id === s.id)
      .sort((a, b) => a.position - b.position);
    if (entries.length > 0) {
      expected = { entries };
      break;
    }
  }

  // Logistics facts only for "know before you go"
  const logisticsFacts = facts.filter((f) => f.kind === 'logistics');

  const dateFormatted = new Date(show.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const monthDayShort = new Date(show.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });

  const hasSiblings = (siblings ?? []).length > 1;

  // Explicit date check (independent of status) for whether to mask surprise-song
  // names in the expected setlist — we genuinely don't know them for a show that
  // hasn't happened yet.
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isFutureShow = show.date >= todayStr;

  const { data: reportCount } = isCompleted
    ? await supabase.rpc('report_count', { show: showId })
    : { data: null };

  return (
    <div style={{ paddingTop: 20, paddingBottom: 80 }}>

      {/* Back link */}
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>
        <Link href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>
          ← All Shows
        </Link>
      </p>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            margin: '0 0 2px',
            lineHeight: 1.15,
          }}
        >
          {monthDayShort} · {show.venues.city}
        </h1>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 }}>
          {dateFormatted}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>
          {show.venues.name}, {show.venues.region}
        </div>

        {/* Status + countdown */}
        {isUpcoming && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusChip status={show.status} />
            <span style={{ fontSize: 13, color: 'var(--text-dim)', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600 }}>
              <Countdown targetDate={show.date} localTime={show.local_start} />
            </span>
          </div>
        )}
      </div>

      {/* Day switcher */}
      {hasSiblings && <DaySwitcher tabs={siblings ?? []} currentSlug={slug} />}

      <div style={{ height: 28 }} />

      {/* Setlist */}
      <section id="setlist" style={{ marginBottom: 48 }}>
        <SectionHeader>Setlist</SectionHeader>
        <SetlistSection
          isUpcoming={isUpcoming}
          isFutureShow={isFutureShow}
          setlist={setlist}
          historyRows={historyRows}
          expected={expected}
        />
      </section>

      {/* Seat Map — only once this venue has logged heatmap data — or Member
          Profiles otherwise (upcoming shows, or past shows not logged yet) */}
      <section id="seat-map" style={{ marginBottom: 48 }}>
        <SectionHeader>{showHeatmap ? 'Seat Map' : 'Member Profiles'}</SectionHeader>
        {showHeatmap ? (
          <SeatMap
            sections={sections}
            viewBox={show.venues.chart_svg_viewbox ?? '0 0 1000 1000'}
            stageCenter={show.venues.stage_center}
            stageTemplate={show.tours.stage_template}
            facts={facts}
            members={members}
            memberHeat={memberHeat}
            northAngleDeg={show.venues.north_angle_deg}
          />
        ) : (
          <TourProfileCard profiles={memberProfiles} members={members} />
        )}
      </section>

      {/* Know before you go */}
      <section id="know-before" style={{ marginBottom: 48 }}>
        <SectionHeader>Know Before You Go</SectionHeader>
        {logisticsFacts.length === 0 ? (
          <EmptyState>Logistics tips will appear here once available.</EmptyState>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {logisticsFacts.map((f) => (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--text)' }}>
                    {f.claim}
                  </p>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    alignSelf: 'flex-start',
                    fontSize: 11,
                    color: 'var(--text-dim)',
                    padding: '2px 7px',
                    borderRadius: 999,
                    border: '1px solid var(--line)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.report_count} source{f.report_count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Report counter */}
      {isCompleted && !!reportCount && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-dim)', margin: '0 0 12px' }}>
          {reportCount} fan reports in
        </p>
      )}

      {/* Footer CTA */}
      <div
        style={{
          marginTop: 40,
          padding: '20px',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          textAlign: 'center',
        }}
      >
        {isUpcoming ? (
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6 }}>
            Going? Come back after the show — 60 seconds of your night helps every fan after you.
          </p>
        ) : (
          <>
            <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-dim)' }}>
              Were you there? Help others with your section report.
            </p>
            <Link
              href={`/report/${show.slug}`}
              style={{
                display: 'inline-block',
                padding: '11px 28px',
                borderRadius: 999,
                background: 'var(--accent)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                letterSpacing: '-0.01em',
              }}
            >
              Submit Section Report
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-space-grotesk), sans-serif',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-dim)',
        margin: '0 0 16px',
      }}
    >
      {children}
    </h2>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13, color: 'var(--text-dim)', fontStyle: 'italic', margin: 0 }}>
      {children}
    </p>
  );
}
