
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GameState, UserProfile, Team, Vote, GamePhase, TeamStats } from './types.ts';
import { supabase } from './lib/supabase.ts';
import LoginScreen from './components/LoginScreen.tsx';
import GameArena from './components/GameArena.tsx';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@heroui/react';

const ROUND_DURATION = 60; 
const VOTING_DURATION = 30;
const MAX_ROUNDS = 3;
const TOTAL_MATCH_TIME = MAX_ROUNDS * ROUND_DURATION;
const PRICE_HISTORY_LIMIT = 60;
const REALISTIC_FALLBACK_PRICE = 96000;

const BOT_PHRASES = [
  "SENSING VOLATILITY SHIFT. PREPARING UPLINK.",
  "ALPHA SQUAD: HOLDING POSITION.",
  "BETA SIGNALS DETECTED. NEUTRALIZING.",
  "MARKET ENTROPY INCREASING. STAY VIGILANT.",
  "CALCULATING DELTA... VOTE CAST.",
  "HEURISTIC ANALYSIS COMPLETE. DATA SYNCED.",
  "UPLINK STABLE. SQUAD STANCE CONFIRMED.",
  "ENERGY LEVELS NOMINAL. PROCEEDING WITH BATTLE.",
  "NODE OVERRIDE IN PROGRESS.",
  "SQUAD: TARGET ACQUIRED. INITIATING BULLISH RUN.",
  "MONITORING BITCOIN FLOWS. DELTA STABLE.",
  "ESTABLISHING SECURE PERIMETER.",
  "COORDINATING WITH GLOBAL NODES.",
  "BATTLE PROTOCOL ENGAGED. NO RETREAT."
];

const STATIC_TACTICAL_PHRASES = [
  "SECURE CHANNEL: TARGET ACQUIRED.",
  "PROTOCOL DELTA: INITIATED.",
  "SQUAD STRENGTH: OPTIMAL.",
  "GRID SYNC: 100%.",
  "ESTABLISHING PERIMETER...",
  "NEURAL LINK: STABLE.",
  "VOX COMMS: CRYSTAL CLEAR.",
  "TACTICAL OVERLAY: ACTIVE.",
  "DATA_FEED: NOMINAL.",
  "UPLINK_STATUS: SECURE.",
  "ENCRYPTION_LEVEL: MAX.",
  "SQUAD_VOTE: LOCKED.",
  "MARKET_RECON: COMPLETE.",
  "DELTA_OFFSET: MEASURED.",
  "SIGNAL_STRENGTH: 98%.",
  "PHASE_SHIFT: DETECTED."
];

const BOT_NAMES = ['UNIT_X1', 'RECON_7', 'CYPHER', 'GHOST_8', 'VOID_0', 'NEON_ARC', 'VECTOR', 'BLADE_Z', 'ZENO'];

const storage = {
  get: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key: string, value: string) => { try { localStorage.setItem(key, value); } catch {} },
  remove: (key: string) => { try { localStorage.removeItem(key); } catch {} }
};

