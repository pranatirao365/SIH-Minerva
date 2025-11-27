import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import path from 'path';

import routes from './routes';

const app = express();

// Enhanced CORS for video streaming
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
}));

app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '10mb' }));

// Serve static files from output directory with proper headers for video streaming
const outputDir = path.resolve(__dirname, '../../output');
app.use('/videos', (req, res, next) => {
  // Set headers for video streaming
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(outputDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    }
  }
}));

// Serve static files from images directory
const imagesDir = path.resolve(__dirname, '../../images');
app.use('/images', express.static(imagesDir));

// Serve static files from audio directory
const audioDir = path.resolve(__dirname, '../../audio');
app.use('/audio', express.static(audioDir));

app.use('/api', routes);

app.get('/', (req, res) => res.json({ ok: true, service: 'minerva-backend' }));

export default app;
