export interface User {
  name: string;
  picture?: string;
}

export interface AnimeListStatus {
  status: string;
  score: number;
  num_episodes_watched: number;
  is_rewatching: boolean;
  updated_at: string;
}

export interface Anime {
  id: number;
  title: string;
  main_picture?: {
    medium?: string;
    large?: string;
  };
  alternative_titles?: {
    en?: string;
    ja?: string;
  };
  synopsis?: string;
  mean?: number;
  rank?: number;
  popularity?: number;
  num_episodes?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  media_type?: string;
  genres?: Array<{
    id: number;
    name: string;
  }>;
  studios?: Array<{
    id: number;
    name: string;
  }>;
  list_status?: AnimeListStatus;
  related_anime?: Array<{
    node: Anime;
    relation_type: string;
  }>;
  average_episode_duration?: number;
  source?: string;
  rating?: string;
  background?: string;
  num_list_users?: number;
}

export interface AnimeListResponse {
  data: Array<{
    node: Anime;
    list_status?: {
      status: string;
      score: number;
      num_episodes_watched: number;
      is_rewatching: boolean;
      updated_at: string;
    };
  }>;
  paging: {
    next?: string;
    previous?: string;
  };
}

export interface AuthResponse {
  loggedInUser: string | null;
  userPicture: string | null;
  token: string | null;
}
