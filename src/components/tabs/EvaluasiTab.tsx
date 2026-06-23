import React from 'react';
import { TrendingUp, BarChart2, MapPin, Fish } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CatchRecord } from '../../types';

interface EvaluasiTabProps {
  logs: CatchRecord[];
}

export const EvaluasiTab: React.FC<EvaluasiTabProps> = ({ logs }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-slate-800/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center">
            <TrendingUp className="text-teal-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-200">Monitoring & Evaluasi</h2>
            <p className="text-sm text-slate-400">Ringkasan statistik dari rekaman memancing Anda</p>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <BarChart2 size={48} className="mx-auto mb-4 opacity-20" />
            Belum ada data jurnal untuk dievaluasi.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-slate-900/40 p-5 sm:p-6 rounded-[2rem] border border-slate-700">
              <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-4">Total Tangkapan Tercatat</h3>
              <p className="text-3xl sm:text-4xl font-black text-teal-400">{logs.length}</p>
              <p className="text-xs text-slate-400 mt-2">Sesi memancing didokumentasikan</p>
            </div>
            
            <div className="bg-slate-900/40 p-5 sm:p-6 rounded-[2rem] border border-slate-700">
              <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-4">Spesies Terbanyak</h3>
              <p className="text-xl sm:text-2xl font-bold text-slate-200 capitalize">
                {
                  Object.entries(
                    logs.reduce((acc, log) => {
                      if (log.species) {
                        acc[log.species.toLowerCase()] = (acc[log.species.toLowerCase()] || 0) + 1;
                      }
                      return acc;
                    }, {} as Record<string, number>)
                  ).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || '-'
                }
              </p>
              <p className="text-xs text-slate-400 mt-2">Paling sering ditangkap</p>
            </div>

            <div className="bg-slate-900/40 p-5 sm:p-6 rounded-[2rem] border border-slate-700 md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div>
                 <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-4">Lokasi Paling Produktif</h3>
                 <p className="text-lg sm:text-xl font-bold text-slate-200">
                  {
                    Object.entries(
                      logs.reduce((acc, log) => {
                        if (log.location) {
                          acc[log.location] = (acc[log.location] || 0) + 1;
                        }
                        return acc;
                      }, {} as Record<string, number>)
                    ).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || 'Belum Ada'
                  }
                </p>
                <p className="text-xs text-slate-400 mt-2">Spot dengan riwayat tangkapan terbanyak</p>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                 <MapPin className="text-amber-400" size={24} />
               </div>
            </div>

            <div className="bg-slate-900/40 p-5 sm:p-6 rounded-[2rem] border border-slate-700 md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div>
                 <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-4">Umpan Paling Ampuh</h3>
                 <p className="text-lg sm:text-xl font-bold text-slate-200 capitalize">
                  {
                    Object.entries(
                      logs.reduce((acc, log) => {
                        if (log.bait) {
                          acc[log.bait.toLowerCase()] = (acc[log.bait.toLowerCase()] || 0) + 1;
                        }
                        return acc;
                      }, {} as Record<string, number>)
                    ).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || 'Belum Ada Data'
                  }
                </p>
                <p className="text-xs text-slate-400 mt-2">Umpan yang paling sering menghasilkan tangkapan</p>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0">
                 <Fish className="text-orange-400" size={24} />
               </div>
            </div>

            {(() => {
              const catchByMonth = logs.reduce((acc, log) => {
                const parts = log.date.split(' ');
                if (parts.length >= 3) {
                  const month = parts[1] + ' ' + parts[2].replace(',', '');
                  acc[month] = (acc[month] || 0) + 1;
                }
                return acc;
              }, {} as Record<string, number>);

              const chartData = Object.entries(catchByMonth)
                .map(([month, count]) => ({ month, count }))
                .slice(-6);

              return (
                <div className="md:col-span-2 bg-slate-900/40 p-5 sm:p-6 rounded-[2rem] border border-slate-700 mt-4">
                   <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Grafik Tangkapan Terakhir</h3>
                   <div className="h-[250px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                         <XAxis dataKey="month" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                         <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                         <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', color: '#f8fafc', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#2dd4bf' }} />
                         <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
