import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, Review } from '../types';

const router = Router();

// GET /api/reviews/:routeId
router.get('/:routeId', (req: AuthRequest, res: Response): void => {
  try {
    const routeId = parseInt(req.params.routeId);
    if (isNaN(routeId)) {
      res.status(400).json({ error: '无效的线路ID' });
      return;
    }

    const reviews = db.prepare(`
      SELECT rv.*, u.username FROM reviews rv
      JOIN users u ON rv.user_id = u.id
      WHERE rv.route_id = ?
      ORDER BY rv.created_at DESC
    `).all(routeId) as Review[];

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: '获取评价失败' });
  }
});

// POST /api/reviews/:routeId
router.post('/:routeId', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const routeId = parseInt(req.params.routeId);
    if (isNaN(routeId)) {
      res.status(400).json({ error: '无效的线路ID' });
      return;
    }

    const { wait_time_rating, crowdedness_rating, comment } = req.body;
    if (!wait_time_rating || !crowdedness_rating) {
      res.status(400).json({ error: '请填写等车时间和拥挤程度评分' });
      return;
    }
    if (wait_time_rating < 1 || wait_time_rating > 5 || crowdedness_rating < 1 || crowdedness_rating > 5) {
      res.status(400).json({ error: '评分需在1-5之间' });
      return;
    }

    const route = db.prepare('SELECT id FROM bus_routes WHERE id = ?').get(routeId);
    if (!route) {
      res.status(404).json({ error: '线路不存在' });
      return;
    }

    db.prepare(`
      INSERT INTO reviews (route_id, user_id, wait_time_rating, crowdedness_rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(routeId, userId, wait_time_rating, crowdedness_rating, comment || '');

    const newReview = db.prepare(`
      SELECT rv.*, u.username FROM reviews rv
      JOIN users u ON rv.user_id = u.id
      WHERE rv.route_id = ? AND rv.user_id = ?
      ORDER BY rv.created_at DESC LIMIT 1
    `).get(routeId, userId) as Review;

    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ error: '提交评价失败' });
  }
});

// DELETE /api/reviews/:id
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const reviewId = parseInt(req.params.id);
    if (isNaN(reviewId)) {
      res.status(400).json({ error: '无效的评价ID' });
      return;
    }

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId) as Review | undefined;
    if (!review) {
      res.status(404).json({ error: '评价不存在' });
      return;
    }
    if (review.user_id !== userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: '无权删除该评价' });
      return;
    }

    db.prepare('DELETE FROM reviews WHERE id = ?').run(reviewId);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '删除评价失败' });
  }
});

export default router;
