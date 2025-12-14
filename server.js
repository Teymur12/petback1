import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import cors from 'cors';
import cityRoutes from './router/city.router.js';
import registerRoutes from './router/register.router.js';
import chatRoutes from './router/chat.router.js';
import listingRoutes from './router/listing.router.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8888;
const httpServer = createServer(app);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });

// Middleware-lər
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));
app.use(express.static('./'));

// Routes
app.use('/api/cities', cityRoutes);
app.use('/api/auth', registerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/listings', listingRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API hazırdır',
    endpoints: {
      cities: '/api/cities',
      auth: '/api/auth',
      chat: '/api/chat'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route tapılmadı'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server xətası',
    error: err.message
  });
});

// Server başlat
httpServer.listen(PORT, () => {
  console.log(`🚀 Server: http://localhost:${PORT}`);
});