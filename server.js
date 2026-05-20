import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import batchRoutes from './routes/batchRoutes.js';
import examRoutes from './routes/examRoutes.js';
import attemptRoutes from './routes/attemptRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
const app = express();
app.use(helmet());
app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'Examify API is running' });
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use(errorHandler);
async function start() {
    await connectDB();
    app.listen(env.PORT, () => {
        console.log(`Server running on port ${env.PORT}`);
    });
}
start();
