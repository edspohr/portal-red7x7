import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import contactRequestRoutes from './routes/contactRequestRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import errorHandler from './middleware/errorHandler.js';

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  app.use('/api/auth', authRoutes);
  app.use('/api/announcements', announcementRoutes);
  app.use('/api/meetings', meetingRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/contact-requests', contactRequestRoutes);
  app.use('/api/health', healthRoutes);

  app.use(errorHandler);

  return app;
};

export default createApp;
