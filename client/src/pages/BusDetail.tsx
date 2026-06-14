import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRouteDetail, addFavorite, removeFavorite, submitReview, deleteReview, checkin } from '../api';
import { useAuth } from '../App';
import type { RouteDetailData, BusPosition, Review } from '../types';

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="rating-stars">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`star ${i <= rating ? 'filled' : ''}`}>★</span>
      ))}
    </span>
  );
}

function RatingInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="rating-select">
        {[1, 2, 3, 4, 5].map(i => (
          <span
            key={i}
            className={`star ${i <= value ? 'active' : ''}`}
            onClick={() => onChange(i)}
            style={{ cursor: 'pointer' }}
          >
            ★
          </span>
        ))}
      </div>
    </div>
  );
}

function BusPositionOnTimeline({ positions, stationIndex, stationCount }: { positions: BusPosition[]; stationIndex: number; stationCount: number }) {
  const busesHere = positions.filter(p => p.current_station_index === stationIndex);
  if (busesHere.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
      {busesHere.map((bus, i) => {
        let cls = 'bus-dot far';
        if (bus.next_arrival_minutes <= 2) cls = 'bus-dot arriving';
        else if (bus.next_arrival_minutes <= 5) cls = 'bus-dot near';
        return (
          <span key={bus.id + i} className={cls} style={{ fontSize: 11 }}>
            🚌 {bus.next_arrival_minutes}分钟
          </span>
        );
      })}
    </div>
  );
}

