
import React, { useState, useRef, useEffect } from 'react';
import { CardHeader, Divider, Button, Input, ScrollShadow } from '@heroui/react';
import { ChatMessage, Team } from '../types.ts';
import { Send } from 'lucide-react';

interface ChatBoxProps {
  messages: ChatMessage[];
  userTeam: Team;
  onSend: (text: string) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, userTeam, onSend }) => {
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  const filteredMessages = messages.filter(m => m.team === userTeam);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-950/40">
      <CardHeader className="flex flex-row justify-between items-center px-4 py-3 shrink-0 bg-slate-900/50">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Secure Team Uplink</h4>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[8px] text-green-600 font-bold uppercase tracking-widest">Encrypted</span>
        </div>
      </CardHeader>
      
      <Divider className="bg-slate-800" />
      
      <ScrollShadow 
        ref={scrollRef}
        className="flex-1 p-4 space-y-4"
        hideScrollBar
      >
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
            <span className="text-[10px] font-black uppercase tracking-widest">Silent Sector</span>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
              <div className="flex gap-2 items-center mb-1">
                <span className={`text-[9px] font-black uppercase tracking-widest ${msg.team === 'ALPHA' ? 'text-primary' : 'text-purple-400'}`}>
                  {msg.sender}
                </span>
                <span className="text-[8px] text-slate-600 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-slate-300 break-words leading-relaxed pl-1 border-l border-slate-800/50">
                {msg.text}
              </p>
            </div>
          ))
        )}
      </ScrollShadow>

      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900 shrink-0">
        <Input 
          size="sm"
          variant="flat"
          placeholder="TYPE_MESSAGE..."
          value={text}
          onValueChange={setText}
          classNames={{
            input: "text-xs font-mono uppercase text-green-400",
            inputWrapper: "bg-black border border-slate-800 rounded-lg group-data-[focus=true]:border-green-500/50"
          }}
          endContent={
            <Button 
              isIconOnly 
              size="sm" 
              type="submit" 
              variant="light" 
              color="success"
              className="min-w-0 h-6 w-6"
            >
              <Send size={14} />
            </Button>
          }
        />
      </form>
    </div>
  );
};

export default ChatBox;
