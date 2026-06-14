import express from 'express';
import cors from 'cors';
import { initDatabase } from './db';
import authRoutes from './routes/auth';
import busRoutes from './routes/busRoutes';
import favoritesRoutes from './routes/favorites';
import reviewsRoutes from './routes/reviews';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import rideHistoryRoutes from './routes/rideHistory';

const app = express();
const PORT = Number(process.env.PORT) || 3201;

// Initialize database
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/routes', busRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ride', rideHistoryRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
