export interface User {
  id: number;
  username: string;
  role: 'user' | 'admin';
  created_at?: string;
}

export interface BusRoute {
  id: number;
  name: string;
  route_number: string;
  start_station: string;
  end_station: string;
  first_bus_time: string;
  last_bus_time: string;
  price: number;
  description: string;
  created_at: string;
}

export interface Station {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

export interface RouteStation {
  id: number;
  route_id: number;
  station_id: number;
  stop_order: number;
  distance_km: number;
  station_name: string;
  latitude: number;
  longitude: number;
}

export interface BusPosition {
  id: string;
  current_station_index: number;
  total_stations: number;
  direction: 'forward' | 'backward';
  next_arrival_minutes: number;
}

export interface Review {
  id: number;
  route_id: number;
  user_id: number;
  username: string;
  wait_time_rating: number;
  crowdedness_rating: number;
  comment: string;
  created_at: string;
}

export interface SearchResultRoute {
  route: BusRoute;
  stations: RouteStation[];
  is_favorited: boolean;
  bus_positions: BusPosition[];
}

export interface RouteDetailData {
  route: BusRoute;
  stations: RouteStation[];
  bus_positions: BusPosition[];
  is_favorited: boolean;
  reviews: Review[];
}

export interface FavoriteRouteData {
  route: BusRoute;
  stations: RouteStation[];
}

export interface SearchHistoryItem {
  id: number;
  user_id: number;
  query: string;
  created_at: string;
}

export interface RideHistoryItem {
  id: number;
  user_id: number;
  route_id: number;
  station_id: number;
  station_name: string;
  route_name: string;
  route_number: string;
  ride_date: string;
  created_at: string;
  is_duplicate?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}
