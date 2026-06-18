import React from 'react';
import { format, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TideData, DailySolarData } from '../types';

export function TideChart({ data, displayedDate, currentTime, dailySolar }: { data: TideData[], displayedDate: Date, currentTime: Date, dailySolar?: DailySolarData[] }) {
  if (!data || data.length === 0) return <div>No data available</div>;

  const chartData = React.useMemo(() => {
    // Show selected day's data
    const start = startOfDay(displayedDate).getTime();
    const end = endOfDay(displayedDate).getTime();
    
    return data
      .filter(d => {
        const t = d.time.getTime();
        return t >= start && t <= end;
      })
      .map(d => ({
        timestamp: d.time.getTime(),
        height: d.height,
      }));
  }, [data, displayedDate]);

  const startTime = startOfDay(displayedDate).getTime();
  const endTime = endOfDay(displayedDate).getTime();
  const showCurrentTimeLine = isSameDay(currentTime, displayedDate);

  const solar = dailySolar?.find(s => s.date === format(displayedDate, 'yyyy-MM-dd'));
  const sunriseTime = solar ? solar.sunrise.getTime() : null;
  const sunsetTime = solar ? solar.sunset.getTime() : null;

  return (
    <div className="h-48 w-full mt-4 overflow-hidden pointer-events-auto relative">
      <div className="absolute inset-0 bg-teal-500/5 blur-3xl rounded-full pointer-events-none animate-pulse"></div>
      <div className="w-full h-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="timestamp" 
              type="number" 
              domain={[startTime, endTime]} 
              tickFormatter={(unixTime) => format(new Date(unixTime), 'HH:mm')}
              tickCount={7}
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              stroke="#94a3b8" 
            />
            <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', color: '#f8fafc' }}
              itemStyle={{ color: '#2dd4bf', fontWeight: 'bold' }}
              labelFormatter={(label) => format(new Date(label), 'HH:mm')}
            />
            {showCurrentTimeLine && (
              <ReferenceLine 
                x={currentTime.getTime()} 
                stroke="#38bdf8" 
                strokeDasharray="3 3" 
              />
            )}
            {sunriseTime && (
              <ReferenceLine x={sunriseTime} stroke="#fcd34d" strokeOpacity={0.5} strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: '🌅 Sunrise', fill: '#fcd34d', fontSize: 9 }} />
            )}
            {sunsetTime && (
              <ReferenceLine x={sunsetTime} stroke="#fb923c" strokeOpacity={0.5} strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Sunset 🌇', fill: '#fb923c', fontSize: 9 }} />
            )}
            <Area type="monotone" dataKey="height" stroke="#2DD4BF" strokeWidth={3} fillOpacity={1} fill="url(#colorHeight)" style={{ filter: 'drop-shadow(0px 0px 4px rgba(45,212,191,0.5))' }} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
