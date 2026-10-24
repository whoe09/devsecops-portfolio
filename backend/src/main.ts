import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 3000);

// 보안 설정: Express 기본 헤더(X-Powered-By: Express) 노출 차단
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

// 환경변수 기반 DB 커넥션 풀 설정
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || 'localdevpassword',
  database: process.env.DB_NAME || 'portfoliodb',
  connectionTimeoutMillis: 3000,
});

const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS security_assets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Database initialized (security_assets table ready)');
  } catch (err) {
    console.warn('⚠️ DB not reachable yet. Running in degraded mode:', (err as Error).message);
  }
};

// [필수 요건 1] 헬스체크 API (Node 런타임 버전 및 DB 상태 반환)
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'UP',
      database: 'CONNECTED',
      runtime: process.version,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'DOWN',
      database: 'DISCONNECTED',
      runtime: process.version,
      error: (err as Error).message
    });
  }
});

// [필수 요건 2] 자산 목록 조회 API
app.get('/api/items', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM security_assets ORDER BY id DESC LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// [필수 요건 3] 자산 등록 API (Parameterized Query로 SQL Injection 방어)
app.post('/api/items', async (req: Request, res: Response) => {
  const { name, category } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'Name and category are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO security_assets (name, category) VALUES ($1, $2) RETURNING *',
      [name, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Backend server (${process.version}) running on port ${port}`);
  initDb();
});

// 컨테이너 종료 시그널(SIGTERM) 수신 시 Graceful Shutdown 처리
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing HTTP server and DB pool...');
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
});
