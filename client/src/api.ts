import type {
  AuthResponse,
  SearchResultRoute,
  RouteDetailData,
  FavoriteRouteData,
  Review,
  SearchHistoryItem,
  User,
  BusRoute,
  RouteStation,
  RideHistoryItem,
} from './types';

const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE}${url}`, { ...options, headers });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth
export async function login(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function register(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

// Search
export async function searchRoutes(q: string): Promise<SearchResultRoute[]> {
  return request<SearchResultRoute[]>(`/routes/search?q=${encodeURIComponent(q)}`);
}

// Routes
export async function getAllRoutes(): Promise<BusRoute[]> {
  return request<BusRoute[]>('/routes');
}

export async function getRouteDetail(id: number): Promise<RouteDetailData> {
  return request<RouteDetailData>(`/routes/${id}`);
}

// Favorites
export async function getFavorites(): Promise<FavoriteRouteData[]> {
  return request<FavoriteRouteData[]>('/favorites');
}

export async function addFavorite(routeId: number): Promise<void> {
  await request(`/favorites/${routeId}`, { method: 'POST' });
}

export async function removeFavorite(routeId: number): Promise<void> {
  await request(`/favorites/${routeId}`, { method: 'DELETE' });
}

// Reviews
export async function getReviews(routeId: number): Promise<Review[]> {
  return request<Review[]>(`/reviews/${routeId}`);
}

export async function submitReview(
  routeId: number,
  data: { wait_time_rating: number; crowdedness_rating: number; comment: string }
): Promise<Review> {
  return request<Review>(`/reviews/${routeId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteReview(id: number): Promise<void> {
  await request(`/reviews/${id}`, { method: 'DELETE' });
}

// User
export async function getUserProfile(): Promise<User> {
  return request<User>('/user/profile');
}

export async function getSearchHistory(): Promise<SearchHistoryItem[]> {
  return request<SearchHistoryItem[]>('/user/history');
}

export async function deleteHistoryItem(id: number): Promise<void> {
  await request(`/user/history/${id}`, { method: 'DELETE' });
}

export async function clearHistory(): Promise<void> {
  await request('/user/history', { method: 'DELETE' });
}

// Admin
export async function adminGetRoutes(): Promise<BusRoute[]> {
  return request<BusRoute[]>('/admin/routes');
}

export async function adminCreateRoute(data: Partial<BusRoute>): Promise<BusRoute> {
  return request<BusRoute>('/admin/routes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminUpdateRoute(id: number, data: Partial<BusRoute>): Promise<BusRoute> {
  return request<BusRoute>(`/admin/routes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function adminDeleteRoute(id: number): Promise<void> {
  await request(`/admin/routes/${id}`, { method: 'DELETE' });
}

export async function adminGetStations(routeId: number): Promise<RouteStation[]> {
  return request<RouteStation[]>(`/admin/routes/${routeId}/stations`);
}

export async function adminAddStation(
  routeId: number,
  data: { name: string; latitude?: number; longitude?: number; distance_km?: number }
): Promise<RouteStation> {
  return request<RouteStation>(`/admin/routes/${routeId}/stations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminDeleteStation(stationId: number): Promise<void> {
  await request(`/admin/stations/${stationId}`, { method: 'DELETE' });
}

// Ride history
export async function checkin(routeId: number, stationId: number): Promise<RideHistoryItem> {
  return request<RideHistoryItem>('/ride/checkin', {
    method: 'POST',
    body: JSON.stringify({ route_id: routeId, station_id: stationId }),
  });
}

export async function getRideHistory(): Promise<RideHistoryItem[]> {
  return request<RideHistoryItem[]>('/ride/history');
}

export async function deleteRideHistoryItem(id: number): Promise<void> {
  await request(`/ride/history/${id}`, { method: 'DELETE' });
}

export async function clearRideHistory(): Promise<void> {
  await request('/ride/history', { method: 'DELETE' });
}