export default function BusDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<RouteDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [waitRating, setWaitRating] = useState(0);
  const [crowdRating, setCrowdRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checkingInStation, setCheckingInStation] = useState<number | null>(null);
  const [checkinSuccess, setCheckinSuccess] = useState<string>('');

  const routeId = parseInt(id || '0');

  useEffect(() => {
    if (!routeId) return;
    setLoading(true);
    getRouteDetail(routeId)
      .then(d => {
        setData(d);
        setIsFav(d.is_favorited);
        setReviews(d.reviews);
      })
      .catch(() => setError('加载线路详情失败'))
      .finally(() => setLoading(false));
  }, [routeId]);

  async function handleToggleFav() {
    if (!user) { navigate('/login'); return; }
    try {
      if (isFav) {
        await removeFavorite(routeId);
      } else {
        await addFavorite(routeId);
      }
      setIsFav(!isFav);
    } catch {
      // ignore
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (!waitRating || !crowdRating) {
      setError('请填写评分');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const newReview = await submitReview(routeId, {
        wait_time_rating: waitRating,
        crowdedness_rating: crowdRating,
        comment,
      });
      setReviews(prev => [newReview, ...prev]);
      setWaitRating(0);
      setCrowdRating(0);
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交评价失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteReview(reviewId: number) {
    try {
      await deleteReview(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch {
      // ignore
    }
  }

  async function handleCheckin(stationId: number, stationName: string) {
    if (!user) { navigate('/login'); return; }
    setCheckingInStation(stationId);
    setCheckinSuccess('');
    setError('');
    try {
      await checkin(routeId, stationId);
      setCheckinSuccess(`已在 ${stationName} 签到成功！`);
      setTimeout(() => setCheckinSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '签到失败');
    } finally {
      setCheckingInStation(null);
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner" />加载中...</div>;
  }

  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-state-text">线路不存在或加载失败</div>
        <button className="btn btn-secondary" onClick={() => navigate('/search')} style={{ marginTop: 12 }}>返回搜索</button>
      </div>
    );
  }

  const { route, stations, bus_positions } = data;
  const stationNames = stations.map(s => s.station_name);

  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        ← 返回
      </button>

      <div className="card detail-header">
        <div className="detail-route-name">
          <span className="route-number-badge">{route.route_number}</span>
          {route.name}
          <button
            className={`fav-btn ${isFav ? 'active' : ''}`}
            onClick={handleToggleFav}
            title={isFav ? '取消收藏' : '收藏'}
          >
            {isFav ? '★' : '☆'}
          </button>
        </div>
        {route.description && <div className="detail-route-desc">{route.description}</div>}
        <div className="detail-meta-row">
          <div className="detail-meta-item">首班：{route.first_bus_time}</div>
          <div className="detail-meta-item">末班：{route.last_bus_time}</div>
          <div className="detail-meta-item">票价：¥{route.price}</div>
          <div className="detail-meta-item">共 {stations.length} 站</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">实时车辆位置</div>
          {bus_positions.map((pos, i) => {
            const stName = stationNames[pos.current_station_index] || '未知';
            let cls = 'bus-dot far';
            if (pos.next_arrival_minutes <= 2) cls = 'bus-dot arriving';
            else if (pos.next_arrival_minutes <= 5) cls = 'bus-dot near';
            return (
              <div key={pos.id + i} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span className={cls}>
                  {pos.direction === 'forward' ? '→' : '←'} {stName}
                </span>
                <span style={{ color: 'var(--gray-500)' }}>约 {pos.next_arrival_minutes} 分钟到达下一站</span>
              </div>
            );
          })}
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">线路信息</div>
          <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 2 }}>
            <div>起始站：<strong>{route.start_station}</strong></div>
            <div>终点站：<strong>{route.end_station}</strong></div>
            <div>运营时间：{route.first_bus_time} - {route.last_bus_time}</div>
            <div>全程票价：¥{route.price}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          站点列表
          {user && <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>点击站点可签到</span>}
        </div>
        {checkinSuccess && <div className="alert alert-success" style={{ marginBottom: 12 }}>{checkinSuccess}</div>}
        <div className="stations-timeline">
          {stations.map((station, i) => {
            const isStart = i === 0;
            const isEnd = i === stations.length - 1;
            const hasBus = bus_positions.some(p => p.current_station_index === i);
            const isCheckingIn = checkingInStation === station.station_id;
            return (
              <div
                key={station.id}
                className="station-item"
                style={{ cursor: user ? 'pointer' : 'default' }}
                onClick={() => user && handleCheckin(station.station_id, station.station_name)}
              >
                <div className="station-dot-wrapper">
                  <div className={`station-dot ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''} ${hasBus ? 'has-bus' : ''}`} />
                  {i < stations.length - 1 && <div className="station-line" />}
                </div>
                <div className="station-info" style={{ flex: 1 }}>
                  <div className={`station-name ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''}`}>
                    {station.station_name}
                    {isStart && <span className="badge badge-primary" style={{ marginLeft: 8 }}>始发</span>}
                    {isEnd && <span className="badge badge-danger" style={{ marginLeft: 8 }}>终点</span>}
                  </div>
                  {station.distance_km > 0 && (
                    <div className="station-detail">距上一站 {station.distance_km} km</div>
                  )}
                  <BusPositionOnTimeline positions={bus_positions} stationIndex={i} stationCount={stations.length} />
                </div>
                {user && (
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={isCheckingIn}
                    onClick={(e) => { e.stopPropagation(); handleCheckin(station.station_id, station.station_name); }}
                    style={{ marginLeft: 12 }}
                  >
                    {isCheckingIn ? '签到中...' : '签到'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-title">乘客评价</div>
        {user && (
          <form onSubmit={handleSubmitReview} style={{ marginBottom: 20, padding: 16, background: 'var(--gray-50)', borderRadius: 8 }}>
            {error && <div className="alert alert-error">{error}</div>}
            <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
              <RatingInput value={waitRating} onChange={setWaitRating} label="等车时间 (1=很长, 5=很短)" />
              <RatingInput value={crowdRating} onChange={setCrowdRating} label="车厢拥挤 (1=很挤, 5=宽松)" />
            </div>
            <div className="form-group">
              <label className="form-label">留言（可选）</label>
              <textarea
                className="form-textarea"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="分享你的乘车体验..."
                rows={3}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '提交中...' : '提交评价'}
            </button>
          </form>
        )}
        {!user && (
          <div style={{ textAlign: 'center', padding: 16, color: 'var(--gray-500)', marginBottom: 16 }}>
            <button className="btn btn-secondary" onClick={() => navigate('/login')}>登录后发表评价</button>
          </div>
        )}
        {reviews.length === 0 ? (
          <div className="empty-state" style={{ padding: 20 }}>
            <div className="empty-state-text">暂无评价，快来写第一条吧</div>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <span className="review-user">{review.username}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="review-time">{review.created_at}</span>
                  {user && (user.id === review.user_id || user.role === 'admin') && (
                    <button className="btn btn-sm btn-secondary" onClick={() => handleDeleteReview(review.id)} style={{ padding: '2px 8px', fontSize: 11 }}>
                      删除
                    </button>
                  )}
                </div>
              </div>
              <div className="review-ratings">
                <span>等车时间：<StarRating rating={review.wait_time_rating} /></span>
                <span>拥挤程度：<StarRating rating={review.crowdedness_rating} /></span>
              </div>
              {review.comment && <div className="review-comment">{review.comment}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
