import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchRoutes, getFavorites, addFavorite, removeFavorite } from '../api';
import { useAuth } from '../App';
import type { SearchResultRoute, FavoriteRouteData, BusPosition } from '../types';

function BusPositionBadges({ positions, stationNames }: { positions: BusPosition[]; stationNames: string[] }) {
  return (
    <div className="bus-position-list">
      {positions.map((pos, i) => {
        const stationName = stationNames[pos.current_station_index] || '未知';
        let cls = 'bus-dot far';
        if (pos.next_arrival_minutes <= 2) cls = 'bus-dot arriving';
        else if (pos.next_arrival_minutes <= 5) cls = 'bus-dot near';
        return (
          <span key={pos.id + i} className={cls}>
            {pos.direction === 'forward' ? '>>>' : '<<<'} {stationName} 约{pos.next_arrival_minutes}分钟
          </span>
        );
      })}
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteRouteData[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user) {
      getFavorites().then(setFavorites).catch(() => {});
    } else {
      setFavorites([]);
    }
  }, [user]);

  // Auto-search if URL contains ?q=...
  useEffect(() => {
    const urlQ = searchParams.get('q');
    if (urlQ) {
      setQuery(urlQ);
      setLoading(true);
      setSearched(true);
      searchRoutes(urlQ)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }
  }, [searchParams]);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchRoutes(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(routeId: number, isFav: boolean, e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (isFav) {
        await removeFavorite(routeId);
        setFavorites(prev => prev.filter(f => f.route.id !== routeId));
      } else {
        await addFavorite(routeId);
        const route = results.find(r => r.route.id === routeId);
        if (route) {
          setFavorites(prev => [...prev, { route: route.route, stations: route.stations }]);
        }
      }
      setResults(prev =>
        prev.map(r => r.route.id === routeId ? { ...r, is_favorited: !isFav } : r)
      );
    } catch {
      // ignore
    }
  }

  function goToDetail(routeId: number) {
    navigate(`/bus/${routeId}`);
  }

  const stationNames = (stations: SearchResultRoute['stations']) => stations.map(s => s.station_name);

  return (
    <div>
      {user && favorites.length > 0 && (
        <div className="favorites-section">
          <div className="section-header">
            <h2 className="section-title">我的收藏</h2>
          </div>
          {favorites.map(fav => {
            const names = fav.stations.map(s => s.station_name);
            return (
              <div
                key={fav.route.id}
                className="route-card"
                style={{ borderLeftColor: '#ff6b35' }}
                onClick={() => goToDetail(fav.route.id)}
              >
                <div className="route-header">
                  <div>
                    <div className="route-name">
                      <span className="route-number-badge" style={{ background: '#ff6b35' }}>{fav.route.route_number}</span>
                      {' '}{fav.route.name}
                    </div>
                  </div>
                  <button
                    className="fav-btn active"
                    onClick={(e) => toggleFavorite(fav.route.id, true, e)}
                    title="取消收藏"
                  >
                    ★
                  </button>
                </div>
                <div className="route-stations-preview">
                  {names.join(' → ')}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={handleSearch} className="search-box">
        <input
          type="text"
          className="form-input"
          placeholder="输入线路号、线路名或站点名称..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '搜索中...' : '搜索'}
        </button>
      </form>

      {loading && (
        <div className="loading">
          <div className="spinner" />
          正在搜索...
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-text">没有找到匹配的线路，请尝试其他关键词</div>
        </div>
      )}

      {!loading && !searched && favorites.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🚌</div>
          <div className="empty-state-text">
            输入线路号或站点名称开始搜索公交线路
          </div>
        </div>
      )}

      {!loading && results.map(result => {
        const names = stationNames(result.stations);
        return (
          <div
            key={result.route.id}
            className="route-card"
            onClick={() => goToDetail(result.route.id)}
          >
            <div className="route-header">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="route-name">
                  <span className="route-number-badge">{result.route.route_number}</span>
                  {' '}{result.route.name}
                </div>
              </div>
              <button
                className={`fav-btn ${result.is_favorited ? 'active' : ''}`}
                onClick={(e) => toggleFavorite(result.route.id, result.is_favorited, e)}
                title={result.is_favorited ? '取消收藏' : '收藏'}
              >
                {result.is_favorited ? '★' : '☆'}
              </button>
            </div>
            <div className="route-meta">
              <span>首班 {result.route.first_bus_time}</span>
              <span>末班 {result.route.last_bus_time}</span>
              <span>票价 ¥{result.route.price}</span>
            </div>
            <div className="route-stations-preview">
              {names.join(' → ')}
            </div>
            <BusPositionBadges positions={result.bus_positions} stationNames={names} />
          </div>
        );
      })}
    </div>
  );
}
