import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Plus, Download, BarChart2, UploadCloud, Clock, Edit3, X, MapPin, Droplets, Fish, Save } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CatchRecord, FishingLocation, TidePrediction, WeatherCondition } from '../../types';
import { compressImage } from '../../utils/image';

interface LogTabProps {
  logs: CatchRecord[];
  setLogs: React.Dispatch<React.SetStateAction<CatchRecord[]>>;
  location: FishingLocation;
  weather: WeatherCondition | null;
  tide: TidePrediction | null;
}

export const LogTab: React.FC<LogTabProps> = ({ logs, setLogs, location, weather, tide }) => {
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [newLogNotes, setNewLogNotes] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newSpecies, setNewSpecies] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [newLength, setNewLength] = useState('');
  const [newBait, setNewBait] = useState('');
  const [searchLog, setSearchLog] = useState('');

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fishing-log-${format(new Date(), 'yyyyMMdd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const header = 'Tanggal,Lokasi,Spesies,Berat(kg),Panjang(cm),Umpan,Cuaca,Pasang,Catatan';
    const rows = logs.map(l =>
      `"${l.date}","${l.location}","${l.species||''}","${l.weight||''}","${l.length||''}","${l.bait||''}","${l.weatherCondition||''}","${l.tideCondition||''}","${(l.notes||'').replace(/"/g, '""')}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fishing-log-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported: CatchRecord[] = JSON.parse(ev.target?.result as string);
        const existingIds = new Set(logs.map(l => l.id));
        const newLogs = imported.filter(l => !existingIds.has(l.id));
        setLogs([...logs, ...newLogs]);
        alert(`${newLogs.length} catatan berhasil diimpor.`);
      } catch (err) {
        alert('Format file tidak valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleEditLog = (log: CatchRecord) => {
    setEditingLogId(log.id);
    setNewLogNotes(log.notes);
    setNewSpecies(log.species || '');
    setNewWeight(log.weight ? String(log.weight) : '');
    setNewLength(log.length ? String(log.length) : '');
    setNewBait(log.bait || '');
    setNewPhotoUrl(log.photoUrl || '');
    setIsAddingLog(true);
  };

  const weightError = newWeight && (parseFloat(newWeight) <= 0 || parseFloat(newWeight) > 999) ? 'Berat harus antara 0.01 - 999 kg' : null;
  const lengthError = newLength && (parseFloat(newLength) <= 0 || parseFloat(newLength) > 500) ? 'Panjang harus antara 1 - 500 cm' : null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto md:mt-4">
      
      {!isAddingLog && logs.length === 0 && (
      <div className="bg-slate-800/30 px-6 py-16 rounded-[3rem] border border-slate-700/50 text-center flex flex-col items-center">
        <div className="w-24 h-24 bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl border border-slate-700 transform rotate-3">
          <BookOpen className="text-teal-500 opacity-80" size={48} />
        </div>
        <h2 className="text-xl font-black text-white mb-3">Jurnal Tangkapan (Catatan Personal)</h2>
        <p className="text-slate-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed font-medium">Catat spesies ikan, berat, umpan yang dipakai, cuaca riil saat ini, dan dokumentasi foto untuk setiap trip memancing.</p>
        <button 
          onClick={() => setIsAddingLog(true)}
          className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-black py-4 px-8 rounded-3xl shadow-xl shadow-teal-500/20 uppercase tracking-[0.2em] text-xs transition-colors flex items-center gap-2">
          <Plus size={16} /> Tambah Catatan
        </button>
      </div>
    )}

    {!isAddingLog && logs.length > 0 && (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-3">
          <h2 className="text-lg font-black text-white px-2">Jurnal Tangkapan Saya</h2>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Cari catatan..." 
              value={searchLog}
              onChange={(e) => setSearchLog(e.target.value)}
              className="flex-1 min-w-[120px] bg-slate-900/60 border border-slate-700/50 text-slate-100 text-xs font-medium rounded-xl px-3 py-2 outline-none focus:border-teal-500"
            />
            <button onClick={handleExportJSON} title="Export JSON" className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition">
                <Download size={16} />
            </button>
            <button onClick={handleExportCSV} title="Export CSV" className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition">
                <BarChart2 size={16} />
            </button>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" id="import-json" />
            <label htmlFor="import-json" title="Import JSON" className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition cursor-pointer">
              <UploadCloud size={16} />
            </label>
            <button 
              onClick={() => setIsAddingLog(true)}
              className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 font-bold py-2 px-3 sm:px-4 rounded-xl text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shrink-0">
              <Plus size={14} /> <span className="hidden sm:inline">Tambah Catatan</span> <span className="sm:hidden">Tambah</span>
            </button>
          </div>
        </div>
        
        {logs.slice().reverse()
          .filter(log => log.notes.toLowerCase().includes(searchLog.toLowerCase()) || log.location.toLowerCase().includes(searchLog.toLowerCase()))
          .map(log => (
          <div key={log.id} className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700 relative group overflow-hidden">
            <div className="mb-3 flex justify-between items-start">
              <div className="text-xs text-slate-400 font-bold flex items-center gap-2">
                <Clock size={12} className="text-teal-400" /> {log.date}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEditLog(log)}
                  className="text-slate-500 hover:text-teal-400 transition-colors"
                  title="Edit Catatan"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => setLogs(logs.filter(l => l.id !== log.id))}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                  title="Hapus Catatan"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            {log.photoUrl && (
              <div className="my-4 rounded-2xl overflow-hidden border border-slate-700 aspect-video w-full bg-slate-900 flex items-center justify-center relative">
                <img src={log.photoUrl} alt="Tangkapan" className="w-full h-full object-cover" onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%23334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
                }} />
              </div>
            )}
            <div className="text-sm text-slate-400 font-medium mb-2 flex flex-col gap-1">
              <span className="flex items-center gap-2 text-slate-300">
                <MapPin size={14} className="text-emerald-400" /> {log.location}
              </span>
              {(log.weatherCondition || log.tideCondition) && (
                <span className="flex items-center gap-2 text-slate-400 text-xs">
                  <Droplets size={12} className="text-blue-400" /> {log.weatherCondition || '-'} • {log.tideCondition || '-'}
                </span>
              )}
              {(log.species || log.weight || log.length) && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {log.species && <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2 py-1 rounded-[6px] uppercase tracking-wider">{log.species}</span>}
                  {log.weight && <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-1 rounded-[6px]">{log.weight} kg</span>}
                  {log.length && <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-1 rounded-[6px]">{log.length} cm</span>}
                </div>
              )}
              {log.bait && (
                <span className="flex items-center gap-2 text-amber-400/80 mt-1 text-xs font-bold">
                  🎯 Umpan: <span className="text-amber-400">{log.bait}</span>
                </span>
              )}
            </div>
            <p className="font-medium text-slate-200 mt-3 whitespace-pre-wrap">{log.notes}</p>
          </div>
        ))}
      </div>
    )}

      {isAddingLog && (
      <div className="bg-slate-800/80 p-5 md:p-8 rounded-[2rem] border border-slate-700 shadow-xl">
        <h2 className="text-lg font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
          <BookOpen className="text-teal-400" /> {editingLogId ? 'Edit Catatan' : 'Catat Hasil Tangkapan'}
        </h2>
        
        <div className="flex flex-col gap-5">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Lokasi Memancing Saat Ini</label>
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 text-slate-300 font-bold text-sm">
              {location.name}
            </div>
          </div>
          
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-2 lg:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Spesies Ikan</label>
                <input 
                  type="text"
                  value={newSpecies}
                  onChange={(e) => setNewSpecies(e.target.value)}
                  placeholder="Jumbo Kakap, Patin..."
                  className="w-full h-12 bg-slate-900/80 border border-slate-700/50 text-slate-100 text-sm font-medium rounded-xl focus:ring-teal-500 focus:border-teal-500 block px-4 placeholder-slate-600 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Berat (kg)</label>
                <input 
                  type="number"
                  step="0.1"
                  min="0.01"
                  max="999"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="0.0"
                  className="w-full h-12 bg-slate-900/80 border border-slate-700/50 text-slate-100 text-sm font-medium rounded-xl focus:ring-teal-500 focus:border-teal-500 block px-4 placeholder-slate-600 outline-none"
                />
                {weightError && <p className="text-red-400 mt-1 text-[10px]">{weightError}</p>}
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Panjang (cm)</label>
                <input 
                  type="number"
                  step="1"
                  min="1"
                  max="500"
                  value={newLength}
                  onChange={(e) => setNewLength(e.target.value)}
                  placeholder="0"
                  className="w-full h-12 bg-slate-900/80 border border-slate-700/50 text-slate-100 text-sm font-medium rounded-xl focus:ring-teal-500 focus:border-teal-500 block px-4 placeholder-slate-600 outline-none"
                />
                {lengthError && <p className="text-red-400 mt-1 text-[10px]">{lengthError}</p>}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Umpan Yang Digunakan</label>
              <input 
                type="text"
                value={newBait}
                onChange={(e) => setNewBait(e.target.value)}
                placeholder="Udang Hidup, Cacing Merah..."
                className="w-full h-12 bg-slate-900/80 border border-slate-700/50 text-slate-100 text-sm font-medium rounded-xl focus:ring-teal-500 focus:border-teal-500 block px-4 placeholder-slate-600 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center justify-between">
                <span>Laporan/Catatan Tambahan</span>
              </label>
              <textarea 
                value={newLogNotes}
                onChange={(e) => setNewLogNotes(e.target.value)}
                placeholder="Tangkapan lumayan hari ini..."
                className="w-full h-24 bg-slate-900/80 border border-slate-700/50 text-slate-100 text-sm font-medium rounded-2xl focus:ring-teal-500 focus:border-teal-500 block p-4 placeholder-slate-600 resize-none outline-none"
              ></textarea>
            </div>
          
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center justify-between">
              <span>Lampirkan Foto Hasil</span>
              <span className="text-[8px] sm:text-[10px] opacity-75 font-normal normal-case">(Opsional) Pilih gambar</span>
            </label>
            <input 
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    const compressed = await compressImage(file);
                    setNewPhotoUrl(compressed);
                  } catch (err) {
                    console.error("Failed to compress image", err);
                  }
                }
              }}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-3 file:px-4 file:rounded-[12px] file:border-0 file:text-xs file:font-black file:uppercase file:tracking-wider file:bg-slate-700 file:text-teal-400 hover:file:bg-slate-600 file:transition-colors bg-slate-900/50 p-1.5 rounded-xl border border-slate-700/50"
            />
            {newPhotoUrl && (
              <div className="mt-4 rounded-xl border border-teal-500/30 overflow-hidden relative group max-w-sm">
                <img src={newPhotoUrl} className="w-full object-cover" />
                <button 
                  onClick={() => setNewPhotoUrl('')}
                  className="absolute top-2 right-2 bg-slate-900/80 p-1 rounded-full text-red-500 hover:text-red-400"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 mt-4">
            <button 
              onClick={() => {
                setIsAddingLog(false);
                setEditingLogId(null);
                setNewLogNotes('');
                setNewPhotoUrl('');
                setNewSpecies('');
                setNewWeight('');
                setNewLength('');
                setNewBait('');
              }}
              className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-white font-bold py-3.5 rounded-2xl border border-slate-600/50 transition-colors text-xs uppercase tracking-wider"
            >
              Batal
            </button>
            <button 
              onClick={() => {
                if (!newLogNotes.trim() || weightError || lengthError) return;
                
                if (editingLogId) {
                  setLogs((prev: CatchRecord[]) => prev.map((l: CatchRecord) => l.id === editingLogId ? {
                    ...l,
                    notes: newLogNotes,
                    photoUrl: newPhotoUrl.trim() || undefined,
                    species: newSpecies.trim() || undefined,
                    weight: parseFloat(newWeight) || undefined,
                    length: parseFloat(newLength) || undefined,
                    bait: newBait.trim() || undefined,
                  } : l));
                  setEditingLogId(null);
                } else {
                  const newLog = {
                    id: Date.now().toString(),
                    date: format(new Date(), 'dd MMM yyyy, HH:mm', { locale: idLocale }),
                    location: location.name,
                    notes: newLogNotes,
                    photoUrl: newPhotoUrl.trim() || undefined,
                    species: newSpecies.trim() || undefined,
                    weight: parseFloat(newWeight) || undefined,
                    length: parseFloat(newLength) || undefined,
                    bait: newBait.trim() || undefined,
                    weatherCondition: weather ? `${weather.description}, ${weather.temperature}°C` : undefined,
                    tideCondition: tide ? tide.status : undefined
                  };
                  setLogs((prev: CatchRecord[]) => [...prev, newLog]);
                }
                
                setNewLogNotes('');
                setNewPhotoUrl('');
                setNewSpecies('');
                setNewWeight('');
                setNewLength('');
                setNewBait('');
                setIsAddingLog(false);
              }}
              disabled={!newLogNotes.trim() || !!weightError || !!lengthError}
              className="flex-1 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:hover:bg-teal-500 text-slate-900 font-black py-3.5 rounded-2xl shadow-lg shadow-teal-500/20 transition-colors text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Save size={16} /> Simpan
            </button>
          </div>
        </div>
      </div>
        )}
    </div>
  );
};
