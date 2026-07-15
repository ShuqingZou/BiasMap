import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSupabaseClient } from '@/lib/supabase';
import ReportForm from './ReportForm';

type Params = Promise<{ slug: string }>;

type ShowRow = {
  id: string;
  slug: string;
  date: string;
  venue_id: string;
  venues: { name: string; city: string; region: string };
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Section Report — BiasMap' };
}

export default async function ReportPage({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = getSupabaseClient();

  const { data: show } = await supabase
    .from('shows')
    .select('id, slug, date, venue_id, venues(name, city, region)')
    .eq('slug', slug)
    .single<ShowRow>();

  if (!show) return notFound();

  const { data: sections } = await supabase
    .from('sections')
    .select('code')
    .eq('venue_id', show.venue_id)
    .order('code')
    .returns<{ code: string }[]>();

  const sectionCodes = (sections ?? []).map((s) => s.code);

  const dateStr = new Date(show.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const showName = `${show.venues.name} · ${dateStr}`;

  return <ReportForm slug={slug} showId={show.id} showName={showName} sectionCodes={sectionCodes} />;
}
