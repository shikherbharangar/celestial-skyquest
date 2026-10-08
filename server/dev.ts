import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { configHandler, identificationHandler } from './http';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const port = Number(process.env.API_PORT || 8787);
const server = createServer((req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;
  if (path === '/api/config') configHandler(req, res);
  else if (path === '/api/identify') void identificationHandler(req, res);
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});
server.listen(port, '127.0.0.1', () =>
  console.log(
    `CELESTIAL API listening on port ${port}; live Gemma ${process.env.GEMMA_API_KEY ? 'configured' : 'not configured'}.`,
  ),
);
