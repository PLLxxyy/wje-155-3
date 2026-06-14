import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, BusRoute, RouteStationWithStation } from '../types';

const router = Router();

// GET /api/favorites
router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const favorites = db.prepare(`
      SELECT r.*, f.created_at AS favorited_at
      FROM favorites f
      JOIN bus_routes r ON f.route_id = r.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(userId) as (BusRoute & { favorited_at: string })[];

    const results = favorites.map(route => {
      const stations = db.prepare(`
        SELECT rs.*, s.name AS station_name, s.latitude, s.longitude
        FROM route_stations rs
        JOIN stations s ON rs.station_id = s.id
        WHERE rs.route_id = ?
        ORDER BY rs.stop_order ASC
      `).all(route.id) as RouteStationWithStation[];
      return { route, stations };
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: '获取收藏列表失败' });
  }
});

// POST /api/favorites/:routeId
router.post('/:routeId', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const routeId = parseInt(req.params.routeId);
    if (isNaN(routeId)) {
      res.status(400).json({ error: '无效的线路ID' });
      return;
    }

    const route = db.prepare('SELECT id FROM bus_routes WHERE id = ?').get(routeId);
    if (!route) {
      res.status(404).json({ error: '线路不存在' });
      return;
    }

    const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND route_id = ?').get(userId, routeId);
    if (existing) {
      res.status(409).json({ error: '已收藏该线路' });
      return;
    }

    db.prepare('INSERT INTO favorites (user_id, route_id) VALUES (?, ?)').run(userId, routeId);
    res.status(201).json({ message: '收藏成功' });
  } catch (err) {
    res.status(500).json({ error: '收藏失败' });
  }
});

// DELETE /api/favorites/:routeId
router.delete('/:routeId', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const routeId = parseInt(req.params.routeId);
    if (isNaN(routeId)) {
      res.status(400).json({ error: '无效的线路ID' });
      return;
    }

    const result = db.prepare('DELETE FROM favorites WHERE user_id = ? AND route_id = ?').run(userId, routeId);
    if (result.changes === 0) {
      res.status(404).json({ error: '未收藏该线路' });
      return;
    }
    res.json({ message: '取消收藏成功' });
  } catch (err) {
    res.status(500).json({ error: '取消收藏失败' });
  }
});

export default router;