const INITIAL_TEAM_STATS: TeamStats = {
  votesUp: 0,
  votesDown: 0,
  totalVotes: 0,
  stance: 'UNDECIDED',
  conviction: 0
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isJoinLocked, setIsJoinLocked] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [deployCountdown, setDeployCountdown] = useState(10);
  const [remainingMatchTime, setRemainingMatchTime] = useState(0);
  const [showSeriesEnd, setShowSeriesEnd] = useState(false);
  
  const [gameState, setGameState] = useState<GameState>({
    phase: 'VOTING',
    phaseEndTime: 0,
    startPrice: 0,
    currentPrice: 0,
    priceSource: 'SIMULATED',
    alphaStats: { ...INITIAL_TEAM_STATS },
    betaStats: { ...INITIAL_TEAM_STATS },
    winner: null,
    commentary: "Initializing network security protocols...",
    priceHistory: [],
    chat: [],
    roundNumber: 1,
    alphaScore: 0,
    betaScore: 0
  });

  const lastTickRef = useRef(-1);
  const botVotesRef = useRef<{ team: Team, time: number, vote: Vote }[]>([]);
  const botChatsRef = useRef<{ team: Team, time: number, text: string, sender: string }[]>([]);

  const scheduleBotActivity = useCallback((overrideTeam?: Team) => {
    const activeTeam = overrideTeam || (storage.get('arena_user_team') as Team) || user?.team || 'ALPHA';
    const otherTeam = activeTeam === 'ALPHA' ? 'BETA' : 'ALPHA';
    
    const votes: { team: Team, time: number, vote: Vote }[] = [];
    const chats: { team: Team, time: number, text: string, sender: string }[] = [];
    
    const alphaBotCount = activeTeam === 'ALPHA' ? 4 : 5;
    const betaBotCount = activeTeam === 'BETA' ? 4 : 5;

    botVotesRef.current = [];
    botChatsRef.current = [];

    // Schedule votes during voting phase
    for(let i = 0; i < alphaBotCount; i++) {
      votes.push({ team: 'ALPHA', time: Math.floor(Math.random() * 20) + 2, vote: Math.random() > 0.5 ? 'UP' : 'DOWN' });
    }
    for(let i = 0; i < betaBotCount; i++) {
      votes.push({ team: 'BETA', time: Math.floor(Math.random() * 20) + 2, vote: Math.random() > 0.5 ? 'UP' : 'DOWN' });
    }

    // Distribute chats across entire round
    const allPhrases = [...BOT_PHRASES, ...STATIC_TACTICAL_PHRASES];
    for(let i = 0; i < 15; i++) {
      const scheduledTime = Math.floor(Math.random() * 58) + 1;
      const chatTeam = Math.random() > 0.3 ? activeTeam : otherTeam;
      chats.push({ 
        team: chatTeam, 
        time: scheduledTime, 
        text: allPhrases[Math.floor(Math.random() * allPhrases.length)],
        sender: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
      });
    }

    botVotesRef.current = votes;
    botChatsRef.current = chats;
  }, [user?.team]);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await fetchUserProfile(session.user.id);
      setLoading(false);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) await fetchUserProfile(session.user.id);
      else {
        setUser(null);
        setIsParticipant(false);
        setIsDeploying(false);
        setShowSeriesEnd(false);
      }
    });
    initAuth();
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!error && data) {
      const storedTeam = (storage.get('arena_user_team') as Team) || 'ALPHA';
      setUser({
        id: userId,
        name: data.username,
        team: storedTeam,
        currentVote: null,
        persistentStats: { wins: data.wins, losses: data.losses, total_score: data.total_score }
      });

      const matchStartString = storage.get('arena_match_start');
      if (matchStartString) {
        const matchStart = parseInt(matchStartString);
        const totalElapsed = Math.floor((Date.now() - matchStart) / 1000);
        if (totalElapsed < TOTAL_MATCH_TIME) {
          setIsJoinLocked(true);
        }
      }
    }
  };

  const handleLoginSuccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await fetchUserProfile(session.user.id);
      const team: Team = Math.random() > 0.5 ? 'ALPHA' : 'BETA';
      storage.set('arena_user_team', team);
      setIsDeploying(true);
      setDeployCountdown(10);
    }
  };

  useEffect(() => {
    if (!isDeploying) return;
    const timer = setInterval(() => {
      setDeployCountdown(prev => {
        if (prev <= 1) {
          setIsDeploying(false);
          setIsParticipant(true); 
          const startTime = Date.now();
          storage.set('arena_match_start', startTime.toString());
          scheduleBotActivity();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isDeploying, scheduleBotActivity]);

  const fetchPrice = useCallback(async (): Promise<{ price: number, source: GameState['priceSource'] }> => {
    try {
      const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
      const data = await res.json();
      if (data?.data?.amount) return { price: parseFloat(data.data.amount), source: 'COINBASE' };
    } catch (e) {}
    return { price: (gameState.currentPrice || REALISTIC_FALLBACK_PRICE) + (Math.random() - 0.5) * 50, source: 'SIMULATED' };
  }, [gameState.currentPrice]);

  useEffect(() => {
    const loop = setInterval(async () => {
      const matchStartString = storage.get('arena_match_start');
      if (!matchStartString || isDeploying || showSeriesEnd) return;
      
      const matchStart = parseInt(matchStartString);
      const now = Date.now();
      const totalElapsed = Math.floor((now - matchStart) / 1000);

      if (totalElapsed < 0 || totalElapsed > TOTAL_MATCH_TIME + 5) return;

      if (isJoinLocked) {
        const timeLeft = TOTAL_MATCH_TIME - totalElapsed;
        setRemainingMatchTime(Math.max(0, timeLeft));
        if (timeLeft <= 0) {
          setIsJoinLocked(false);
          storage.remove('arena_match_start');
        }
        return;
      }

      if (totalElapsed >= TOTAL_MATCH_TIME) {
        setShowSeriesEnd(true);
        setIsParticipant(false);
        lastTickRef.current = -1;
        return;
      }

      if (!user) return;
      if (totalElapsed === lastTickRef.current) return;
      lastTickRef.current = totalElapsed;

      const { price, source } = await fetchPrice();
      const roundNumber = Math.min(MAX_ROUNDS, Math.floor(totalElapsed / ROUND_DURATION) + 1);
      const roundElapsed = totalElapsed % ROUND_DURATION;

      setGameState(prev => {
        let currentPhase: GamePhase = 'VOTING';
        let phaseEnd = 30 - roundElapsed;
        if (roundElapsed < 30) currentPhase = 'VOTING';
        else if (roundElapsed < 50) { currentPhase = 'BATTLE'; phaseEnd = 50 - roundElapsed; }
        else { currentPhase = 'RESULT'; phaseEnd = 60 - roundElapsed; }

        let alpha = { ...prev.alphaStats };
        let beta = { ...prev.betaStats };
        let winner = prev.winner;
        let startPrice = prev.startPrice;
        let aScore = prev.alphaScore;
        let bScore = prev.betaScore;
        let currentChat = [...prev.chat];

        if (roundElapsed === 0 && totalElapsed > 0) {
          alpha = { ...INITIAL_TEAM_STATS };
          beta = { ...INITIAL_TEAM_STATS };
          winner = null;
          scheduleBotActivity();
          setUser(u => u ? { ...u, currentVote: null } : null);
        }

        if (roundElapsed === 29) {
          if (user.currentVote === null) {
            const v: Vote = Math.random() > 0.5 ? 'UP' : 'DOWN';
            const stats = user.team === 'ALPHA' ? alpha : beta;
            stats.totalVotes++;
            if (v === 'UP') stats.votesUp++; else stats.votesDown++;
            setUser(u => u ? { ...u, currentVote: v } : null);
          }
          const fillSquad = (stats: TeamStats) => {
            while (stats.totalVotes < 5) {
              stats.totalVotes++;
              if (Math.random() > 0.5) stats.votesUp++; else stats.votesDown++;
            }
          };
          fillSquad(alpha);
          fillSquad(beta);
          botVotesRef.current = [];
        }

        if (currentPhase === 'VOTING') {
          const activeVotes = botVotesRef.current.filter(v => v.time <= roundElapsed);
          activeVotes.forEach(bv => {
            const teamStats = bv.team === 'ALPHA' ? alpha : beta;
            if (teamStats.totalVotes < 5) {
              teamStats.totalVotes++;
              if (bv.vote === 'UP') teamStats.votesUp++; else teamStats.votesDown++;
            }
          });
          botVotesRef.current = botVotesRef.current.filter(v => v.time > roundElapsed);
        }

        // Processing prewritten chats with robust catch-up
        const activeChats = botChatsRef.current.filter(c => c.time <= roundElapsed);
        if (activeChats.length > 0) {
          activeChats.forEach(bc => {
            currentChat.push({ id: uuidv4(), sender: bc.sender, team: bc.team, text: bc.text, timestamp: now });
          });
          botChatsRef.current = botChatsRef.current.filter(c => c.time > roundElapsed);
        }

        if (roundElapsed === 30) {
          startPrice = price;
          const finalize = (stats: TeamStats) => {
            const total = stats.totalVotes;
            const upPct = total > 0 ? (stats.votesUp / total) * 100 : 50;
            stats.stance = upPct >= 50 ? 'BULL' : 'BEAR';
            stats.conviction = upPct >= 50 ? Math.round(upPct) : Math.round(100 - upPct);
          };
          finalize(alpha);
          finalize(beta);
        }

        if (roundElapsed === 50) {
          const up = price > startPrice;
          const aRight = (alpha.stance === 'BULL' && up) || (alpha.stance === 'BEAR' && !up);
          const bRight = (beta.stance === 'BULL' && up) || (beta.stance === 'BEAR' && !up);
          if (aRight && !bRight) { winner = 'ALPHA'; aScore++; }
          else if (bRight && !aRight) { winner = 'BETA'; bScore++; }
          else {
            winner = alpha.conviction >= beta.conviction ? 'ALPHA' : 'BETA';
            if (winner === 'ALPHA') aScore++; else bScore++;
          }
        }

        let newCommentary = prev.commentary;
        if (roundElapsed % 10 === 0 || roundElapsed === 31 || roundElapsed === 51) {
          newCommentary = STATIC_TACTICAL_PHRASES[Math.floor(Math.random() * STATIC_TACTICAL_PHRASES.length)];
        }

        return {
          ...prev,
          currentPrice: price,
          priceSource: source,
          priceHistory: [...prev.priceHistory, { timestamp: now, price }].slice(-PRICE_HISTORY_LIMIT),
          phase: currentPhase,
          phaseEndTime: now + (phaseEnd * 1000),
          alphaStats: alpha,
          betaStats: beta,
          winner,
          startPrice,
          roundNumber,
          alphaScore: aScore,
          betaScore: bScore,
          chat: currentChat.slice(-30),
          commentary: newCommentary
        };
      });
    }, 1000);
    return () => clearInterval(loop);
  }, [fetchPrice, user, isDeploying, isJoinLocked, scheduleBotActivity, showSeriesEnd]);

  const handleRestart = () => {
    storage.remove('arena_match_start');
    setShowSeriesEnd(false);
    setIsParticipant(false);
    setIsDeploying(true);
    setDeployCountdown(10);
    botVotesRef.current = [];
    botChatsRef.current = [];
    lastTickRef.current = -1;
    
    setGameState(prev => ({
      ...prev,
      phase: 'VOTING',
      phaseEndTime: 0,
      startPrice: 0,
      alphaStats: { ...INITIAL_TEAM_STATS },
      betaStats: { ...INITIAL_TEAM_STATS },
      winner: null,
      commentary: "Re-initializing network protocols...",
      chat: [],
      roundNumber: 1,
      alphaScore: 0,
      betaScore: 0
    }));
  };

  const handleExit = () => {
    storage.remove('arena_match_start');
    storage.remove('arena_user_team');
    setShowSeriesEnd(false);
    setIsParticipant(false);
    setIsDeploying(false);
    setUser(null);
    supabase.auth.signOut();
  };

  const handleVote = useCallback((vote: Vote) => {
    if (gameState.phase !== 'VOTING' || !user) return;
    setGameState(prev => {
      const statsKey = user.team === 'ALPHA' ? 'alphaStats' : 'betaStats';
      const stats = { ...prev[statsKey] };
      if (user.currentVote === null) { stats.totalVotes++; } 
      else { if (user.currentVote === 'UP') stats.votesUp--; else stats.votesDown--; }
      if (vote === 'UP') stats.votesUp++; else stats.votesDown++;
      setUser(u => u ? { ...u, currentVote: vote } : null);
      return { ...prev, [statsKey]: stats };
    });
  }, [user, gameState.phase]);

  const handleSendMessage = (text: string) => {
    if (!user) return;
    setGameState(prev => ({
      ...prev, 
      chat: [...prev.chat, { id: uuidv4(), sender: user.name, team: user.team, text, timestamp: Date.now() }].slice(-30)
    }));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-green-500 font-black text-[10px] uppercase tracking-[0.5em]">Establishing Connection...</span>
      </div>
    </div>
  );

  if (!user) return <LoginScreen onLogin={handleLoginSuccess} />;

  if (isJoinLocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] p-4 text-center cyber-grid">
        <div className="max-w-md w-full space-y-10">
          <ShieldAlert size={64} className="text-red-500 mx-auto" />
          <h2 className="text-4xl font-black text-red-500 italic uppercase">ARENA_LOCKED</h2>
          <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-none">
            <div className="text-6xl font-black text-white tabular-nums">{remainingMatchTime}s</div>
          </div>
          <button onClick={handleExit} className="text-[10px] text-slate-700 font-black uppercase tracking-widest hover:text-red-500">[TERMINATE_UPLINK]</button>
        </div>
      </div>
    );
  }

  if (isDeploying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] p-4 text-center cyber-grid">
        <div className="max-w-md w-full space-y-8 animate-in fade-in duration-1000">
          <h2 className="text-4xl md:text-5xl font-black text-green-400 neon-text-green tracking-tighter italic uppercase">SYNCING SQUAD</h2>
          <div className="space-y-4">
            <p className="text-slate-500 text-[10px] tracking-[0.6em] uppercase font-bold opacity-60">WAITING FOR OPERATORS</p>
            <div className="text-7xl font-black text-white tabular-nums">{deployCountdown}s</div>
          </div>
          <p className="text-[8px] text-slate-700 font-black uppercase tracking-widest">Team Assignment: {user.team}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <GameArena 
        gameState={gameState} 
        user={user} 
        onVote={handleVote} 
        onSendMessage={handleSendMessage} 
        onExit={handleExit} 
        isEligible={isParticipant}
      />

      {showSeriesEnd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
          <div className="max-w-md w-full border-2 border-slate-800 bg-slate-900/50 p-8 flex flex-col items-center text-center shadow-2xl shadow-green-500/10">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-4">Conflict Resolution</h2>
            
            <div className="mb-8">
              {((user.team === 'ALPHA' && gameState.alphaScore > gameState.betaScore) || 
                (user.team === 'BETA' && gameState.betaScore > gameState.alphaScore)) ? (
                <h3 className="text-5xl font-black text-amber-500 italic uppercase">VICTORY</h3>
              ) : (
                <h3 className="text-5xl font-black text-red-600 italic uppercase">DEFEAT</h3>
              )}
            </div>

            <div className="w-full bg-black/40 border border-slate-800 p-6 mb-8 space-y-2">
              <div className="flex justify-between font-black text-lg">
                 <span className="text-primary">ALPHA: {gameState.alphaScore}</span>
                 <span className="text-purple-500">BETA: {gameState.betaScore}</span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-4">
               <Button 
                onClick={handleRestart} 
                className="h-16 bg-green-500 text-black font-black uppercase tracking-widest rounded-none hover:bg-green-400 transition-all cursor-pointer shadow-[0_0_15px_rgba(34,197,94,0.3)]"
               >
                 START NEW GAME
               </Button>
               {/* Terminate option removed to satisfy "not terminate connection" requirement */}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
