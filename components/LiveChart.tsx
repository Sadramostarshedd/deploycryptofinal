
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import { PricePoint, GamePhase } from '../types.ts';

interface LiveChartProps {
  data: PricePoint[];
  startPrice: number;
  phase: GamePhase;
}

const LiveChart: React.FC<LiveChartProps> = ({ data, startPrice, phase }) => {
  if (data.length < 2) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-700 text-xs animate-pulse">
        CALIBRATING FEED...
      </div>
    );
  }

  const prices = data.map(d => d.price);
  const min = Math.min(...prices, startPrice || prices[0]);
  const max = Math.max(...prices, startPrice || prices[0]);
  const padding = (max - min) * 0.1 || 10;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00ff41" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#00ff41" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="timestamp" 
          hide={true} 
        />
        <YAxis 
          domain={[min - padding, max + padding]} 
          hide={true}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '10px' }}
          itemStyle={{ color: '#00ff41' }}
          labelStyle={{ display: 'none' }}
          formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, 'PRICE']}
        />
        <Area 
          type="monotone" 
          dataKey="price" 
          stroke="#00ff41" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorPrice)"
          isAnimationActive={false}
        />
        {phase !== 'VOTING' && startPrice > 0 && (
          <ReferenceLine 
            y={startPrice} 
            stroke="#f59e0b" 
            strokeDasharray="3 3"
            label={{ 
              value: 'BATTLE START', 
              position: 'insideBottomRight', 
              fill: '#f59e0b', 
              fontSize: 8 
            }} 
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default LiveChart;
