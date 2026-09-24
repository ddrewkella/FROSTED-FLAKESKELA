/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSniperEngine } from './lib/sniperEngine';
import { Bot, LogIn, Zap, ShieldAlert } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { auth, googleAuthProvider } from './lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

export default function App() {
  const { balance, positions, history, equityCurve, agents, isTrading, scan, overrideExit, stopTrading, startTrading } = useSniperEngine();
  const [user, setUser] = useState(auth.currentUser);
  const { connected, publicKey } = useWallet();

  useEffect(() => {
    return auth.onAuthStateChanged(setUser);
  }, []);

  const handleSignIn = async () => {
    await signInWithPopup(auth, googleAuthProvider);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Bot className="text-emerald-500 animate-pulse" />
          <h1 className="text-xl font-bold tracking-tight">Grok Bot</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
            <span className={`inline-block w-2 h-2 rounded-full ${isTrading ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
            <span className={isTrading ? 'text-emerald-600' : 'text-rose-600'}>
              {isTrading ? 'Trading Live' : 'Trading Halted'}
            </span>
          </div>
          <div className={`text-xs font-bold ${connected ? 'text-emerald-600' : 'text-slate-400'}`}>
            {connected ? `Wallet: ${publicKey?.toBase58().slice(0, 4)}...` : 'Disconnected'}
          </div>
          {user ? (
            <button onClick={() => signOut(auth)} className="text-xs font-bold text-rose-600">Sign Out</button>
          ) : (
            <button onClick={handleSignIn} className="flex items-center gap-1 text-xs font-bold text-emerald-600">
              <LogIn size={14} /> Connect Auth
            </button>
          )}
          <WalletMultiButton className="!bg-sky-600 !text-xs !font-bold" />
        </div>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-slate-500 mb-1">Visible Balance</div>
            <div className="text-4xl font-bold tracking-tight text-emerald-600">${balance.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Active Positions</div>
            <div className="text-xl font-bold text-slate-800">{positions.length}</div>
          </div>
        </div>

        {isTrading ? (
          <button 
            onClick={stopTrading} 
            className="mt-4 w-full bg-rose-600 hover:bg-rose-700 transition-colors text-white font-bold py-3 px-4 rounded-xl shadow-sm"
          >
            STOP TRADING IMMEDIATELY
          </button>
        ) : (
          <button 
            onClick={startTrading} 
            className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 transition-colors text-white font-bold py-3 px-4 rounded-xl shadow-sm"
          >
            RESUME TRADING
          </button>
        )}
      </div>

      <div className="h-40 bg-white rounded-2xl shadow-sm border border-slate-100 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={equityCurve}>
            <Line type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} dot={false} />
            <XAxis dataKey="ts" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={scan} className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors">
          <Zap className="text-emerald-500" />
          <span className="font-semibold text-sm">Force Scan</span>
        </button>
        <button onClick={overrideExit} className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors">
          <ShieldAlert className="text-rose-500" />
          <span className="font-semibold text-sm">Exit All</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100">
        <h2 className="text-sm font-bold mb-2">Exchange Spiderweb</h2>
        <svg viewBox="0 0 100 100" className="w-full h-24">
          <circle cx="50" cy="50" r="30" fill="none" stroke="#e2e8f0" strokeDasharray="4" />
          <circle cx="50" cy="20" r="3" fill="#10b981" />
          <circle cx="80" cy="50" r="3" fill="#10b981" />
          <circle cx="50" cy="80" r="3" fill="#10b981" />
          <circle cx="20" cy="50" r="3" fill="#10b981" />
          <line x1="50" y1="20" x2="50" y2="80" stroke="#cbd5e1" />
          <line x1="20" y1="50" x2="80" y2="50" stroke="#cbd5e1" />
        </svg>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100 flex-1 overflow-y-auto min-h-[140px]">
        <h2 className="text-sm font-bold mb-2">Trade History ({history.length})</h2>
        {history.length === 0 ? (
          <div className="text-xs text-slate-400 py-4 text-center">No trades closed yet</div>
        ) : (
          history.map((t, index) => (
            <div key={t.id || `trade-${index}-${t.ts}`} className="flex justify-between text-xs py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-700">{t.symbol}</span>
              <span className={`font-mono font-semibold ${t.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-6 gap-2">
        {agents.map(agent => (
          <div key={agent.name} className={`p-2 rounded-full text-center text-[10px] font-bold ${agent.spotlight ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
            {agent.name}
          </div>
        ))}
      </div>
    </div>
  );
}
