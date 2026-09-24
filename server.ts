import express from 'express';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.get('/api/coins', (req, res) => {
    // This is where you would integrate your on-chain data provider API
    // e.g., fetch from Helius, QuickNode, or other Solana/ETH RPC providers
    res.json([
      { id: 'sol-1', symbol: 'SOL-TEST-1', mcap: 150000, liquidity: 20000, ageMin: 5 },
      { id: 'sol-2', symbol: 'SOL-TEST-2', mcap: 80000, liquidity: 15000, ageMin: 12 },
    ]);
  });

  app.use(vite.middlewares);

  app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });
}

startServer();
