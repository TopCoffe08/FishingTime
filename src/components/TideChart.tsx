import React from 'react';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TideData } from '../types';

export function TideChart({ data, currentTime }: { data: TideData[], currentTime: Date }) {
  if (!data || data.length === 0) return <div>No data available</div>;

  const chartData = data.slice(0, 24).map(d => ({
    timeStr: format(d.time, 'HH:mm'),
    height: d.height,
    isCurrent: d.time.getHours() === currentTime.getHours()
  }));

  const currentIdx = chartData.findIndex(d => d.isCurrent);
  const currentLabel = currentIdx >= 0 ? chartData[currentIdx].timeStr : undefined;

  return (
    <div className="h-48 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="timeStr" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} stroke="#94a3b8" />
          <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', color: '#f8fafc' }}
            itemStyle={{ color: '#2dd4bf', fontWeight: 'bold' }}
          />
          {currentLabel && (
             <ReferenceLine x={currentLabel} stroke="#38bdf8" strokeDasharray="3 3" />
          )}
          <Area type="monotone" dataKey="height" stroke="#2DD4BF" strokeWidth={3} fillOpacity={1} fill="url(#colorHeight)" style={{ filter: 'drop-shadow(0px 0px 4px rgba(45,212,191,0.5))' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
