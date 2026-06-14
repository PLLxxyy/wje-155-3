import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import {
  AuthRequest,
  BusRoute,
  RouteStationWithStation,
  BusPosition,
  SearchResultRoute,
} from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'city-bus-jwt-secret-2024';

const router = Router();

function simulateBusPositions(stationCount: number): BusPosition[] {
  const positions: BusPosition[] = [];
  const busCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < busCount; i++) {
    const currentStationIndex = Math.floor(Math.random() * stationCount);
    positions.push({
      id: `bus-${Date.now()}-${i}`,
      current_station_index: currentStationIndex,
      total_stations: stationCount,
      direction: Math.random() > 0.5 ? 'forward' : 'backward',
      next_arrival_minutes: Math.floor(Math.random() * 15) + 1,
    });
  }
  return positions;
}

function getRouteStations(routeId: number): RouteStationWithStation[] {
  return db.prepare(`
    SELECT rs.*, s.name AS station_name, s.latitude, s.longitude
    FROM route_stations rs
    JOIN stations s ON rs.station_id = s.id
    WHERE rs.route_id = ?
    ORDER BY rs.stop_order ASC
  `).all(routeId) as RouteStationWithStation[];
}

// GET /api/routes/search?q=...
router.get('/search', (req: AuthRequest, res: Response): void => {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query) {
      res.json([]);
      return;
    }

    // Record search history if logged in
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        db.prepare('INSERT INTO search_history (user_id, query) VALUES (?, ?)').run(decoded.id, query);
      } catch {
        // ignore
      }
    }

    const routes = db.prepare(`
      SELECT DISTINCT r.* FROM bus_routes r
      LEFT JOIN route_stations rs ON r.id = rs.route_id
      LEFT JOIN stations s ON rs.station_id = s.id
      WHERE r.name LIKE ? OR r.route_number LIKE ? OR r.start_station LIKE ? OR r.end_station LIKE ? OR s.name LIKE ?
    `).all(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`) as BusRoute[];

    const userId = (req as AuthRequest).user?.id;

    const results: SearchResultRoute[] = routes.map(route => {
      const stations = getRouteStations(route.id);
      const isFavorited = userId
        ? !!(db.prepare('SELECT id FROM favorites WHERE user_id = ? AND route_id = ?').get(userId, route.id))
        : false;
      return {
        route,
        stations,
        is_favorited: isFavorited,
        bus_positions: simulateBusPositions(stations.length),
      };
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: '搜索失败' });
  }
});

// GET /api/routes
router.get('/', (_req: AuthRequest, res: Response): void => {
  try {
    const routes = db.prepare('SELECT * FROM bus_routes ORDER BY route_number ASC').all() as BusRoute[];
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: '获取线路失败' });
  }
});

// GET /api/routes/:id
router.get('/:id', (req: AuthRequest, res: Response): void => {
  try {
    const routeId = parseInt(req.params.id);
    if (isNaN(routeId)) {
      res.status(400).json({ error: '无效的线路ID' });
      return;
    }

    const route = db.prepare('SELECT * FROM bus_routes WHERE id = ?').get(routeId) as BusRoute | undefined;
    if (!route) {
      res.status(404).json({ error: '线路不存在' });
      return;
    }

    const stations = getRouteStations(routeId);
    const busPositions = simulateBusPositions(stations.length);
    const userId = (req as AuthRequest).user?.id;
    const isFavorited = userId
      ? !!(db.prepare('SELECT id FROM favorites WHERE user_id = ? AND route_id = ?').get(userId, routeId))
      : false;

    const reviews = db.prepare(`
      SELECT rv.*, u.username FROM reviews rv
      JOIN users u ON rv.user_id = u.id
      WHERE rv.route_id = ?
      ORDER BY rv.created_at DESC
    `).all(routeId);

    res.json({
      route,
      stations,
      bus_positions: busPositions,
      is_favorited: isFavorited,
      reviews,
    });
  } catch (err) {
    res.status(500).json({ error: '获取线路详情失败' });
  }
});

export default router;
export { getRouteStations };
