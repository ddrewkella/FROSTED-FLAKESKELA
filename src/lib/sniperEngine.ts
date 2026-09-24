import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentStatus, Position, Trade, EquityPoint } from './types';

const EXIT_SECONDS = 15;
const DECAY_PCT = 0.25;

let idCounter = 0;
const generateUniqueId = (prefix: string) => {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
};

export const useSniperEngine = () => {
  const [balance, setBalance] = useState(100.0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<Trade[]>([]);
  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>([{ ts: Date.now(), balance: 100.0 }]);
  const [isTrading, setIsTrading] = useState(true);

  // Maintain refs for current state to avoid stale closures in timers
  const positionsRef = useRef<Position[]>([]);
  positionsRef.current = positions;

  const balanceRef = useRef(balance);
  balanceRef.current = balance;

  const isTradingRef = useRef(isTrading);
  isTradingRef.current = isTrading;

  // Aggressive Parameters
  const MAX_POSITION_PCT = 0.30;
  const MAX_ACTIVE_POSITIONS = 5;

  const [agents] = useState<AgentStatus[]>([
    { name: 'BOLT', role: 'Fast Mover', status: 'ok', spotlight: true },
    { name: 'GANNA', role: 'Arbitrage Scanner', status: 'idle', spotlight: false },
    { name: 'MINTY', role: 'New Token Sniffer', status: 'idle', spotlight: false },
    { name: 'SKYE', role: 'Momentum Filter', status: 'idle', spotlight: false },
    { name: 'NOVA', role: 'Liquidity Hunter', status: 'idle', spotlight: false },
    { name: 'RISK', role: 'Hard Stop Controller', status: 'idle', spotlight: false },
  ]);

  // Decay Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setBalance(prev => {
        const newBalance = Math.max(0, prev * (1 - DECAY_PCT / 86400));
        setEquityCurve(ec => [...ec.slice(-49), { ts: Date.now(), balance: newBalance }]);
        return newBalance;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Exit & Settlement Timer - runs cleanly outside state updater
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const current = positionsRef.current;
      const toClose = current.filter(p => now >= p.deadline);

      if (toClose.length > 0) {
        let totalPnl = 0;
        const newTrades: Trade[] = [];

        toClose.forEach(p => {
          const pnl = (Math.random() - 0.35) * p.costUsd * 0.5;
          totalPnl += pnl;
          newTrades.push({
            id: generateUniqueId('trade'),
            symbol: p.coin.symbol,
            pnl,
            ts: now,
          });
        });

        // Update positions without closing again
        setPositions(prev => prev.filter(p => now < p.deadline));
        setBalance(b => Math.max(0, b + totalPnl));
        setHistory(h => [...newTrades, ...h].slice(0, 30));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const scan = useCallback(async () => {
    if (!isTradingRef.current) return;
    if (positionsRef.current.length >= MAX_ACTIVE_POSITIONS) return;

    try {
      const response = await fetch('/api/coins');
      const coins = await response.json();
      if (Array.isArray(coins) && coins.length > 0) {
        // Pick a random detected coin from the list
        const coin = coins[Math.floor(Math.random() * coins.length)];
        const currentBalance = balanceRef.current;
        const costUsd = Math.max(1, currentBalance * MAX_POSITION_PCT);

        const newPos: Position = {
          id: generateUniqueId('pos'),
          coin: { id: coin.id, symbol: coin.symbol, mcap: coin.mcap, liquidity: coin.liquidity, ageMin: coin.ageMin },
          entryTs: Date.now(),
          deadline: Date.now() + EXIT_SECONDS * 1000,
          costUsd,
        };

        setPositions(prev => {
          if (prev.length >= MAX_ACTIVE_POSITIONS) return prev;
          return [...prev, newPos];
        });
      }
    } catch (e) {
      console.warn('Scan request error:', e);
    }
  }, [MAX_POSITION_PCT]);

  // Automated scanning loop with controlled cadence
  useEffect(() => {
    if (!isTrading) return;
    const scanLoop = setInterval(() => {
      scan();
    }, 1500);
    return () => clearInterval(scanLoop);
  }, [scan, isTrading]);

  const stopTrading = useCallback(() => {
    setIsTrading(false);
    isTradingRef.current = false;
    setPositions([]);
  }, []);

  const startTrading = useCallback(() => {
    setIsTrading(true);
    isTradingRef.current = true;
  }, []);

  const overrideExit = useCallback(() => {
    setPositions([]);
  }, []);

  return { balance, positions, history, equityCurve, agents, isTrading, scan, overrideExit, stopTrading, startTrading };
};
