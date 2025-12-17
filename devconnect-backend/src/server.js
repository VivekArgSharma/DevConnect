// devconnect-backend/src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import aiRoutes from "./routes/aiRoutes.js";
import adminRoutes from "./routes/adminPostRoutes.js"; // ✅ correct file

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [
    'http://localhost:8081',
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000',
    'https://devconnect.lovable.app'
  ],
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'DevConnect backend running' });
});

// -------------------- ROUTES --------------------
app.use('/api', userRoutes);                 // /api/me
app.use('/api/posts', postRoutes);           // /api/posts/*
app.use('/api/comments', commentRoutes);     // /api/comments/*
app.use('/api/teams', teamRoutes);           // /api/teams/*
app.use('/api/ai', aiRoutes);                // /api/ai/*
app.use('/api/admin', adminRoutes);          // ✅ FIXED HERE
// ------------------------------------------------

app.listen(PORT, () => {
  console.log(`DevConnect backend listening on port ${PORT}`);
});
