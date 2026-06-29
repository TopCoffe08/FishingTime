import React, { useState, useMemo } from 'react';
import { TrendingUp, BarChart2, MapPin, Fish } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CatchRecord } from '../../types';

interface EvaluasiTabProps {
  logs: CatchRecord[];
}

const BULAN_ID: Record<string, string> = {
  'Jan':'Jan','Feb':'Feb','Mar':'Mar','Apr':'Apr',
  'Mei':'May','Jun':'Jun','Jul':'Jul','Agu':'Aug',
  'Sep':'Sep','Okt':'Oct','Nov':'Nov','Des':'Dec'
};

function parseLogDate(dateStr: string): Date {
  try {
    const parts = dateStr.split(',')[0].trim().split(' ');
    if (parts.length >= 3) {
      const mon = BULAN_ID[parts[1]] || parts[1];
      return new Date(`${parts[0]} ${mon} ${parts[2]}`);
    }
  } catch (e) {}
  return new Date();
}

export const EvaluasiTab: React.FC<EvaluasiTabProps> = ({ logs }) => {
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const resetFilter = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setDateFrom(d.toISOString().split('T')[0]);
    setDateTo(new Date().toISOString().split('T')[0]);
  };

  const filteredLogs = useMemo(() => {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);

    return logs.filter(log => {
      const logDate = parseLogDate(log.date);
      return logDate >= from && logDate <= to;
    });
  }, [logs, dateFrom, dateTo]);

  // Chart 1: Catch By Month (dari filteredLogs)
  const chart1Data = useMemo(() => {
    const catchByMonth = filteredLogs.reduce((acc, log) => {
      const parts = log.date.split(' ');
      if (parts.length >= 3) {
        const month = parts[1] + ' ' + parts[2].replace(',', '');
        acc[month] = (acc[month] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(catchByMonth)
      .map(([month, count]) => ({ month, count }))
      .slice(-6);
  }, [filteredLogs]);

  // Chart 2: Top 5 Species by Weight
  const chart2Data = useMemo(() => {
    const speciesWeight = filteredLogs.reduce((acc, log) => {
      if (log.species && log.weight) {
        const sp = log.species.toLowerCase();
        acc[sp] = (acc[sp] || 0) + log.weight;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(speciesWeight)
      .map(([species, weight]) => ({ species, weight: Number((weight as number).toFixed(1)) }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
  }, [filteredLogs]);

  // Chart 3: Top 5 Baits by Count
  const chart3Data = useMemo(() => {
    const baitCount = filteredLogs.reduce((acc, log) => {
      if (log.bait) {
        const b = log.bait.toLowerCase();
        acc[b] = (acc[b] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(baitCount)
      .map(([bait, count]) => ({ bait, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredLogs]);

  // Stats: Rata-rata Berat & Berat Terbesar
  const { avgWeight, maxWeightInfo } = useMemo(() => {
    let totalWeight = 0;
    let count = 0;
    let maxW = 0;
    let maxSpecies = '-';

    filteredLogs.forEach(log => {
      if (log.weight) {
        totalWeight += log.weight;
        count++;
        if (log.weight > maxW) {
          maxW = log.weight;
          maxSpecies = log.species || 'Tidak Diketahui';
        }
      }
    });

    return {
      avgWeight: count > 0 ? (totalWeight / count).toFixed(1) : '0',
      maxWeightInfo: count > 0 ? { weight: maxW, species: maxSpecies } : null
    };
  }, [filteredLogs]);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-slate-800/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center">
              <TrendingUp className="text-teal-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-200">Monitoring & Evaluasi</h2>
              <p className="text-sm text-slate-400">Ringkasan statistik dari rekaman memancing Anda</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-700/50 flex-wrap sm:flex-nowrap">
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent text-slate-200 text-sm outline-none px-2 cursor-pointer w-full sm:w-auto"
            />
            <span className="text-slate-500">-</span>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent text-slate-200 text-sm outline-none px-2 cursor-pointer w-full sm:w-auto"
            />
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <BarChart2 size={48} className="mx-auto mb-4 opacity-20" />
            Belum ada data jurnal untuk dievaluasi.
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 flex flex-col items-center">
            <BarChart2 size={48} className="mx-auto mb-4 opacity-20" />
            <p className="mb-4">Tidak ada tangkapan dalam periode {dateFrom} - {dateTo}</p>
            <button onClick={resetFilter} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm transition-colors">
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-slate-900/40 p-5 sm:p-6 rounded-[2rem] border border-slate-700">
              <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-4">Total Tangkapan Tercatat</h3>
              <p className="text-3xl sm:text-4xl font-black text-teal-400">{filteredLogs.length}</p>
              <p className="text-xs text-slate-400 mt-2">Sesi memancing didokumentasikan</p>
            </div>
            
            <div className="bg-slate-900/40 p-5 sm:p-6 rounded-[2rem] border border-slate-700">
              <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-4">Spesies Terbanyak</h3>
              <p className="text-xl sm:text-2xl font-bold text-slate-200 capitalize">
                {
                  Object.entries(
                    filteredLogs.reduce((acc, log) => {
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
                      filteredLogs.reduce((acc, log) => {
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

            {/* Tambahan Statistik Baru */}
            <div className="bg-slate-900/40 p-5 sm:p-6 rounded-[2rem] border border-slate-700">
              <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-4">Rata-rata Berat</h3>
              <p className="text-xl sm:text-2xl font-bold text-slate-200">
                {avgWeight} <span className="text-sm text-slate-500">kg</span>
              </p>
              <p className="text-xs text-slate-400 mt-2">Rata-rata dari data dengan berat</p>
            </div>

            <div className="bg-slate-900/40 p-5 sm:p-6 rounded-[2rem] border border-slate-700">
              <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-4">Berat Terbesar</h3>
              <p className="text-xl sm:text-2xl font-bold text-slate-200">
                {maxWeightInfo ? `${maxWeightInfo.weight} ` : '-'}
                {maxWeightInfo && <span className="text-sm text-slate-500">kg</span>}
              </p>
              <p className="text-xs text-slate-400 mt-2 capitalize">{maxWeightInfo ? maxWeightInfo.species : 'Belum Ada Data'}</p>
            </div>

            {chart1Data.length > 0 && (
              <div className="md:col-span-2 bg-slate-900/40 p-5 sm:p-6 rounded-[2rem] border border-slate-700 mt-4">
                 <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Grafik Tangkapan Terakhir</h3>
                 <div className="h-[250px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={chart1Data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                       <XAxis dataKey="month" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                       <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                       <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', color: '#f8fafc', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#2dd4bf' }} />
                       <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
              </div>
            )}

            {chart2Data.length > 0 && (
              <div className="md:col-span-2 bg-slate-900/40 p-5 sm:p-6 rounded-[2rem] border border-slate-700 mt-4">
                 <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Berat Tangkapan per Spesies (Top 5)</h3>
                 <div className="h-[250px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart layout="vertical" data={chart2Data} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                       <XAxis type="number" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                       <YAxis type="category" dataKey="species" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} width={80} style={{ textTransform: 'capitalize' }} />
                       <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', color: '#f8fafc', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#f59e0b' }} formatter={(value: number) => [`${value} kg`, 'Total Berat']} />
                       <Bar dataKey="weight" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
              </div>
            )}

            {chart3Data.length > 0 && (
              <div className="md:col-span-2 bg-slate-900/40 p-5 sm:p-6 rounded-[2rem] border border-slate-700 mt-4">
                 <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Umpan Paling Ampuh (Top 5)</h3>
                 <div className="h-[250px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={chart3Data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                       <XAxis dataKey="bait" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} style={{ textTransform: 'capitalize' }} />
                       <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                       <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', color: '#f8fafc', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#818cf8' }} />
                       <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={50} />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

