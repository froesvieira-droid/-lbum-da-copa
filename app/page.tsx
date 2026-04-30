'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, CheckCircle2, Search, RotateCcw, LayoutGrid, Info, Menu, X, Star, User, Image as ImageIcon, Download } from 'lucide-react';
import { TEAMS, type Team } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AlbumPage() {
  const isMobile = useIsMobile();
  const [owned, setOwned] = useState<Record<string, boolean>>({});
  const [selectedTeamId, setSelectedTeamId] = useState<string>(TEAMS[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const exportMissingToCSV = () => {
    const missing: string[][] = [['Time', 'Codigo', 'Tipo', 'Raridade']];
    
    TEAMS.forEach(team => {
      for (let i = 1; i <= 20; i++) {
        if (!owned[`${team.shortName}-${i}`]) {
          const code = `${team.shortName} ${i.toString().padStart(2, '0')}`;
          const isRare = i === 1 || i === 20;
          const type = team.shortName === 'FWC' 
            ? (i === 1 ? 'Troféu' : i === 20 ? 'Mascote' : 'Especial')
            : (i === 1 ? 'Escudo' : i === 20 ? 'Time' : 'Jogador');
          
          missing.push([team.name, code, type, isRare ? 'Rara' : 'Comum']);
        }
      }
    });

    const csvContent = "\uFEFF" + missing.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `figurinhas_faltantes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const isRareSticker = (num: number) => num === 1 || num === 20;

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans relative">
      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col border-r border-slate-800 transition-transform duration-300 transform lg:translate-x-0 lg:static shrink-0",
        isMobile && !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="text-indigo-500 w-5 h-5" />
            <h1 className="text-lg font-bold tracking-tight uppercase">Album Pro 2026</h1>
          </div>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500">
              <X className="w-6 h-6" />
            </button>
          )}
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

        <div className="flex-1 overflow-y-auto py-2 scrollbar-none">
          <div className="px-6 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Selections</div>
          <div className="space-y-0.5">
            {filteredTeams.map((team) => {
              const isActive = selectedTeamId === team.id;
              const progress = getTeamProgress(team.shortName);
              
              return (
                <button
                  key={team.id}
                  onClick={() => {
                    setSelectedTeamId(team.id);
                    if (isMobile) setIsSidebarOpen(false);
                  }}
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
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header / Navbar */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 shrink-0 justify-between">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-600"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedTeam.flag}</span>
            <span className="font-bold uppercase tracking-tight">{selectedTeam.name}</span>
          </div>
          
          <div className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-[10px] font-mono font-bold text-indigo-600">
             {completionPercentage}%
          </div>
        </header>

        {/* Desktop Team Header */}
        <header className="hidden lg:flex h-32 bg-white border-b border-slate-200 items-center px-10 shrink-0">
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
        <main className="flex-1 overflow-y-auto p-4 lg:p-10 bg-slate-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-6">
            {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
              const isOwned = owned[`${selectedTeam.shortName}-${num}`];
              const stickerCode = `${selectedTeam.shortName} ${num.toString().padStart(2, '0')}`;
              const isRare = isRareSticker(num);
              
              return (
                <motion.button
                  key={num}
                  layout
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSticker(selectedTeam.shortName, num)}
                  className={cn(
                    "aspect-[3/4] rounded-lg shadow-sm relative group flex flex-col transition-all duration-300 text-left cursor-pointer overflow-hidden",
                    isOwned 
                      ? isRare 
                        ? "bg-gradient-to-br from-amber-50 to-white border-2 border-amber-400 shadow-amber-200/50 scale-[1.02] ring-2 ring-amber-100 ring-offset-1" 
                        : "bg-white border-2 border-indigo-500 shadow-indigo-100/50 scale-[1.02]" 
                      : isRare 
                        ? "bg-white border border-amber-200 opacity-70 grayscale-[0.3] border-dashed hover:opacity-100 hover:grayscale-0 hover:border-amber-400"
                        : "bg-white border border-slate-200 opacity-60 grayscale-[0.5] border-dashed hover:opacity-100 hover:grayscale-0 hover:border-indigo-300"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isOwned && (
                      <motion.div 
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        className={cn(
                          "absolute top-1 right-1 lg:top-2 lg:right-2 w-4 h-4 lg:w-5 lg:h-5 rounded-full flex items-center justify-center text-white text-[8px] lg:text-[10px] shadow-sm z-30",
                          isRare ? "bg-amber-500" : "bg-indigo-500"
                        )}
                      >
                        {isRare ? <Star className="w-2.5 h-2.5 fill-current" /> : "✓"}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isRare && !isOwned && (
                    <div className="absolute top-1 right-1 lg:top-2 lg:right-2 text-amber-300 z-10">
                      <Star className="w-3 h-3 lg:w-4 lg:h-4" />
                    </div>
                  )}
                  
                  <div className="flex-1 flex flex-col items-center justify-center p-2 lg:p-4 relative w-full overflow-hidden">
                    {/* Sticker Image Logic */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <AnimatePresence>
                        {isOwned ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full h-full relative"
                          >
                            <Image
                              src={`https://picsum.photos/seed/${stickerCode}${isRare ? '-gold' : ''}/200/300`}
                              alt={stickerCode}
                              fill
                              className={cn(
                                "object-cover transition-all duration-700",
                                isRare ? "brightness-110 contrast-110 saturate-125" : "brightness-95"
                              )}
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            
                            {/* Success Flash Effect */}
                            <motion.div
                              initial={{ opacity: 1 }}
                              animate={{ opacity: 0 }}
                              transition={{ duration: 0.8 }}
                              className="absolute inset-0 bg-white mix-blend-overlay z-20"
                            />
                          </motion.div>
                        ) : (
                          <div className="flex flex-col items-center justify-center opacity-10">
                            {num === 1 ? (
                              <ImageIcon className="w-12 h-12 lg:w-16 lg:h-16 text-slate-400" />
                            ) : (
                              <User className="w-12 h-12 lg:w-16 lg:h-16 text-slate-400" />
                            )}
                          </div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Sticker Label Overlay */}
                    <div className="relative z-20 mt-auto w-full text-center">
                      <div className={cn(
                          "text-lg lg:text-xl font-black font-mono transition-colors drop-shadow-md",
                          isOwned 
                            ? "text-white" 
                            : "text-slate-300"
                      )}>
                        {stickerCode}
                      </div>
                      <div className={cn(
                          "text-[8px] lg:text-[10px] uppercase font-bold mt-0.5 tracking-tight text-center flex flex-col items-center gap-0.5",
                          isOwned 
                            ? isRare ? "text-amber-300 drop-shadow-sm" : "text-white/80 drop-shadow-sm" 
                            : "text-slate-200"
                      )}>
                        {selectedTeam.shortName === 'FWC' 
                          ? (num === 1 ? 'Troféu' : num === 20 ? 'Mascote' : 'Especial')
                          : (num === 1 ? 'Escudo' : num === 20 ? 'Time' : 'Jogador')
                        }
                        {isRare && (
                          <motion.span 
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-[6px] lg:text-[8px] text-amber-600 bg-amber-400/90 px-1 rounded-sm font-black shadow-sm"
                          >
                            RARE ITEM
                          </motion.span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "h-1.5 lg:h-2 w-full rounded-b-[6px] transition-colors relative z-20",
                    isOwned 
                      ? isRare ? "bg-amber-400" : "bg-indigo-500" 
                      : isRare ? "bg-amber-100" : "bg-slate-100"
                  )}></div>

                  {/* Shimmer effect for rare stickers */}
                  {isRare && isOwned && (
                    <motion.div
                      animate={{
                        x: ['-200%', '200%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 1
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full skew-x-12 pointer-events-none z-10"
                    />
                  )}

                  {/* Hover effect for missing stickers - hidden on mobile for better UX */}
                  {!isOwned && !isMobile && (
                    <div className={cn(
                        "absolute inset-0 transition-colors rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 z-30",
                        isRare ? "bg-amber-500/10" : "bg-indigo-600/5"
                    )}>
                      <span className={cn(
                        "text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider shadow-sm",
                        isRare ? "bg-amber-500" : "bg-indigo-600"
                      )}>Collect</span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </main>

        {/* Footer Area */}
        <footer className="bg-white h-auto py-4 lg:h-14 border-t border-slate-200 flex flex-col lg:flex-row items-center px-4 lg:px-10 text-[10px] uppercase tracking-widest text-slate-500 font-bold shrink-0 gap-4 lg:gap-0">
          <div className="flex gap-6 w-full lg:w-auto justify-center lg:justify-start">
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mr-2"></div> 
              Collected
            </div>
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 bg-white border border-slate-300 rounded-full mr-2"></div> 
              Missing
            </div>
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-full mr-2"></div> 
              Rare Item
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row lg:ml-auto gap-3 w-full lg:w-auto">
            <button 
              onClick={exportMissingToCSV}
              className="px-4 py-2 lg:py-1.5 bg-emerald-600 border border-emerald-500 rounded text-white hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-3 h-3" />
              Exportar Faltantes
            </button>
            <button 
              onClick={resetAll}
              className="px-4 py-2 lg:py-1.5 bg-white border border-slate-200 rounded text-slate-400 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3 h-3" />
              Reset System
            </button>
            <div className="hidden lg:block h-6 w-px bg-slate-200 mx-1"></div>
            <div className="px-4 py-2 lg:py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-400 select-none text-center">
              v2.0.5 - Mobile Optimized
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

