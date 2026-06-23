import React from 'react';
import { Activity, Moon } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface SolunarTableProps {
  solunar: any;
  displayedDate: Date;
}

export const SolunarTable: React.FC<SolunarTableProps> = ({ solunar, displayedDate }) => {
  if (!solunar) return null;

  return (
    <div className="bg-slate-800/30 p-5 sm:p-6 md:p-8 rounded-[2.5rem] border border-slate-700/50">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="text-amber-400"><Activity size={20} /></span>
          <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-300">Tabel Solunar Harian</h3>
        </div>
        <div className="text-[9px] md:text-[10px] text-slate-300 uppercase font-black px-3 py-1 bg-slate-900/50 rounded-full border border-slate-700">
          {format(displayedDate, 'dd MMM yyyy', { locale: idLocale })}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Major Periods */}
        <div className="bg-slate-800/50 p-4 rounded-[1.5rem] border border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Activity size={80} />
          </div>
          <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Waktu Utama (Major)
          </h4>
          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-[10px] text-white/75 uppercase tracking-widest mb-1 font-bold">Transit Atas (Bulan di Puncak)</p>
              <p className="font-bold text-slate-100">
                {solunar.major1 ? `${format(solunar.major1.start, 'HH:mm')} - ${format(solunar.major1.end, 'HH:mm')}` : 'Tidak Ada'}
              </p>
            </div>
            <div className="h-px w-full bg-slate-700/50"></div>
            <div>
              <p className="text-[10px] text-white/75 uppercase tracking-widest mb-1 font-bold">Transit Bawah (Bulan di Bawah)</p>
              <p className="font-bold text-slate-100">
                {solunar.major2 ? `${format(solunar.major2.start, 'HH:mm')} - ${format(solunar.major2.end, 'HH:mm')}` : 'Tidak Ada'}
              </p>
            </div>
          </div>
        </div>

        {/* Minor Periods */}
        <div className="bg-slate-800/50 p-4 rounded-[1.5rem] border border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Moon size={80} />
          </div>
          <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span> Waktu Minor
          </h4>
          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-[10px] text-white/75 uppercase tracking-widest mb-1 font-bold">Terbit Bulan (Moonrise)</p>
              <p className="font-bold text-slate-100">
                {solunar.minor1 ? `${format(solunar.minor1.start, 'HH:mm')} - ${format(solunar.minor1.end, 'HH:mm')}` : 'Tidak Ada'}
              </p>
            </div>
            <div className="h-px w-full bg-slate-700/50"></div>
            <div>
              <p className="text-[10px] text-white/75 uppercase tracking-widest mb-1 font-bold">Terbenam Bulan (Moonset)</p>
              <p className="font-bold text-slate-100">
                {solunar.minor2 ? `${format(solunar.minor2.start, 'HH:mm')} - ${format(solunar.minor2.end, 'HH:mm')}` : 'Tidak Ada'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
