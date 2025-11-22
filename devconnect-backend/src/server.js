import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [
    'http://localhost:8080',   // ✅ YOUR VITE FRONTEND
    'http://localhost:5173',
    'http://localhost:3000',
    'https://devconnect.lovable.app'
  ],
  credentials: true
}));


app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'DevConnect backend running' });
});

// Routes
app.use('/api', userRoutes);         // /api/me, /api/me/sync
app.use('/api/posts', postRoutes);   // /api/posts

app.listen(PORT, () => {
  console.log(`DevConnect backend listening on port ${PORT}`);
});
