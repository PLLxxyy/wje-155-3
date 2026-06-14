import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, RideHistory, BusRoute, RouteStationWithStation } from '../types';

const router = Router();

// POST /api/ride/checkin
router.post('/checkin', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const { route_id, station_id } = req.body;

    if (!route_id || !station_id) {
      res.status(400).json({ error: '线路ID和站点ID不能为空' });
      return;
    }

    const routeId = parseInt(route_id);
    const stationId = parseInt(station_id);

    if (isNaN(routeId) || isNaN(stationId)) {
      res.status(400).json({ error: '无效的线路ID或站点ID' });
      return;
    }

    const route = db.prepare('SELECT * FROM bus_routes WHERE id = ?').get(routeId) as BusRoute | undefined;
    if (!route) {
      res.status(404).json({ error: '线路不存在' });
      return;
    }

    const station = db.prepare(`
      SELECT rs.*, s.name AS station_name
      FROM route_stations rs
      JOIN stations s ON rs.station_id = s.id
      WHERE rs.route_id = ? AND rs.station_id = ?
    `).get(routeId, stationId) as (RouteStationWithStation & { station_name: string }) | undefined;

    if (!station) {
      res.status(404).json({ error: '该线路上不存在此站点' });
      return;
    }

    const existingRecord = db.prepare(`
      SELECT * FROM ride_history
      WHERE user_id = ? AND route_id = ? AND station_id = ?
        AND date(created_at, 'localtime') = date('now', 'localtime')
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId, routeId, stationId) as RideHistory | undefined;

    if (existingRecord) {
      res.json({ ...existingRecord, is_duplicate: true });
      return;
    }

    const result = db.prepare(`
      INSERT INTO ride_history (user_id, route_id, station_id, station_name, route_name, route_number)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, routeId, stationId, station.station_name, route.name, route.route_number);

    const rideRecord = db.prepare('SELECT * FROM ride_history WHERE id = ?').get(result.lastInsertRowid) as RideHistory;

    res.status(201).json({ ...rideRecord, is_duplicate: false });
  } catch (err) {
    res.status(500).json({ error: '签到失败' });
  }
});

// GET /api/ride/history
router.get('/history', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = db.prepare(`
      SELECT * FROM ride_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit) as RideHistory[];

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: '获取乘车历史失败' });
  }
});

// DELETE /api/ride/history/:id
router.delete('/history/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const historyId = parseInt(req.params.id);

    if (isNaN(historyId)) {
      res.status(400).json({ error: '无效的记录ID' });
      return;
    }

    const result = db.prepare('DELETE FROM ride_history WHERE id = ? AND user_id = ?').run(historyId, userId);
    if (result.changes === 0) {
      res.status(404).json({ error: '记录不存在' });
      return;
    }

    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '删除记录失败' });
  }
});

// DELETE /api/ride/history
router.delete('/history', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    db.prepare('DELETE FROM ride_history WHERE user_id = ?').run(userId);
    res.json({ message: '已清空乘车历史' });
  } catch (err) {
    res.status(500).json({ error: '清空乘车历史失败' });
  }
});

export default router;
