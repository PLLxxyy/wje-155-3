import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, SearchHistory, Favorite } from '../types';

const router = Router();

// GET /api/user/profile
router.get('/profile', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const user = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(userId);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: '获取个人信息失败' });
  }
});

// GET /api/user/history
router.get('/history', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const history = db.prepare(
      'SELECT * FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).all(userId) as SearchHistory[];
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: '获取搜索历史失败' });
  }
});

// DELETE /api/user/history/:id
router.delete('/history/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const historyId = parseInt(req.params.id);
    if (isNaN(historyId)) {
      res.status(400).json({ error: '无效的历史记录ID' });
      return;
    }

    const result = db.prepare('DELETE FROM search_history WHERE id = ? AND user_id = ?').run(historyId, userId);
    if (result.changes === 0) {
      res.status(404).json({ error: '记录不存在' });
      return;
    }
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '删除历史记录失败' });
  }
});

// DELETE /api/user/history
router.delete('/history', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    db.prepare('DELETE FROM search_history WHERE user_id = ?').run(userId);
    res.json({ message: '已清空搜索历史' });
  } catch (err) {
    res.status(500).json({ error: '清空历史记录失败' });
  }
});

export default router;
