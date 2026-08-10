export type Database = {
  public: {
    Tables: {
      artists: { Row: Artist; Insert: Omit<Artist, 'id'>; Update: Partial<Artist>; Relationships: [] };
      tours: { Row: Tour; Insert: Omit<Tour, 'id'>; Update: Partial<Tour>; Relationships: [] };
      venues: { Row: Venue; Insert: Omit<Venue, 'id'>; Update: Partial<Venue>; Relationships: [] };
      sections: { Row: Section; Insert: Omit<Section, 'id'>; Update: Partial<Section>; Relationships: [] };
      shows: { Row: Show; Insert: Omit<Show, 'id'>; Update: Partial<Show>; Relationships: [] };
      setlist_entries: { Row: SetlistEntry; Insert: Omit<SetlistEntry, 'id'>; Update: Partial<SetlistEntry>; Relationships: [] };
      facts: { Row: Fact; Insert: Omit<Fact, 'id'>; Update: Partial<Fact>; Relationships: [] };
      reports: { Row: Report; Insert: Omit<Report, 'id' | 'created_at'>; Update: Partial<Report>; Relationships: [] };
    };
    Views: {
      member_section_heat: { Row: MemberSectionHeat; Relationships: [] };
      member_tour_profile: { Row: MemberTourProfile; Relationships: [] };
    };
    Functions: {
      report_count: {
        Args: { show: string };
        Returns: number;
      };
    };
  };
};

export type Artist = {
  id: string;
  name: string;
  slug: string;
};

export type StageTemplate = {
  units: string;
  paths: string[];
};

export type Tour = {
  id: string;
  artist_id: string;
  name: string;
  slug: string;
  stage_type: string;
  members: string[];
  stage_template: StageTemplate | null;
};

export type Venue = {
  id: string;
  name: string;
  slug: string;
  city: string;
  region: string;
  country: string;
  timezone: string;
  chart_svg_viewbox: string | null;
  stage_center: { x: number; y: number } | null;
  north_angle_deg: number;
};

export type Section = {
  id: string;
  venue_id: string;
  code: string;
  tier: 'floor' | 'lower' | 'club' | 'upper';
  polygon: [number, number][];
  centroid: { x: number; y: number };
  facing_sector: string | null;
  distance_m: number | null;
};

export type ShowStatus = 'upcoming' | 'guide_ready' | 'completed' | 'report_in';

export type Show = {
  id: string;
  tour_id: string;
  venue_id: string;
  slug: string;
  date: string;
  local_start: string | null;
  night_number: number;
  status: ShowStatus;
};

export type SetlistEntry = {
  id: string;
  show_id: string;
  position: number;
  song: string;
  is_surprise_slot: boolean;
  stage_zone: string | null;
};

export type FactKind = 'hotspot' | 'obstruction' | 'logistics' | 'stage_layout';
export type Confidence = 'low' | 'medium' | 'high';

export type Fact = {
  id: string;
  tour_id: string;
  venue_id: string | null;
  show_id: string | null;
  kind: FactKind;
  sector: string | null;
  section_code: string | null;
  claim: string;
  source_urls: string[];
  report_count: number;
  confidence: Confidence;
};

export type MemberSectionHeat = {
  member: string;
  venue_id: string;
  venue_slug: string;
  section: string;
  tier: 'floor' | 'lower' | 'club' | 'upper';
  weighted_minutes: number;
  shows_analyzed: number;
  section_rank: number;
  heat_bucket: number;
};

export type TourProfileCategory = 'half' | 'arm' | 'edge';

export type MemberTourProfile = {
  member: string;
  shows_analyzed: number;
  category: TourProfileCategory;
  item: string;
  pct: number;
  item_rank: number;
};

export type Report = {
  id: string;
  show_id: string;
  section_code: string;
  nickname: string | null;
  members_close: string[];
  when_close: string | null;
  obstruction: string | null;
  view_rating: number | null;
  created_at: string;
};

export const SECTORS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export type Sector = typeof SECTORS[number];
