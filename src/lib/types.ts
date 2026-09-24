export type AgentName = 'BOLT' | 'GANNA' | 'MINTY' | 'SKYE' | 'NOVA' | 'RISK';

export interface AgentStatus {
  name: AgentName;
  role: string;
  status: 'idle' | 'ok' | 'error';
  spotlight: boolean;
}

export interface Coin {
  id: string;
  symbol: string;
  mcap: number;
  liquidity: number;
  ageMin: number;
}

export interface Position {
  id: string;
  coin: Coin;
  entryTs: number;
  deadline: number;
  costUsd: number;
}

export interface Trade {
  id: string;
  symbol: string;
  pnl: number;
  ts: number;
}

export interface EquityPoint {
  ts: number;
  balance: number;
}
