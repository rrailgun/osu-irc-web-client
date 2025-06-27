export interface MatchDetailResponse {
  match: OsuMatch;
  events: MatchEvent[];
  users: MatchUser[];
  first_event_id: number;
  latest_event_id: number;
  current_game_id: number | null;
}

export interface OsuMatch {
  id: number;
  start_time: string;
  end_time: string | null;
  name: string;
}

export interface MatchEvent {
  id: number;
  detail: EventDetail;
  timestamp: string;
  user_id: number | null;
  game?: MatchGame;
}

export type EventDetail =
  | { type: 'match-created' }
  | { type: 'player-kicked' }
  | { type: 'other'; text: string };

export interface MatchGame {
  id: number;
  match_id: number;
  beatmap_id: number;
  mode: string;
  mode_int: number;
  start_time: string;
  end_time: string | null;
  scoring_type: string;
  team_type: string;
  mods: string[];
  beatmap: Beatmap;
  scores: GameScore[];
}

export interface Beatmap {
  beatmapset_id: number;
  difficulty_rating: number;
  id: number;
  mode: string;
  status: string;
  total_length: number;
  user_id: number;
  version: string;
  beatmapset: BeatmapSet;
}

export interface BeatmapSet {
  id: number;
  artist: string;
  artist_unicode: string;
  covers: BeatmapCovers;
  creator: string;
  favourite_count: number;
  genre_id: number;
  hype: any;
  language_id: number;
  nsfw: boolean;
  offset: number;
  play_count: number;
  preview_url: string;
  source: string;
  spotlight: boolean;
  status: string;
  title: string;
  title_unicode: string;
  track_id: number | null;
  user_id: number;
  video: boolean;
}

export interface BeatmapCovers {
  cover: string;
  'cover@2x': string;
  card: string;
  'card@2x': string;
  list: string;
  'list@2x': string;
  slimcover: string;
  'slimcover@2x': string;
}

export interface GameScore {
  accuracy: number;
  best_id: number | null;
  created_at: string;
  id: number | null;
  max_combo: number;
  mode: string;
  mode_int: number;
  mods: string[];
  passed: boolean;
  perfect: boolean;
  pp: number | null;
  rank: string;
  replay: boolean;
  score: number;
  statistics: ScoreStatistics;
  type: string;
  user_id: number;
  current_user_attributes: {
    pin: any;
  };
  match: {
    slot: number;
    team: string;
    pass: boolean;
  };
}

export interface ScoreStatistics {
  count_100: number;
  count_300: number;
  count_50: number;
  count_geki: number;
  count_katu: number;
  count_miss: number;
}

export interface MatchUser {
  avatar_url: string;
  country_code: string;
  default_group: string;
  id: number;
  is_active: boolean;
  is_bot: boolean;
  is_deleted: boolean;
  is_online: boolean;
  is_supporter: boolean;
  last_visit: string;
  pm_friends_only: boolean;
  profile_colour: string | null;
  username: string;
  country: {
    code: string;
    name: string;
  };
}
