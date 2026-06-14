import { useState, useEffect, FormEvent } from 'react';
import {
  adminGetRoutes,
  adminCreateRoute,
  adminUpdateRoute,
  adminDeleteRoute,
  adminGetStations,
  adminAddStation,
  adminDeleteStation,
} from '../api';
import type { BusRoute, RouteStation } from '../types';

interface RouteForm {
  name: string;
  route_number: string;
  start_station: string;
  end_station: string;
  first_bus_time: string;
  last_bus_time: string;
  price: string;
  description: string;
}

const emptyForm: RouteForm = {
  name: '',
  route_number: '',
  start_station: '',
  end_station: '',
  first_bus_time: '06:00',
  last_bus_time: '22:00',
  price: '2',
  description: '',
};

export default function Admin() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<RouteForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [stations, setStations] = useState<RouteStation[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [newStationDist, setNewStationDist] = useState('');

  useEffect(() => {
    loadRoutes();
  }, []);

  async function loadRoutes() {
    setLoading(true);
    try {
      const data = await adminGetRoutes();
      setRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function loadStations(routeId: number) {
    setLoadingStations(true);
    try {
      const data = await adminGetStations(routeId);
      setStations(data);
    } catch {
      setStations([]);
    } finally {
      setLoadingStations(false);
    }
  }

  function handleSelectRoute(routeId: number) {
    if (selectedRoute === routeId) {
      setSelectedRoute(null);
      setStations([]);
    } else {
      setSelectedRoute(routeId);
      loadStations(routeId);
    }
  }

  function startEdit(route: BusRoute) {
    setEditingId(route.id);
    setForm({
      name: route.name,
      route_number: route.route_number,
      start_station: route.start_station,
      end_station: route.end_station,
      first_bus_time: route.first_bus_time,
      last_bus_time: route.last_bus_time,
      price: String(route.price),
      description: route.description,
    });
    setShowForm(true);
    setError('');
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError('');
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleSubmitRoute(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.route_number || !form.start_station || !form.end_station) {
      setError('请填写完整的线路信息');
      return;
    }
    const payload = {
      name: form.name,
      route_number: form.route_number,
      start_station: form.start_station,
      end_station: form.end_station,
      first_bus_time: form.first_bus_time,
      last_bus_time: form.last_bus_time,
      price: parseFloat(form.price) || 2,
      description: form.description,
    };
    try {
      if (editingId) {
        await adminUpdateRoute(editingId, payload);
      } else {
        await adminCreateRoute(payload);
      }
      await loadRoutes();
      cancelForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  }

  async function handleDeleteRoute(routeId: number) {
    if (!confirm('确定要删除这条线路吗？关联的站点也会被删除。')) return;
    try {
      await adminDeleteRoute(routeId);
      setRoutes(prev => prev.filter(r => r.id !== routeId));
      if (selectedRoute === routeId) {
        setSelectedRoute(null);
        setStations([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  }

  async function handleAddStation(e: FormEvent) {
    e.preventDefault();
    if (!selectedRoute || !newStationName.trim()) return;
    try {
      const s = await adminAddStation(selectedRoute, {
        name: newStationName.trim(),
        distance_km: parseFloat(newStationDist) || 0,
      });
      setStations(prev => [...prev, s]);
      setNewStationName('');
      setNewStationDist('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加站点失败');
    }
  }

  async function handleDeleteStation(stationId: number) {
    if (!confirm('确定要删除该站点吗？')) return;
    try {
      await adminDeleteStation(stationId);
      setStations(prev => prev.filter(s => s.id !== stationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除站点失败');
    }
  }

  if (loading) return <div className="loading"><div className="spinner" />加载中...</div>;

  return (
    <div>
      <h1 className="page-title">管理员后台</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="section-header">
          <h2 className="section-title">线路管理</h2>
          <button className="btn btn-primary btn-sm" onClick={startCreate}>
            + 添加线路
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmitRoute} style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 8, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
              {editingId ? '编辑线路' : '新增线路'}
            </h3>
            <div className="admin-form-row">
              <div className="form-group">
                <label className="form-label">线路名称</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="如：火车站 — 科技园" />
              </div>
              <div className="form-group">
                <label className="form-label">线路编号</label>
                <input className="form-input" value={form.route_number} onChange={e => setForm(f => ({ ...f, route_number: e.target.value }))} placeholder="如：1" />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="form-group">
                <label className="form-label">始发站</label>
                <input className="form-input" value={form.start_station} onChange={e => setForm(f => ({ ...f, start_station: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">终点站</label>
                <input className="form-input" value={form.end_station} onChange={e => setForm(f => ({ ...f, end_station: e.target.value }))} />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="form-group">
                <label className="form-label">首班时间</label>
                <input className="form-input" value={form.first_bus_time} onChange={e => setForm(f => ({ ...f, first_bus_time: e.target.value }))} placeholder="06:00" />
              </div>
              <div className="form-group">
                <label className="form-label">末班时间</label>
                <input className="form-input" value={form.last_bus_time} onChange={e => setForm(f => ({ ...f, last_bus_time: e.target.value }))} placeholder="22:00" />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="form-group">
                <label className="form-label">票价（元）</label>
                <input className="form-input" type="number" step="0.5" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">描述</label>
                <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="线路描述（可选）" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm">{editingId ? '保存修改' : '创建线路'}</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={cancelForm}>取消</button>
            </div>
          </form>
        )}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>编号</th>
                <th>名称</th>
                <th>始发 - 终点</th>
                <th>运营时间</th>
                <th>票价</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {routes.map(route => (
                <tr key={route.id} style={{ background: selectedRoute === route.id ? 'var(--primary-light)' : undefined }}>
                  <td><span className="route-number-badge" style={{ fontSize: 12 }}>{route.route_number}</span></td>
                  <td style={{ fontWeight: 500 }}>{route.name}</td>
                  <td>{route.start_station} → {route.end_station}</td>
                  <td>{route.first_bus_time} - {route.last_bus_time}</td>
                  <td>¥{route.price}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => startEdit(route)}>编辑</button>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleSelectRoute(route.id)}>
                        {selectedRoute === route.id ? '收起站点' : '管理站点'}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteRoute(route.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRoute && (
        <div className="card">
          <div className="card-title">
            站点管理 — {routes.find(r => r.id === selectedRoute)?.name || ''}
          </div>

          {loadingStations ? (
            <div className="loading"><div className="spinner" />加载站点...</div>
          ) : (
            <>
              <form onSubmit={handleAddStation} className="inline-form" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">新站点名称</label>
                  <input className="form-input" value={newStationName} onChange={e => setNewStationName(e.target.value)} placeholder="输入站点名称" />
                </div>
                <div className="form-group" style={{ maxWidth: 150 }}>
                  <label className="form-label">距上一站(km)</label>
                  <input className="form-input" type="number" step="0.1" value={newStationDist} onChange={e => setNewStationDist(e.target.value)} placeholder="0" />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ marginBottom: 0, alignSelf: 'flex-end' }}>
                  添加站点
                </button>
              </form>

              {stations.length === 0 ? (
                <div className="empty-state" style={{ padding: 20 }}>
                  <div className="empty-state-text">该线路暂无站点，点击上方按钮添加</div>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>序号</th>
                        <th>站名</th>
                        <th>距上一站</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stations.map((s, i) => (
                        <tr key={s.id}>
                          <td>{i + 1}</td>
                          <td>
                            {s.station_name}
                            {i === 0 && <span className="badge badge-primary" style={{ marginLeft: 6 }}>始发</span>}
                            {i === stations.length - 1 && i > 0 && <span className="badge badge-danger" style={{ marginLeft: 6 }}>终点</span>}
                          </td>
                          <td>{i === 0 ? '—' : `${s.distance_km} km`}</td>
                          <td>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDeleteStation(s.id)}>
                              删除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
