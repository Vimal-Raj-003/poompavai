// Local API server (mirrors the Vercel function). Run with: npm run dev:api
import http from 'node:http';
import handler from './router.js';

const port = Number(process.env.API_PORT || 3001);
http.createServer((req, res) => handler(req, res)).listen(port, () => console.log(`API on http://localhost:${port}`));
