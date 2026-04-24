'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, CheckCircle2, Search, RotateCcw, LayoutGrid, Info } from 'lucide-react';
import { TEAMS, type Team } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function AlbumPage() {
  const [owned, setOwned] = useState<Record<string, boolean>>({});
  const [selectedTeamId, setSelectedTeamId] = useState<string>(TEAMS[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage
  useEffect(() => {
    const loadData = () => {
      const saved = localStorage.getItem('world_cup_album_v1');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setOwned(parsed);
        } catch (e) {
          console.error('Failed to parse saved stickers', e);
        }
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('world_cup_album_v1', JSON.stringify(owned));
    }
  }, [owned, isLoaded]);

  const toggleSticker = (teamCode: string, num: number) => {
    const key = `${teamCode}-${num}`;
    setOwned(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const resetAll = () => {
    if (confirm('Tem certeza que deseja resetar todo o seu álbum?')) {
      setOwned({});
    }
  };

  const totalOwnedCount = Object.values(owned).filter(val => val).length;
  const totalStickersCount = TEAMS.length * 20;
  const completionPercentage = Math.round((totalOwnedCount / totalStickersCount) * 100);

  const filteredTeams = TEAMS.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    team.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTeamProgress = (teamCode: string) => {
    let count = 0;
    for (let i = 1; i <= 20; i++) {
      if (owned[`${teamCode}-${i}`]) count++;
    }
    return count;
  };

  const selectedTeam = TEAMS.find(t => t.id === selectedTeamId) || TEAMS[0];
  const selectedTeamProgress = getTeamProgress(selectedTeam.shortName);

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="text-indigo-500 w-5 h-5" />
            <h1 className="text-lg font-bold tracking-tight uppercase">Album Pro 2026</h1>
          </div>
          <p className="text-slate-500 text-[10px] mt-1 italic uppercase tracking-wider">Sticker Tracking System v2.0</p>
        </div>

        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search teams..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-slate-800/20">
          <div className="px-6 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Selections</div>
          <div className="space-y-0.5">
            {filteredTeams.map((team) => {
              const isActive = selectedTeamId === team.id;
              const progress = getTeamProgress(team.shortName);
              
              return (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  className={cn(
                    "w-full flex items-center px-6 py-3 transition-colors text-left group",
                    isActive 
                      ? "bg-indigo-600/20 border-l-4 border-indigo-500 text-white" 
                      : "hover:bg-slate-800/50 text-slate-400 border-l-4 border-transparent hover:text-slate-200"
                  )}
                >
                  <span className="w-6 h-4 rounded-sm mr-3 flex items-center justify-center text-[8px] font-bold bg-slate-800 group-hover:bg-slate-700">
                    {team.flag}
                  </span>
                  <span className="text-sm font-medium truncate">{team.name}</span>
                  <span className={cn(
                    "ml-auto text-[10px] font-mono",
                    isActive ? "text-indigo-400" : "text-slate-600"
                  )}>
                    {progress.toString().padStart(2, '0')}/20
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 bg-slate-950 border-t border-slate-800">
          <div className="flex justify-between items-end mb-2">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tight text-white/50">Global Progress</div>
            <div className="text-xs font-mono text-indigo-400">{completionPercentage}%</div>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              className="h-full bg-indigo-500"
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-500">
            <span>{totalOwnedCount} COLLECTED</span>
            <span>{totalStickersCount} TOTAL</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-32 bg-white border-b border-slate-200 flex items-center px-10 shrink-0">
          <div className="text-5xl mr-6 filter drop-shadow-sm select-none">
            {selectedTeam.flag}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase truncate">
                {selectedTeam.name}
              </h2>
              <span className="px-2 py-1 bg-slate-100 rounded text-slate-500 font-mono text-sm border border-slate-200 shrink-0">
                {selectedTeam.shortName}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2 truncate">
              <Info className="w-3.5 h-3.5" />
              FIFA World Cup 2026 • Group Section • Collection Status
            </p>
          </div>
          <div className="ml-auto flex gap-6 pl-6 shrink-0">
            <div className="text-right">
              <div className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Progress</div>
              <div className="text-2xl font-mono font-bold text-indigo-600">
                {selectedTeamProgress.toString().padStart(2, '0')}/20
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200 self-center"></div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Remaining</div>
              <div className="text-2xl font-mono font-bold text-red-500">
                {(20 - selectedTeamProgress).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </header>

        {/* Sticker Grid */}
        <main className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
              const isOwned = owned[`${selectedTeam.shortName}-${num}`];
              const stickerCode = `${selectedTeam.shortName} ${num.toString().padStart(2, '0')}`;
              
              return (
                <button
                  key={num}
                  onClick={() => toggleSticker(selectedTeam.shortName, num)}
                  className={cn(
                    "aspect-[3/4] rounded-lg shadow-sm relative group flex flex-col transition-all duration-200 text-left cursor-pointer",
                    isOwned 
                      ? "bg-white border-2 border-indigo-500 shadow-indigo-100/50 scale-[1.02]" 
                      : "bg-white border border-slate-200 opacity-60 grayscale-[0.5] border-dashed hover:opacity-100 hover:grayscale-0 hover:border-indigo-300"
                  )}
                >
                  {isOwned && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[10px] shadow-sm z-10"
                    >
                      ✓
                    </motion.div>
                  )}
                  
                  <div className="flex-1 flex items-center justify-center flex-col p-4">
                    <div className={cn(
                        "text-xl font-black font-mono transition-colors",
                        isOwned ? "text-slate-900" : "text-slate-300"
                    )}>
                      {stickerCode}
                    </div>
                    <div className={cn(
                        "text-[10px] uppercase font-bold mt-1 tracking-tight text-center",
                        isOwned ? "text-slate-400" : "text-slate-200"
                    )}>
                      {num === 1 ? 'Escudo Oficial' : num === 20 ? 'Foto do Time' : 'Jogador'}
                    </div>
                  </div>

                  <div className={cn(
                    "h-2 w-full rounded-b-[6px] transition-colors",
                    isOwned ? "bg-indigo-500" : "bg-slate-100"
                  )}></div>

                  {/* Hover effect for missing stickers */}
                  {!isOwned && (
                    <div className="absolute inset-0 bg-indigo-600/0 hover:bg-indigo-600/5 transition-colors rounded-lg flex items-center justify-center opacity-0 hover:opacity-100">
                      <span className="bg-indigo-600 text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">Collect</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </main>

        {/* Footer Area */}
        <footer className="bg-white h-14 border-t border-slate-200 flex items-center px-10 text-[10px] uppercase tracking-widest text-slate-500 font-bold shrink-0">
          <div className="flex gap-8">
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mr-2"></div> 
              Collected
            </div>
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 bg-white border border-slate-300 rounded-full mr-2"></div> 
              Missing
            </div>
            <div className="hidden sm:flex items-center">
              <LayoutGrid className="w-3.5 h-3.5 mr-2 text-slate-400" />
              {selectedTeam.name} Collection
            </div>
          </div>
          
          <div className="ml-auto flex gap-3">
            <button 
              onClick={resetAll}
              className="px-4 py-1.5 bg-white border border-slate-200 rounded text-slate-400 hover:text-red-500 hover:border-red-200 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-3 h-3" />
              Reset System
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <div className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-400 select-none">
              v2.0.4 - Production
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
