import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFavorites, removeFavorite, getSearchHistory, deleteHistoryItem, clearHistory, getRideHistory, deleteRideHistoryItem, clearRideHistory } from '../api';
import { useAuth } from '../App';
import type { FavoriteRouteData, SearchHistoryItem, RideHistoryItem } from '../types';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'favorites' | 'history' | 'ride'>('favorites');
  const [favorites, setFavorites] = useState<FavoriteRouteData[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [rideHistory, setRideHistory] = useState<RideHistoryItem[]>([]);
  const [loadingFav, setLoadingFav] = useState(true);
  const [loadingHis, setLoadingHis] = useState(true);
  const [loadingRide, setLoadingRide] = useState(true);

  useEffect(() => {
    getFavorites()
      .then(setFavorites)
      .catch(() => {})
      .finally(() => setLoadingFav(false));
    getSearchHistory()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoadingHis(false));
    getRideHistory()
      .then(setRideHistory)
      .catch(() => {})
      .finally(() => setLoadingRide(false));
  }, []);

  async function handleRemoveFav(routeId: number) {
    try {
      await removeFavorite(routeId);
      setFavorites(prev => prev.filter(f => f.route.id !== routeId));
    } catch {
      // ignore
    }
  }

  async function handleDeleteHistory(id: number) {
    try {
      await deleteHistoryItem(id);
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch {
      // ignore
    }
  }

  async function handleClearHistory() {
    try {
      await clearHistory();
      setHistory([]);
    } catch {
      // ignore
    }
  }

  async function handleDeleteRideHistory(id: number) {
    try {
      await deleteRideHistoryItem(id);
      setRideHistory(prev => prev.filter(h => h.id !== id));
    } catch {
      // ignore
    }
  }

  async function handleClearRideHistory() {
    try {
      await clearRideHistory();
      setRideHistory([]);
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 22, fontWeight: 700
        }}>
          {(user?.username || '?')[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{user?.username}</div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
            {user?.role === 'admin' ? '管理员' : '普通用户'} | 注册于 {user?.created_at || '未知'}
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'favorites' ? 'active' : ''}`} onClick={() => setTab('favorites')}>
          收藏线路 ({favorites.length})
        </button>
        <button className={`tab ${tab === 'ride' ? 'active' : ''}`} onClick={() => setTab('ride')}>
          乘车历史 ({rideHistory.length})
        </button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          搜索历史 ({history.length})
        </button>
      </div>

      {tab === 'favorites' && (
        loadingFav ? (
          <div className="loading"><div className="spinner" />加载中...</div>
        ) : favorites.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⭐</div>
            <div className="empty-state-text">还没有收藏任何线路</div>
            <button className="btn btn-primary" onClick={() => navigate('/search')} style={{ marginTop: 12 }}>
              去搜索线路
            </button>
          </div>
        ) : (
          favorites.map(fav => (
            <div key={fav.route.id} className="route-card" onClick={() => navigate(`/bus/${fav.route.id}`)}>
              <div className="route-header">
                <div style={{ flex: 1 }}>
                  <div className="route-name">
                    <span className="route-number-badge">{fav.route.route_number}</span>
                    {' '}{fav.route.name}
                  </div>
                  <div className="route-meta" style={{ marginTop: 6 }}>
                    <span>首班 {fav.route.first_bus_time}</span>
                    <span>末班 {fav.route.last_bus_time}</span>
                    <span>票价 ¥{fav.route.price}</span>
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={(e) => { e.stopPropagation(); handleRemoveFav(fav.route.id); }}
                >
                  取消收藏
                </button>
              </div>
              <div className="route-stations-preview">
                {fav.stations.map(s => s.station_name).join(' → ')}
              </div>
            </div>
          ))
        )
      )}

      {tab === 'history' && (
        loadingHis ? (
          <div className="loading"><div className="spinner" />加载中...</div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">暂无搜索记录</div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 12, textAlign: 'right' }}>
              <button className="btn btn-sm btn-secondary" onClick={handleClearHistory}>
                清空全部记录
              </button>
            </div>
            {history.map(h => (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: 'white', borderRadius: 6,
                marginBottom: 8, boxShadow: 'var(--shadow)', cursor: 'pointer'
              }}
                onClick={() => { navigate(`/search?q=${encodeURIComponent(h.query)}`); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--gray-400)', fontSize: 14 }}>🔍</span>
                  <span style={{ fontSize: 14, color: 'var(--gray-700)' }}>{h.query}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{h.created_at}</span>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => { e.stopPropagation(); handleDeleteHistory(h.id); }}
                    style={{ padding: '2px 8px', fontSize: 11 }}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </>
        )
      )}

      {tab === 'ride' && (
        loadingRide ? (
          <div className="loading"><div className="spinner" />加载中...</div>
        ) : rideHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚌</div>
            <div className="empty-state-text">暂无乘车记录</div>
            <button className="btn btn-primary" onClick={() => navigate('/search')} style={{ marginTop: 12 }}>
              去搜索线路
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 12, textAlign: 'right' }}>
              <button className="btn btn-sm btn-secondary" onClick={handleClearRideHistory}>
                清空全部记录
              </button>
            </div>
            {rideHistory.map(ride => (
              <div
                key={ride.id}
                className="route-card"
                onClick={() => navigate(`/bus/${ride.route_id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="route-header">
                  <div style={{ flex: 1 }}>
                    <div className="route-name">
                      <span className="route-number-badge">{ride.route_number}</span>
                      {' '}{ride.route_name}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, color: 'var(--gray-600)' }}>
                      📍 上车站点：<strong>{ride.station_name}</strong>
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={(e) => { e.stopPropagation(); handleDeleteRideHistory(ride.id); }}
                  >
                    删除
                  </button>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gray-400)' }}>
                  乘车时间：{ride.created_at}
                </div>
              </div>
            ))}
          </>
        )
      )}
    </div>
  );
}
