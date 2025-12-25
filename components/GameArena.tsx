
import React from 'react';
import { 
  Button, 
  Card, 
  CardBody, 
  Divider, 
  Progress, 
  Modal, 
  ModalContent, 
  ModalBody, 
  Tooltip,
  Chip
} from '@heroui/react';
import { GameState, UserProfile, Vote } from '../types.ts';
import LiveChart from './LiveChart.tsx';
import ChatBox from './ChatBox.tsx';
import ProgressBar from './ProgressBar.tsx';
import { LogOut, Zap, Activity, AlertCircle } from 'lucide-react';

interface GameArenaProps {
  gameState: GameState;
  user: UserProfile;
  onVote: (vote: Vote) => void;
  onSendMessage: (text: string) => void;
  onExit: () => void;
  isEligible: boolean;
}

const GameArena: React.FC<GameArenaProps> = ({ gameState, user, onVote, onSendMessage, onExit, isEligible }) => {
  const timeLeft = Math.max(0, Math.floor((gameState.phaseEndTime - Date.now()) / 1000));
  const isUp = gameState.currentPrice >= gameState.startPrice;
  const isFinalRound = gameState.roundNumber === 3;
  
  const alpha = gameState.alphaStats;
  const beta = gameState.betaStats;

  return (
    <div className="max-w-7xl mx-auto w-full p-4 flex flex-col h-screen max-h-screen gap-4 overflow-hidden bg-background relative">
      {/* HEADERBAR */}
      <Card className="shrink-0 bg-slate-900/50 border-slate-800 rounded-lg">
        <CardBody className="flex flex-row justify-between items-center p-4">
          <div className="flex items-center gap-6">
            <h2 className="text-3xl font-black text-green-400 italic leading-none tracking-tighter">CBA</h2>
            <Divider orientation="vertical" className="h-8 bg-slate-800" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Current BTC</span>
                <span className="text-[8px] text-green-400 font-black uppercase tracking-tighter opacity-100 neon-text-green">via_{gameState.priceSource.toLowerCase()}</span>
              </div>
              <span className={`text-2xl font-bold leading-none tabular-nums ${isUp ? 'text-green-400' : 'text-red-500'}`}>
                ${gameState.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex-1 flex justify-center px-6">
            <div className="flex items-center gap-6 bg-black/40 px-6 py-2 rounded-full border border-slate-800">
               <div className="text-center">
                 <span className="text-[9px] text-slate-500 block uppercase font-bold mb-1">Round</span>
                 <span className="text-xl font-black text-white">{gameState.roundNumber} / 3</span>
               </div>
               <div className="flex items-center gap-4">
                 <div className="text-right">
                   <span className="text-[8px] text-primary block font-black uppercase">Alpha</span>
                   <span className="text-2xl font-black text-primary">{gameState.alphaScore}</span>
                 </div>
                 <div className="text-slate-700 font-black text-xl">:</div>
                 <div className="text-left">
                   <span className="text-[8px] text-purple-400 block font-black uppercase">Beta</span>
                   <span className="text-2xl font-black text-purple-400">{gameState.betaScore}</span>
                 </div>
               </div>
            </div>
          </div>

          <div className="flex gap-4 items-center">
             <div className="flex flex-col items-end pr-4">
                <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Global Rank</span>
                <span className="text-sm font-black text-white">SCORE: {user.persistentStats?.total_score || 0}</span>
             </div>
             <Divider orientation="vertical" className="h-10 bg-slate-800" />
             <div className="text-right min-w-[60px]">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest">{gameState.phase}</span>
                <span className="text-2xl font-black text-white tabular-nums">{timeLeft}s</span>
             </div>
             <Tooltip content="Disconnect Session" color="danger">
                <Button isIconOnly variant="light" color="danger" onPress={onExit}><LogOut size={20}/></Button>
             </Tooltip>
          </div>
        </CardBody>
      </Card>

      {/* TACTICAL SYSTEM LOG - PERMANENTLY VISIBLE COMMENTARY */}
      <Card className="shrink-0 bg-black/40 border-y border-slate-800/50 rounded-none -mx-4">
        <CardBody className="py-2 px-6 flex flex-row items-center gap-4">
           <Zap size={14} className="text-green-500 animate-pulse shrink-0" />
           <div className="flex-1 overflow-hidden whitespace-nowrap">
              <span className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em] inline-block animate-in fade-in slide-in-from-right-2 duration-500">
                SYSTEM_LOG :: {gameState.commentary}
              </span>
           </div>
           <div className="flex items-center gap-2 shrink-0">
             <Activity size={12} className="text-slate-700" />
             <span className="text-[8px] text-slate-700 font-black uppercase tracking-widest">Feed_Live</span>
           </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden min-h-0">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4 overflow-hidden h-full">
          <Card className="flex-1 min-h-0 bg-slate-900/30 border-slate-800 overflow-hidden">
             <CardBody className="p-4 h-full relative">
                <LiveChart data={gameState.priceHistory} startPrice={gameState.startPrice} phase={gameState.phase} />
                {gameState.phase === 'VOTING' && user.currentVote === null && timeLeft <= 10 && (
                  <div className="absolute top-4 left-4 z-50 animate-bounce">
                    <Chip variant="shadow" color="danger" startContent={<AlertCircle size={12}/>} className="text-[10px] font-black uppercase">
                      ACTION REQUIRED: {timeLeft}S
                    </Chip>
                  </div>
                )}
             </CardBody>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 shrink-0">
            <CardBody className="p-6 relative min-h-[140px] flex flex-col justify-center">
              {gameState.phase === 'VOTING' ? (
                <div className="grid grid-cols-2 gap-4">
                  <Button isDisabled={!isEligible} onPress={() => onVote('UP')} className={`h-20 border-2 ${user.currentVote === 'UP' ? 'bg-green-500 border-white text-black' : 'border-green-500/20 text-green-400'}`} variant="bordered">
                    <span className="text-xl font-bold">▲ BULLISH</span>
                  </Button>
                  <Button isDisabled={!isEligible} onPress={() => onVote('DOWN')} className={`h-20 border-2 ${user.currentVote === 'DOWN' ? 'bg-red-500 border-white text-black' : 'border-red-500/20 text-red-500'}`} variant="bordered">
                    <span className="text-xl font-bold">▼ BEARISH</span>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                   <ProgressBar gameState={gameState} />
                   <div className="text-center text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] opacity-40">
                     Conflict Protocol Engaged // Territory Shifting
                   </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-hidden h-full">
           <div className="grid grid-cols-2 gap-2 shrink-0">
              <Card className={`bg-slate-900/50 border-slate-800 ${user.team === 'ALPHA' ? 'border-primary ring-1 ring-primary/20' : ''}`}>
                <CardBody className="p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">ALPHA UNIT</span>
                    <span className="text-[10px] font-black text-slate-500">{alpha.totalVotes}/5</span>
                  </div>
                  <Progress size="sm" value={(alpha.totalVotes/5)*100} color="primary" className="h-1" />
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-black/60 p-2 text-center rounded border border-green-500/10">
                      <span className="text-[9px] block text-slate-500 font-black uppercase mb-0.5">UP</span>
                      <span className="text-xl font-black text-green-400 leading-none">{alpha.votesUp}</span>
                    </div>
                    <div className="bg-black/60 p-2 text-center rounded border border-red-500/10">
                      <span className="text-[9px] block text-slate-500 font-black uppercase mb-0.5">DN</span>
                      <span className="text-xl font-black text-red-500 leading-none">{alpha.votesDown}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className={`bg-slate-900/50 border-slate-800 ${user.team === 'BETA' ? 'border-purple-500 ring-1 ring-purple-500/20' : ''}`}>
                <CardBody className="p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">BETA UNIT</span>
                    <span className="text-[10px] font-black text-slate-500">{beta.totalVotes}/5</span>
                  </div>
                  <Progress size="sm" value={(beta.totalVotes/5)*100} color="secondary" className="h-1" />
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-black/60 p-2 text-center rounded border border-green-500/10">
                      <span className="text-[9px] block text-slate-500 font-black uppercase mb-0.5">UP</span>
                      <span className="text-xl font-black text-green-400 leading-none">{beta.votesUp}</span>
                    </div>
                    <div className="bg-black/60 p-2 text-center rounded border border-red-500/10">
                      <span className="text-[9px] block text-slate-500 font-black uppercase mb-0.5">DN</span>
                      <span className="text-xl font-black text-red-500 leading-none">{beta.votesDown}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
           </div>

           <Card className="flex-1 bg-slate-900/30 border-slate-800 overflow-hidden min-h-0">
              <ChatBox messages={gameState.chat} userTeam={user.team} onSend={onSendMessage} />
           </Card>
        </div>
      </div>

      <Modal isOpen={gameState.phase === 'RESULT'} backdrop="blur" hideCloseButton className="dark text-foreground bg-slate-950 border-2 border-green-500/50">
        <ModalContent>
          <ModalBody className="p-12 text-center flex flex-col items-center">
            <h2 className="text-slate-500 text-[10px] tracking-[0.5em] uppercase mb-4">Conflict Resolution</h2>
            <div className="text-4xl font-black text-green-400 italic uppercase mb-8">
              {gameState.winner === user.team ? 'SQUAD VICTORY' : 'SQUAD DEFEAT'}
            </div>
            <div className="w-full p-4 bg-slate-900/50 rounded-lg space-y-2 mb-6">
               <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>SERIES SCORE</span>
                  <span className="text-white">ALPHA {gameState.alphaScore} - {gameState.betaScore} BETA</span>
               </div>
            </div>
            <Progress size="sm" isIndeterminate color="success" className="w-32 mb-2"/>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
              {isFinalRound ? 'Finalizing Series' : `Next Round in ${timeLeft}s`}
            </span>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default GameArena;
