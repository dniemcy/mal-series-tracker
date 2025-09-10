import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import sessionMiddleware from './middleware/session';
import * as animeRoutes from './routes/anime';
import authRoutes from './routes/auth';
import configRoutes from './routes/config';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(sessionMiddleware);
app.use(express.static('public'));

app.use('/api/user', animeRoutes.authenticatedRoutes);
app.use('/api/anime', animeRoutes.publicRoutes);
app.use('/auth', authRoutes);
app.use('/api', configRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(port, () => {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = process.env.HOST || 'localhost';
  const url = `${protocol}://${host}:${port}`;
  
  console.log(`Server running at:`);
  console.log(`  > Local:    \x1b[36m${url}\x1b[0m`);
  
  try {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const results: Record<string, string[]> = {};
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
          if (!results[name]) {
            results[name] = [];
          }
          results[name].push(net.address);
        }
      }
    }
    
    for (const [iface, addresses] of Object.entries(results)) {
      for (const addr of addresses) {
        const networkUrl = `${protocol}://${addr}:${port}`;
        console.log(`  > Network (${iface}): \x1b[36m${networkUrl}\x1b[0m`);
      }
    }
  } catch (e) {
    // If OS-specific functionality fails, just continue
    console.log('  > Network: Not available');
  }
});
